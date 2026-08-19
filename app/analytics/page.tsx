"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { BarChart2, TrendingUp, Award, Calendar, Flame, Target, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { APP_NAME } from "@/lib/data";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

type Habit = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  current_streak: number;
  longest_streak: number;
  archived_at: string | null;
};

type Completion = {
  id: string;
  habit_id: string;
  completed_date: string;
};

type HabitStats = {
  habit: Habit;
  completionRate: number;
  completedDays: number;
  totalDays: number;
};

type DayData = {
  label: string;
  short: string;
  pct: number;
  isToday: boolean;
};

type CalendarDay = {
  date: string;
  day: number;
  count: number;
  total: number;
  isEmpty: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getDateString(d));
  }
  return days;
}

function getLast7Days(): { date: string; label: string; short: string; isToday: boolean }[] {
  const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      date: getDateString(d),
      label: DAY_LABELS[d.getDay()],
      short: DAY_SHORT[d.getDay()],
      isToday: i === 0,
    });
  }
  return result;
}

function getCurrentMonthDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: CalendarDay[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: "", day: 0, count: 0, total: 0, isEmpty: true });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date: dateStr, day: d, count: 0, total: 0, isEmpty: false });
  }

  return days;
}

function getHeatmapColor(count: number, total: number): string {
  if (total === 0 || count === 0) return "bg-[var(--muted)]";
  const pct = count / total;
  if (pct < 0.33) return "bg-indigo-200";
  if (pct < 0.66) return "bg-[var(--accent)]/60";
  return "bg-[var(--primary)]";
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[var(--muted)]",
        className
      )}
    />
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6">
        <Skeleton className="h-8 w-8 mb-3" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-16" />
      </div>
    );
  }
  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6 flex flex-col gap-2 hover:card-shadow-hover transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[var(--muted-foreground)]">{icon}</span>
      </div>
      <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)]">{sub}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    setAuthed(true);

    const thirtyDaysAgo = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      return getDateString(d);
    })();

    const [habitsRes, completionsRes] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, color, icon, current_streak, longest_streak, archived_at")
        .is("archived_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_completions")
        .select("id, habit_id, completed_date")
        .gte("completed_date", thirtyDaysAgo),
    ]);

    if (habitsRes.data) setHabits(habitsRes.data as Habit[]);
    if (completionsRes.data) setCompletions(completionsRes.data as Completion[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const last30 = getLast30Days();
  const last7 = getLast7Days();

  const totalHabits = habits.length;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.longest_streak), 0);
  const currentStreakSum = habits.reduce((m, h) => Math.max(m, h.current_streak), 0);

  // This week completion rate
  const thisWeekDates = last7.map((d) => d.date);
  const thisWeekCompletions = completions.filter((c) =>
    thisWeekDates.includes(c.completed_date)
  );
  const maxPossibleThisWeek = totalHabits * 7;
  const thisWeekRate =
    maxPossibleThisWeek > 0
      ? Math.round((thisWeekCompletions.length / maxPossibleThisWeek) * 100)
      : 0;

  // Weekly bar chart data
  const weeklyData: DayData[] = last7.map((day) => {
    const dayCompletions = completions.filter(
      (c) => c.completed_date === day.date
    ).length;
    const pct = totalHabits > 0 ? Math.round((dayCompletions / totalHabits) * 100) : 0;
    return { label: day.label, short: day.short, pct, isToday: day.isToday };
  });

  const bestDayIndex = weeklyData.reduce(
    (best, d, i) => (d.pct > weeklyData[best].pct ? i : best),
    0
  );

  // Habit performance rankings
  const habitStats: HabitStats[] = habits.map((habit) => {
    const completed = completions.filter((c) => c.habit_id === habit.id).length;
    const rate = last30.length > 0 ? Math.round((completed / last30.length) * 100) : 0;
    return {
      habit,
      completionRate: rate,
      completedDays: completed,
      totalDays: last30.length,
    };
  });
  habitStats.sort((a, b) => b.completionRate - a.completionRate);

  // Monthly calendar heatmap
  const now = new Date();
  const calendarDays = getCurrentMonthDays(now.getFullYear(), now.getMonth());
  const calendarWithData = calendarDays.map((cell) => {
    if (cell.isEmpty) return cell;
    const count = completions.filter((c) => c.completed_date === cell.date).length;
    return { ...cell, count, total: totalHabits };
  });

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const currentMonthName = MONTH_NAMES[now.getMonth()];

  // ── Not authenticated ──────────────────────────────────────────────────────

  if (authed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mx-auto mb-6">
            <BarChart2 className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
            Sign in to view your analytics
          </h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            Track your habit performance, streaks, and completion trends over time.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-all duration-200"
          >
            Log in to {APP_NAME}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero ── */}
      <section className="hero-mesh border-b border-[var(--border)] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--primary)] shadow-[0_2px_12px_0_rgba(91,76,245,0.3)]">
                <BarChart2 className="w-5 h-5 text-white" />
              </span>
              <span className="text-sm font-semibold text-[var(--primary)] uppercase tracking-widest">
                Analytics
              </span>
            </div>
            <h1 className="text-display text-[var(--foreground)] tracking-tight text-balance mb-4">
              Your Habit Analytics
            </h1>
            <p className="text-lg text-[var(--muted-foreground)] leading-relaxed max-w-2xl">
              Understand your patterns, celebrate your wins, and keep improving.
            </p>
          </Reveal>

          {/* Stat cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10"
          >
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={<Target className="w-5 h-5" />}
                label="Total Habits"
                value={loading ? "—" : totalHabits}
                sub="Active habits"
                loading={loading}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                label="Best Current Streak"
                value={loading ? "—" : `${currentStreakSum}d`}
                sub="Days in a row"
                loading={loading}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={<Award className="w-5 h-5" />}
                label="All-Time Best Streak"
                value={loading ? "—" : `${bestStreak}d`}
                sub="Longest run ever"
                loading={loading}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="This Week's Rate"
                value={loading ? "—" : `${thisWeekRate}%`}
                sub="Completion rate"
                loading={loading}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Weekly Overview ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-2">
              <BarChart2 className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-h1 text-[var(--foreground)] font-bold">Weekly Overview</h2>
            </div>
            <p className="text-[var(--muted-foreground)] mb-8">
              Your habit completion for each day this week.
            </p>
          </Reveal>

          <Reveal>
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6 md:p-8">
              {loading ? (
                <div className="flex items-end gap-3 h-48">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <Skeleton className="w-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2 md:gap-4 h-48 mb-3">
                    {weeklyData.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                          {day.pct > 0 ? `${day.pct}%` : ""}
                        </span>
                        <div
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${Math.max(day.pct, 4)}%`,
                            backgroundColor: day.isToday
                              ? "var(--accent)"
                              : "var(--primary)",
                            opacity: day.pct === 0 ? 0.2 : 1,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 md:gap-4">
                    {weeklyData.map((day, i) => (
                      <div key={i} className="flex-1 text-center">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            day.isToday
                              ? "text-[var(--primary)] font-bold"
                              : "text-[var(--muted-foreground)]"
                          )}
                        >
                          {day.short}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Best day badge */}
                  {weeklyData[bestDayIndex]?.pct > 0 && (
                    <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)] text-white">
                        <Zap className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          Best Day This Week
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {weeklyData[bestDayIndex].label} with{" "}
                          {weeklyData[bestDayIndex].pct}% completion
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Habit Performance Rankings ── */}
      <section className="py-16 md:py-20 bg-[var(--muted)]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-h1 text-[var(--foreground)] font-bold">Habit Performance</h2>
            </div>
            <p className="text-[var(--muted-foreground)] mb-8">
              Ranked by 30-day completion rate. Keep your top habits strong.
            </p>
          </Reveal>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : habitStats.length === 0 ? (
            <Reveal>
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-10 text-center">
                <Target className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-3" />
                <p className="text-[var(--muted-foreground)] font-medium">
                  No habits yet. Create your first habit to see performance data.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              </div>
            </Reveal>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-3"
            >
              {habitStats.map((stat, index) => (
                <motion.div
                  key={stat.habit.id}
                  variants={fadeInUp}
                  className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-5 flex items-center gap-4 hover:card-shadow-hover transition-shadow duration-300"
                >
                  {/* Rank */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold",
                      index === 0
                        ? "bg-amber-100 text-amber-700"
                        : index === 1
                        ? "bg-slate-100 text-slate-600"
                        : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* Habit icon + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{stat.habit.icon ?? "✨"}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--foreground)] truncate">
                        {stat.habit.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden max-w-[120px]">
                          <div
                            className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                            style={{ width: `${stat.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">
                          {stat.completionRate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {stat.habit.current_streak}d
                    </span>
                  </div>

                  {/* Longest streak */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 hidden sm:flex">
                    <Award className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {stat.habit.longest_streak}d
                    </span>
                  </div>

                  {/* Trend indicator */}
                  <div className="flex-shrink-0">
                    {stat.completionRate >= 70 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <ArrowUp className="w-3 h-3" /> Strong
                      </span>
                    ) : stat.completionRate >= 40 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        Steady
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                        <ArrowDown className="w-3 h-3" /> Needs work
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Monthly Calendar Heatmap ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-h1 text-[var(--foreground)] font-bold">Monthly Activity</h2>
            </div>
            <p className="text-[var(--muted-foreground)] mb-8">
              {currentMonthName} {now.getFullYear()} — darker cells mean more habits completed.
            </p>
          </Reveal>

          <Reveal>
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6 md:p-8">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold text-[var(--muted-foreground)] py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {loading ? (
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarWithData.map((cell, i) => (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200",
                        cell.isEmpty
                          ? "opacity-0 pointer-events-none"
                          : cn(
                              getHeatmapColor(cell.count, cell.total),
                              cell.count > 0
                                ? "text-white"
                                : "text-[var(--muted-foreground)]"
                            )
                      )}
                      title={
                        cell.isEmpty
                          ? undefined
                          : `${cell.date}: ${cell.count}/${cell.total} habits`
                      }
                    >
                      {cell.isEmpty ? "" : cell.day}
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-3 mt-6 flex-wrap">
                <span className="text-xs text-[var(--muted-foreground)] font-medium">Less</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-[var(--muted)]" />
                  <div className="w-5 h-5 rounded bg-indigo-200" />
                  <div className="w-5 h-5 rounded bg-[var(--accent)]/60" />
                  <div className="w-5 h-5 rounded bg-[var(--primary)]" />
                </div>
                <span className="text-xs text-[var(--muted-foreground)] font-medium">More</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
