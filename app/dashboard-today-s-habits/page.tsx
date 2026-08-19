"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Plus, Flame, Trophy, Target, Calendar, ChevronRight, X, Loader2 } from 'lucide-react';
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
type HABIT_COLORS = any;
const HABIT_COLORS: any = [];
type HABIT_ICONS = any;
const HABIT_ICONS: any = [];
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitCompletion = Database["public"]["Tables"]["habit_completions"]["Row"];

function getTodayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

interface NewHabitForm {
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: string;
}

const DEFAULT_FORM: NewHabitForm = {
  name: "",
  description: "",
  icon: "🎯",
  color: "#5B4CF5",
  frequency: "daily",
};

export default function DashboardPage() {
  const supabase = createClient();
  const today = getTodayDate();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<NewHabitForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("there");

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [habitsRes, completionsRes, profileRes] = await Promise.all([
      supabase.from("habits").select("*").is("archived_at", null).order("created_at", { ascending: true }),
      supabase.from("habit_completions").select("*").eq("completed_date", today),
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    ]);

    if (habitsRes.data) setHabits(habitsRes.data);
    if (completionsRes.data) setCompletions(completionsRes.data);
    if (profileRes.data?.display_name) setDisplayName(profileRes.data.display_name);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("habit_completions_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_completions" },
        () => { fetchData(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const isCompleted = (habitId: string) =>
    completions.some((c) => c.habit_id === habitId && c.completed_date === today);

  const toggleCompletion = async (habit: Habit) => {
    if (toggling) return;
    setToggling(habit.id);
    const already = isCompleted(habit.id);
    if (already) {
      const comp = completions.find((c) => c.habit_id === habit.id && c.completed_date === today);
      if (comp) {
        await supabase.from("habit_completions").delete().eq("id", comp.id);
        setCompletions((prev) => prev.filter((c) => c.id !== comp.id));
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id
              ? { ...h, current_streak: Math.max(0, h.current_streak - 1) }
              : h
          )
        );
      }
    } else {
      const { data } = await supabase.from("habit_completions").insert({
        habit_id: habit.id,
        user_id: userId!,
        completed_date: today,
      }).select().single();
      if (data) {
        setCompletions((prev) => [...prev, data]);
        const newStreak = habit.current_streak + 1;
        await supabase.from("habits").update({
          current_streak: newStreak,
          longest_streak: Math.max(habit.longest_streak, newStreak),
          updated_at: new Date().toISOString(),
        }).eq("id", habit.id);
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id
              ? { ...h, current_streak: newStreak, longest_streak: Math.max(h.longest_streak, newStreak) }
              : h
          )
        );
      }
    }
    setToggling(null);
  };

  const handleAddHabit = async () => {
    if (!form.name.trim() || !userId) return;
    setSaving(true);
    const { data } = await supabase.from("habits").insert({
      user_id: userId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon,
      color: form.color,
      frequency: form.frequency,
      current_streak: 0,
      longest_streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
    if (data) setHabits((prev) => [...prev, data]);
    setForm(DEFAULT_FORM);
    setShowAddModal(false);
    setSaving(false);
  };

  const completedCount = habits.filter((h) => isCompleted(h.id)).length;
  const totalCount = habits.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.longest_streak), 0);
  const totalStreakDays = habits.reduce((sum, h) => sum + h.current_streak, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] pb-24">
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">

        {/* Header */}
        <Reveal>
          <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                {formatDate(today)}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                {getGreeting()}, {displayName}.
              </h1>
              <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                {completedCount === totalCount && totalCount > 0
                  ? "All habits done. Incredible work today."
                  : `${completedCount} of ${totalCount} habits completed today.`}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(91,76,245,0.35)] transition-all duration-200 hover:opacity-90 hover:shadow-[0_4px_20px_rgba(91,76,245,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:mt-0"
            >
              <Plus className="h-4 w-4" />
              New Habit
            </button>
          </div>
        </Reveal>

        {/* Stat Cards */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              {
                icon: <Target className="h-5 w-5" />,
                label: "Today",
                value: `${completedCount}/${totalCount}`,
                sub: "completed",
                color: "text-[var(--accent)]",
                bg: "bg-[var(--accent)]/10",
              },
              {
                icon: <Flame className="h-5 w-5" />,
                label: "Active Streaks",
                value: totalStreakDays,
                sub: "total days",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
              {
                icon: <Trophy className="h-5 w-5" />,
                label: "Best Streak",
                value: longestStreak,
                sub: "days",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: <Calendar className="h-5 w-5" />,
                label: "Completion",
                value: `${completionRate}%`,
                sub: "today",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                <div className={cn("mb-2 inline-flex rounded-lg p-1.5", stat.bg, stat.color)}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stat.value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <Reveal>
            <div className="mb-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">Daily Progress</span>
                <span className="text-sm font-semibold text-[var(--accent)]">{completionRate}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                {completedCount === totalCount
                  ? "Perfect day. All habits complete."
                  : `${totalCount - completedCount} habit${totalCount - completedCount !== 1 ? "s" : ""} remaining`}
              </p>
            </div>
          </Reveal>
        )}

        {/* Habits List */}
        <Reveal>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Today's Habits</h2>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              Full dashboard <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>

        {habits.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] py-16 text-center">
              <span className="mb-3 text-5xl">🌱</span>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">No habits yet</h3>
              <p className="mt-1 max-w-xs text-sm text-[hsl(var(--muted-foreground))]">
                Start building your routine. Add your first habit and begin your streak today.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Add your first habit
              </button>
            </div>
          </Reveal>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {habits.map((habit, i) => {
              const done = isCompleted(habit.id);
              const isToggling = toggling === habit.id;
              return (
                <motion.div
                  key={habit.id}
                  variants={fadeInUp}
                  custom={i}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-200",
                    done
                      ? "border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 opacity-80"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.12)]"
                  )}
                >
                  {/* Icon */}
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: `${habit.color ?? "#5B4CF5"}22` }}
                  >
                    {habit.icon ?? "🎯"}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "truncate font-semibold text-[hsl(var(--foreground))]",
                          done && "line-through opacity-60"
                        )}
                      >
                        {habit.name}
                      </span>
                      {habit.current_streak > 0 && (
                        <span className="flex items-center gap-0.5 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                          <Flame className="h-3 w-3" />
                          {habit.current_streak}
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  {/* Detail link */}
                  <Link
                    href={`/habits/detail?id=${habit.id}`}
                    className="hidden rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] opacity-0 transition-all hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] group-hover:opacity-100 sm:flex"
                    aria-label="View habit details"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  {/* Toggle button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleCompletion(habit)}
                    disabled={isToggling}
                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                      done
                        ? "border-transparent text-white"
                        : "border-[hsl(var(--border))] bg-transparent text-transparent hover:border-[var(--accent)]"
                    )}
                    style={done ? { backgroundColor: habit.color ?? "#5B4CF5" } : {}}
                  >
                    {isToggling ? (
                      <Loader2 className="h-4 w-4 animate-spin text-current" style={{ color: done ? "white" : habit.color ?? "#5B4CF5" }} />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Completed section label */}
        {completedCount > 0 && totalCount > 0 && (
          <Reveal>
            <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
              {completedCount === totalCount
                ? "All done for today. See you tomorrow."
                : `${completedCount} completed`}
            </p>
          </Reveal>
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md rounded-t-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.3)] sm:rounded-3xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">New Habit</h2>
              <button
                onClick={() => { setShowAddModal(false); setForm(DEFAULT_FORM); }}
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                  Habit name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Morning run"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
                  Description <span className="text-[hsl(var(--muted-foreground))]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Why does this habit matter?"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {HABIT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm((f) => ({ ...f, icon }))}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-all",
                        form.icon === icon
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-[hsl(var(--border))] hover:border-[var(--accent)]/50"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Color</label>
                <div className="flex flex-wrap gap-2">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        form.color === color ? "border-[hsl(var(--foreground))] scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); setForm(DEFAULT_FORM); }}
                className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHabit}
                disabled={!form.name.trim() || saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(91,76,245,0.3)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? "Saving..." : "Add Habit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}