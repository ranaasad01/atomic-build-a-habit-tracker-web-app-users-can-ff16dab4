"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Check, Plus, X, Flame, Trophy, Target, ChevronRight, Sparkles } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
type HABIT_COLORS = any;
const HABIT_COLORS: any = [];
type HABIT_ICONS = any;
const HABIT_ICONS: any = [];
type HabitColor = any;
const HabitColor: any = [];
type HabitIcon = any;
const HabitIcon: any = [];
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import type { Database } from "@/types/supabase";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitCompletion = Database["public"]["Tables"]["habit_completions"]["Row"];

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const checkVariants: Variants = {
  unchecked: { scale: 1 },
  checked: { scale: [1, 1.25, 1], transition: { duration: 0.3, ease: "easeOut" } },
};

const progressVariants: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (pct: number) => ({
    scaleX: pct / 100,
    originX: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  }),
};

interface AddHabitForm {
  name: string;
  description: string;
  color: HabitColor;
  icon: HabitIcon;
  frequency: string;
}

const DEFAULT_FORM: AddHabitForm = {
  name: "",
  description: "",
  color: HABIT_COLORS[0],
  icon: HABIT_ICONS[0],
  frequency: "daily",
};

export default function DashboardPage() {
  const supabase = createClient();
  const today = getTodayDate();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("there");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddHabitForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [habitsRes, completionsRes, profileRes] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_completions")
        .select("*")
        .eq("completed_date", today),
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    ]);

    if (habitsRes.data) setHabits(habitsRes.data);
    if (completionsRes.data) setCompletions(completionsRes.data);
    if (profileRes.data?.display_name) setDisplayName(profileRes.data.display_name);
    setLoading(false);
  }, [supabase, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("habit_completions_realtime")
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
  }, [supabase, fetchData]);

  const todayCompletionIds = new Set(completions.map((c) => c.habit_id));

  const completedCount = habits.filter((h) => todayCompletionIds.has(h.id)).length;
  const totalCount = habits.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.longest_streak), 0);
  const currentStreak = habits.reduce((max, h) => Math.max(max, h.current_streak), 0);

  const toggleHabit = async (habit: Habit) => {
    if (togglingId) return;
    setTogglingId(habit.id);
    const isDone = todayCompletionIds.has(habit.id);

    if (isDone) {
      const completion = completions.find((c) => c.habit_id === habit.id);
      if (completion) {
        await supabase.from("habit_completions").delete().eq("id", completion.id);
        setCompletions((prev) => prev.filter((c) => c.id !== completion.id));
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("habit_completions")
          .insert({ habit_id: habit.id, user_id: user.id, completed_date: today })
          .select()
          .single();
        if (data) setCompletions((prev) => [...prev, data]);
      }
    }
    setTogglingId(null);
  };

  const handleAddHabit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          color: form.color,
          icon: form.icon,
          frequency: form.frequency,
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single();
      if (data) setHabits((prev) => [...prev, data]);
    }
    setSaving(false);
    setShowModal(false);
    setForm(DEFAULT_FORM);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

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

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
        {/* Header */}
        <Reveal>
          <div className="mb-8">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">
              {formatTodayLabel()}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              {getGreeting()},{" "}
              <span className="text-[var(--accent)]">{displayName}</span>.
            </h1>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">
              {totalCount === 0
                ? "Add your first habit to get started."
                : completedCount === totalCount
                ? "All done for today. Keep it up!"
                : `${totalCount - completedCount} habit${totalCount - completedCount !== 1 ? "s" : ""} left to complete.`}
            </p>
          </div>
        </Reveal>

        {/* Stat Cards */}
        <Reveal delay={0.05}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-3 mb-8"
          >
            {[
              {
                icon: <Target className="w-4 h-4" />,
                value: `${completionPct}%`,
                label: "Today",
                color: "text-[var(--accent)]",
              },
              {
                icon: <Flame className="w-4 h-4" />,
                value: currentStreak,
                label: "Streak",
                color: "text-orange-500",
              },
              {
                icon: <Trophy className="w-4 h-4" />,
                value: bestStreak,
                label: "Best",
                color: "text-yellow-500",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <Reveal delay={0.1}>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Daily Progress
                </span>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent)]"
                  variants={progressVariants}
                  initial="hidden"
                  animate="visible"
                  custom={completionPct}
                />
              </div>
            </div>
          </Reveal>
        )}

        {/* Habit List */}
        {totalCount === 0 ? (
          <Reveal delay={0.12}>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🌱</div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                No habits yet
              </h2>
              <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-xs">
                Start small. Add one habit and build momentum from there.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(91,76,245,0.35)] transition-all duration-200 hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add your first habit
              </motion.button>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.12}>
            <div className="space-y-3 mb-6">
              <AnimatePresence initial={false}>
                {habits.map((habit, i) => {
                  const isDone = todayCompletionIds.has(habit.id);
                  const isToggling = togglingId === habit.id;
                  return (
                    <motion.div
                      key={habit.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.06)] ${
                        isDone
                          ? "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                      }`}
                    >
                      {/* Color dot + icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${habit.color ?? HABIT_COLORS[0]}22` }}
                      >
                        <span>{habit.icon ?? "🎯"}</span>
                      </div>

                      {/* Name + streak */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate transition-colors duration-200 ${
                            isDone
                              ? "line-through text-[hsl(var(--muted-foreground))]"
                              : "text-[hsl(var(--foreground))]"
                          }`}
                        >
                          {habit.name}
                        </p>
                        {habit.current_streak > 0 && (
                          <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                            <Flame className="w-3 h-3" />
                            {habit.current_streak} day streak
                          </p>
                        )}
                      </div>

                      {/* Check button */}
                      <motion.button
                        variants={checkVariants}
                        animate={isDone ? "checked" : "unchecked"}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleHabit(habit)}
                        disabled={isToggling}
                        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          isDone
                            ? "border-[var(--accent)] bg-[var(--accent)]"
                            : "border-[hsl(var(--border))] bg-transparent hover:border-[var(--accent)]"
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {isDone && (
                            <motion.span
                              key="check"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Add habit button (inline) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[hsl(var(--border))] py-4 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add a habit
            </motion.button>
          </Reveal>
        )}
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-x-4 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-[hsl(var(--card))] p-6 shadow-[0_-8px_40px_rgba(0,0,0,0.18)] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">New Habit</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Habit name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Morning run"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional note"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                  />
                </div>

                {/* Icon picker */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setForm((f) => ({ ...f, icon }))}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all duration-150 ${
                          form.icon === icon
                            ? "ring-2 ring-[var(--accent)] bg-[var(--accent)]/10 scale-110"
                            : "hover:bg-[hsl(var(--muted))]"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {HABIT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setForm((f) => ({ ...f, color: color as HabitColor }))}
                        className={`w-7 h-7 rounded-full transition-all duration-150 ${
                          form.color === color ? "ring-2 ring-offset-2 ring-[hsl(var(--foreground))] scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddHabit}
                  disabled={saving || !form.name.trim()}
                  className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(91,76,245,0.3)] transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {saving ? "Saving..." : "Add Habit"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}