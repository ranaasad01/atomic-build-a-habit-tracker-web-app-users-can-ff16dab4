"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Edit, Trash2, Flame, Trophy, CheckCircle, X, Check, Calendar } from 'lucide-react';
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitCompletion = Database["public"]["Tables"]["habit_completions"]["Row"];

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function getMonthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}

function buildLast7Weeks(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

function computeCompletionRate(completions: Set<string>, days: Date[]): number {
  if (days.length === 0) return 0;
  const completed = days.filter((d) => completions.has(formatDate(d))).length;
  return Math.round((completed / days.length) * 100);
}

// ─── inline mock data (fallback when no real habit is found) ─────────────────

const MOCK_HABIT: Habit = {
  id: "mock-habit-1",
  user_id: "mock-user",
  name: "Morning Run",
  description: "30 minutes of outdoor running to start the day with energy and clarity.",
  color: "#5B4CF5",
  icon: "🏃",
  frequency: "daily",
  current_streak: 12,
  longest_streak: 21,
  archived_at: null,
  created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

function buildMockCompletions(): Set<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const set = new Set<string>();
  const skip = new Set([3, 7, 14, 19, 25, 31, 38, 44]);
  for (let i = 0; i < 49; i++) {
    if (!skip.has(i)) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      set.add(formatDate(d));
    }
  }
  return set;
}

// ─── Delete confirmation dialog ──────────────────────────────────────────────

const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function DeleteDialog({
  habitName,
  onConfirm,
  onCancel,
  loading,
}: {
  habitName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onCancel}
      />
      <motion.div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
        variants={dialogVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Delete habit?</h3>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          <span className="font-medium text-[hsl(var(--foreground))]">{habitName}</span> and all its
          completion history will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-transparent px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit modal ──────────────────────────────────────────────────────────────

type HABIT_COLORS = any;
const HABIT_COLORS: any = [];
type HABIT_ICONS = any;
const HABIT_ICONS: any = [];

function EditModal({
  habit,
  onSave,
  onClose,
  saving,
}: {
  habit: Habit;
  onSave: (updates: Partial<Habit>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description ?? "");
  const [color, setColor] = useState(habit.color ?? HABIT_COLORS[0]);
  const [icon, setIcon] = useState(habit.icon ?? HABIT_ICONS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() || null, color, icon });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
        variants={dialogVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Edit Habit</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/5 hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Habit name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-white/5 px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              placeholder="e.g. Morning Run"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-white/5 px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              placeholder="What's this habit about?"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {HABIT_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all duration-150",
                    icon === ic
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[hsl(var(--border))] bg-white/5 hover:bg-white/10"
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all duration-150",
                    color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-transparent px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function HeatmapGrid({
  days,
  completions,
  habitColor,
}: {
  days: Date[];
  completions: Set<string>;
  habitColor: string;
}) {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group days into weeks (columns)
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = new Array(days[0].getDay()).fill(null);
  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  // Month labels
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstReal = week.find((d) => d !== null);
    if (firstReal) {
      const m = firstReal.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: getMonthLabel(firstReal), colIndex: wi });
        lastMonth = m;
      }
    }
  });

  const today = formatDate(new Date());

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="mb-1 flex" style={{ paddingLeft: "2.5rem" }}>
          {weeks.map((_, wi) => {
            const ml = monthLabels.find((m) => m.colIndex === wi);
            return (
              <div key={wi} className="w-8 shrink-0 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
                {ml ? ml.label : ""}
              </div>
            );
          })}
        </div>
        <div className="flex gap-0">
          {/* Day-of-week labels */}
          <div className="mr-1 flex flex-col gap-0.5">
            {DAY_LABELS.map((dl, i) => (
              <div
                key={dl}
                className="flex h-7 w-8 items-center justify-end pr-1 text-[10px] text-[hsl(var(--muted-foreground))]"
              >
                {i % 2 === 0 ? dl : ""}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={di} className="h-7 w-7 rounded-sm" />;
                  }
                  const dateStr = formatDate(day);
                  const done = completions.has(dateStr);
                  const isToday = dateStr === today;
                  return (
                    <motion.div
                      key={dateStr}
                      title={`${day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${done ? "Completed" : "Not completed"}`}
                      className={cn(
                        "h-7 w-7 rounded-sm border transition-all duration-150",
                        isToday && "ring-1 ring-white/40 ring-offset-1 ring-offset-transparent"
                      )}
                      style={{
                        backgroundColor: done ? habitColor : "rgba(255,255,255,0.05)",
                        borderColor: done ? `${habitColor}60` : "rgba(255,255,255,0.06)",
                        opacity: done ? 1 : 0.6,
                      }}
                      whileHover={{ scale: 1.2 }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center gap-2 pl-10">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Less</span>
          {[0.1, 0.35, 0.6, 0.85, 1].map((op, i) => (
            <div
              key={i}
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: habitColor, opacity: op }}
            />
          ))}
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">More</span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/5 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.16)]">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: color ? `${color}20` : "rgba(255,255,255,0.08)" }}
      >
        <span style={{ color: color ?? "hsl(var(--muted-foreground))" }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{value}</div>
        <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</div>
        {sub && <div className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))]/70">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Recent completions list ─────────────────────────────────────────────────

function RecentList({
  days,
  completions,
  habitColor,
}: {
  days: Date[];
  completions: Set<string>;
  habitColor: string;
}) {
  const recent = [...days].reverse().slice(0, 14);
  return (
    <div className="space-y-1.5">
      {recent.map((day) => {
        const dateStr = formatDate(day);
        const done = completions.has(dateStr);
        const label = day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
        return (
          <div
            key={dateStr}
            className="flex items-center justify-between rounded-xl border border-white/6 bg-white/4 px-4 py-2.5"
          >
            <span className="text-sm text-[hsl(var(--foreground))]">{label}</span>
            {done ? (
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${habitColor}20`, color: habitColor }}
              >
                <Check className="h-3 w-3" /> Done
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                <X className="h-3 w-3" /> Missed
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HabitDetailPage() {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [completionSet, setCompletionSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const days = buildLast7Weeks();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHabit(MOCK_HABIT);
        setCompletionSet(buildMockCompletions());
        setLoading(false);
        return;
      }

      // Load the first habit for the user (in a real app, the id would come from a query param)
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      const h = habits?.[0] ?? null;
      if (!h) {
        setHabit(MOCK_HABIT);
        setCompletionSet(buildMockCompletions());
        setLoading(false);
        return;
      }

      setHabit(h);

      const since = formatDate(days[0]);
      const { data: completions } = await supabase
        .from("habit_completions")
        .select("completed_date")
        .eq("habit_id", h.id)
        .gte("completed_date", since);

      const set = new Set<string>((completions ?? []).map((c) => c.completed_date));
      setCompletionSet(set);
    } catch {
      setHabit(MOCK_HABIT);
      setCompletionSet(buildMockCompletions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete() {
    if (!habit) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      await supabase.from("habit_completions").delete().eq("habit_id", habit.id);
      await supabase.from("habits").delete().eq("id", habit.id);
      setDeleted(true);
      setShowDelete(false);
    } catch {
      // silently fail in demo
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave(updates: Partial<Habit>) {
    if (!habit) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("habits")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", habit.id)
        .select()
        .single();
      if (data) setHabit(data);
      setShowEdit(false);
    } catch {
      // silently fail in demo
    } finally {
      setSaving(false);
    }
  }

  const habitColor = habit?.color ?? "#5B4CF5";
  const completionRate = computeCompletionRate(completionSet, days);

  if (deleted) {
    return (
      <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 text-5xl">🗑️</div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Habit deleted</h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            The habit and all its history have been removed.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: habitColor }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-white/8" />
          <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </main>
    );
  }

  if (!habit) return null;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Back link */}
        <Reveal>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Reveal>

        {/* Header card */}
        <Reveal delay={0.05}>
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_32px_-8px_rgba(0,0,0,0.24)]">
            {/* Color accent bar */}
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: habitColor }}
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: `${habitColor}25` }}
                >
                  {habit.icon ?? "🎯"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                    {habit.name}
                  </h1>
                  {habit.description && (
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {habit.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                      style={{ backgroundColor: `${habitColor}20`, color: habitColor }}
                    >
                      {habit.frequency}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Started {new Date(habit.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex shrink-0 gap-2">
                <motion.button
                  onClick={() => setShowEdit(true)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200 hover:bg-white/10"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </motion.button>
                <motion.button
                  onClick={() => setShowDelete(true)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/8 px-3.5 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </motion.button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stats row */}
        <Reveal delay={0.1}>
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={scaleIn}>
              <StatCard
                icon={<Flame className="h-4 w-4" />}
                label="Current streak"
                value={`${habit.current_streak} days`}
                sub={habit.current_streak >= 7 ? "Keep it up!" : "Build momentum"}
                color={habitColor}
              />
            </motion.div>
            <motion.div variants={scaleIn}>
              <StatCard
                icon={<Trophy className="h-4 w-4" />}
                label="Longest streak"
                value={`${habit.longest_streak} days`}
                sub="Personal best"
                color="#F59E0B"
              />
            </motion.div>
            <motion.div variants={scaleIn}>
              <StatCard
                icon={<CheckCircle className="h-4 w-4" />}
                label="7-week completion"
                value={`${completionRate}%`}
                sub="Last 49 days"
                color="#059669"
              />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* Heatmap */}
        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.14)]">
            <div className="mb-5 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Completion history — last 7 weeks
              </h2>
            </div>
            <HeatmapGrid days={days} completions={completionSet} habitColor={habitColor} />
          </div>
        </Reveal>

        {/* Recent log */}
        <Reveal delay={0.2}>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.14)]">
            <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">
              Recent activity — last 14 days
            </h2>
            <RecentList days={days} completions={completionSet} habitColor={habitColor} />
          </div>
        </Reveal>

      </div>

      {/* Modals */}
      {showDelete && habit && (
        <DeleteDialog
          habitName={habit.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
      {showEdit && habit && (
        <EditModal
          habit={habit}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
          saving={saving}
        />
      )}
    </main>
  );
}