"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Trophy, Calendar, CheckCircle, Circle, ChevronLeft, ChevronRight, Star, Clock } from 'lucide-react';
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitCompletion = Database["public"]["Tables"]["habit_completions"]["Row"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function buildWeeklyData(completions: HabitCompletion[]) {
  const today = new Date();
  const result: { label: string; completed: boolean; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    result.push({
      label: DAYS[d.getDay()],
      completed: completions.some((c) => c.completed_date === dateStr),
      date: dateStr,
    });
  }
  return result;
}

function buildMonthlyGrid(
  year: number,
  month: number,
  completions: HabitCompletion[]
) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const completedSet = new Set(
    completions
      .filter((c) => {
        const d = new Date(c.completed_date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((c) => new Date(c.completed_date).getDate())
  );
  const cells: { day: number | null; completed: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, completed: false, isToday: false });
  }
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d;
    cells.push({ day: d, completed: completedSet.has(d), isToday });
  }
  return cells;
}

function computeCompletionRate(completions: HabitCompletion[], days: number): number {
  const today = new Date();
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (completions.some((c) => c.completed_date === formatDate(d))) count++;
  }
  return days > 0 ? Math.round((count / days) * 100) : 0;
}

export default function HabitDetailHistoryPage() {
  const supabase = createClient();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [togglingDate, setTogglingDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .limit(1);

    if (habits && habits.length > 0) {
      const h = habits[0];
      setHabit(h);
      const { data: comps } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("habit_id", h.id)
        .order("completed_date", { ascending: false });
      setCompletions(comps ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!habit) return;
    const channel = supabase
      .channel("habit-completions-detail")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_completions" },
        () => {
          fetchData();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [habit, supabase, fetchData]);

  const toggleCompletion = async (dateStr: string) => {
    if (!habit || togglingDate) return;
    setTogglingDate(dateStr);
    const existing = completions.find((c) => c.completed_date === dateStr);
    if (existing) {
      await supabase.from("habit_completions").delete().eq("id", existing.id);
      setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      const { data: newComp } = await supabase
        .from("habit_completions")
        .insert({ habit_id: habit.id, completed_date: dateStr })
        .select()
        .single();
      if (newComp) setCompletions((prev) => [newComp, ...prev]);
    }
    setTogglingDate(null);
  };

  const weeklyData = completions.length >= 0 ? buildWeeklyData(completions) : [];
  const calendarCells = buildMonthlyGrid(calendarYear, calendarMonth, completions);
  const rate30 = computeCompletionRate(completions, 30);
  const rate7 = computeCompletionRate(completions, 7);

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const accentColor = habit?.color ?? "#5B4CF5";
  const habitIcon = habit?.icon ?? "🎯";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent"
        />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">🎯</span>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">No habit found</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-center max-w-sm">
          Create your first habit on the dashboard to start tracking your progress here.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] pb-24">
      {/* Back nav */}
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Hero header */}
      <Reveal className="mx-auto max-w-4xl px-4 pt-6">
        <div
          className="rounded-2xl border border-white/10 p-6 md:p-8"
          style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}08 100%)` }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-lg"
                style={{ background: `${accentColor}33`, border: `1.5px solid ${accentColor}55` }}
              >
                {habitIcon}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                  {habit.name}
                </h1>
                {habit.description && (
                  <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                    {habit.description}
                  </p>
                )}
                <span
                  className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  style={{ background: `${accentColor}22`, color: accentColor }}
                >
                  {habit.frequency}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="text-xl font-bold">{habit.current_streak}</span>
                </div>
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Current streak</p>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-500">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xl font-bold">{habit.longest_streak}</span>
                </div>
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Best streak</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats row */}
      <Reveal className="mx-auto max-w-4xl px-4 pt-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            {
              label: "7-day rate",
              value: `${rate7}%`,
              icon: <Star className="h-4 w-4" />,
              color: "text-yellow-500",
            },
            {
              label: "30-day rate",
              value: `${rate30}%`,
              icon: <Calendar className="h-4 w-4" />,
              color: "text-blue-500",
            },
            {
              label: "Total completions",
              value: completions.length,
              icon: <CheckCircle className="h-4 w-4" />,
              color: "text-green-500",
            },
            {
              label: "Days tracked",
              value: (() => {
                if (completions.length === 0) return 0;
                const oldest = completions[completions.length - 1];
                const start = new Date(oldest.completed_date);
                const now = new Date();
                return Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000) + 1);
              })(),
              icon: <Clock className="h-4 w-4" />,
              color: "text-purple-500",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={scaleIn}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
            >
              <div className={`flex items-center justify-center gap-1 ${stat.color}`}>
                {stat.icon}
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </Reveal>

      {/* This week */}
      <Reveal className="mx-auto max-w-4xl px-4 pt-8">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
          <h2 className="mb-4 text-base font-semibold text-[hsl(var(--foreground))]">This Week</h2>
          <div className="flex items-end justify-between gap-2">
            {weeklyData.map((day) => {
              const isToggling = togglingDate === day.date;
              return (
                <button
                  key={day.date}
                  onClick={() => toggleCompletion(day.date)}
                  disabled={!!togglingDate}
                  className="flex flex-1 flex-col items-center gap-2 group"
                  aria-label={`${day.label} — ${day.completed ? "completed" : "not completed"}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200"
                    style={
                      day.completed
                        ? { background: accentColor, borderColor: accentColor }
                        : { background: "transparent", borderColor: "hsl(var(--border))" }
                    }
                  >
                    {isToggling ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      />
                    ) : day.completed ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Circle className="h-5 w-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors" />
                    )}
                  </motion.div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    {day.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Calendar */}
      <Reveal className="mx-auto max-w-4xl px-4 pt-6">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              {MONTHS[calendarMonth]} {calendarYear}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-[hsl(var(--muted-foreground))]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return <div key={`empty-${idx}`} />;
              }
              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
              const isToggling = togglingDate === dateStr;
              return (
                <motion.button
                  key={dateStr}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleCompletion(dateStr)}
                  disabled={!!togglingDate}
                  aria-label={`${MONTHS[calendarMonth]} ${cell.day} — ${cell.completed ? "completed" : "not completed"}`}
                  className="relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-150"
                  style={
                    cell.completed
                      ? { background: accentColor, color: "#fff" }
                      : cell.isToday
                      ? {
                          background: "transparent",
                          color: accentColor,
                          outline: `2px solid ${accentColor}`,
                          outlineOffset: "-2px",
                        }
                      : {
                          background: "transparent",
                          color: "hsl(var(--foreground))",
                        }
                  }
                >
                  {isToggling ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                      className="h-3 w-3 rounded-full border-2 border-current border-t-transparent"
                    />
                  ) : (
                    cell.day
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: accentColor }}
              />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-[hsl(var(--border))]" />
              Not completed
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ outline: `2px solid ${accentColor}`, outlineOffset: "-1px" }}
              />
              Today
            </span>
          </div>
        </div>
      </Reveal>

      {/* Recent completions log */}
      <Reveal className="mx-auto max-w-4xl px-4 pt-6">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
          <h2 className="mb-4 text-base font-semibold text-[hsl(var(--foreground))]">
            Recent Completions
          </h2>
          {completions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-4xl">📅</span>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                No completions yet. Start checking off days above!
              </p>
            </div>
          ) : (
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="divide-y divide-[hsl(var(--border))]"
            >
              {completions.slice(0, 15).map((comp) => {
                const d = new Date(comp.completed_date + "T00:00:00");
                const label = d.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                return (
                  <motion.li
                    key={comp.id}
                    variants={fadeInUp}
                    className="flex items-center gap-3 py-3"
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${accentColor}22` }}
                    >
                      <CheckCircle className="h-4 w-4" style={{ color: accentColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                        {label}
                      </p>
                      {comp.note && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                          {comp.note}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleCompletion(comp.completed_date)}
                      disabled={!!togglingDate}
                      className="ml-2 rounded-lg px-2.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-colors duration-150"
                      aria-label="Remove completion"
                    >
                      Remove
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
          {completions.length > 15 && (
            <p className="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Showing 15 of {completions.length} completions
            </p>
          )}
        </div>
      </Reveal>

      {/* Motivational footer CTA */}
      <Reveal className="mx-auto max-w-4xl px-4 pt-8">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`, border: `1px solid ${accentColor}30` }}
        >
          <p className="text-lg font-semibold text-[hsl(var(--foreground))]">
            {habit.current_streak > 0
              ? `You're on a ${habit.current_streak}-day streak. Keep it going!`
              : "Start your streak today. Every journey begins with a single step."}
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Your best streak is {habit.longest_streak} {habit.longest_streak === 1 ? "day" : "days"}.
            {habit.longest_streak > 0 && habit.current_streak < habit.longest_streak
              ? " You can beat it."
              : ""}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: accentColor }}
          >
            <CheckCircle className="h-4 w-4" />
            Mark Today Complete
          </Link>
        </div>
      </Reveal>
    </main>
  );
}