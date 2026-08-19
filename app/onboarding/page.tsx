"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Check, ChevronRight, ChevronLeft, Plus, Flame, Bell, Sparkles, X } from 'lucide-react';
import { APP_NAME } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";

// ─── Types ──────────────────────────────────────────────────────────────────

type Frequency = "daily" | "weekdays" | "weekends";

interface HabitDraft {
  name: string;
  color: string;
  frequency: Frequency;
}

const EMPTY_HABIT: HabitDraft = {
  name: "",
  color: "#5B4CF5",
  frequency: "daily",
};

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_SWATCHES = [
  { hex: "#5B4CF5", label: "Indigo" },
  { hex: "#7C3AED", label: "Violet" },
  { hex: "#059669", label: "Emerald" },
  { hex: "#D97706", label: "Amber" },
  { hex: "#E11D48", label: "Rose" },
  { hex: "#0EA5E9", label: "Sky" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
];

const QUICK_TIMES = [
  { label: "Morning", time: "07:00", display: "7:00 AM" },
  { label: "Midday", time: "12:00", display: "12:00 PM" },
  { label: "Evening", time: "20:00", display: "8:00 PM" },
];

// Total content steps (not counting welcome=0 and done=5)
const TOTAL_STEPS = 4; // steps 1–4

// ─── Slide variants ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  }),
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  // Only show for steps 1–4
  if (step === 0 || step === 5) return null;
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-xs font-medium text-[var(--primary)]">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--primary)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function HabitPreviewCard({ habit }: { habit: HabitDraft }) {
  if (!habit.name.trim()) return null;
  return (
    <div
      className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-center gap-3"
      style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: habit.color + "22" }}
      >
        <Flame className="w-4 h-4" style={{ color: habit.color }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {habit.name}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] capitalize">
          {habit.frequency}
        </p>
      </div>
      <div
        className="ml-auto w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: habit.color }}
      />
    </div>
  );
}

function HabitForm({
  habit,
  onChange,
  defaultColor,
}: {
  habit: HabitDraft;
  onChange: (updated: HabitDraft) => void;
  defaultColor?: string;
}) {
  return (
    <div className="space-y-5">
      {/* Name input */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Habit name
        </label>
        <input
          type="text"
          value={habit.name}
          onChange={(e) => onChange({ ...habit, name: e.target.value })}
          placeholder="e.g. Morning meditation"
          maxLength={80}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Color
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.hex}
              type="button"
              aria-label={swatch.label}
              onClick={() => onChange({ ...habit, color: swatch.hex })}
              className={cn(
                "w-8 h-8 rounded-full border-2 cursor-pointer transition-all duration-200 focus:outline-none",
                habit.color === swatch.hex
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-offset-2 scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Frequency
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...habit, frequency: opt.value })}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
                habit.frequency === opt.value
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_2px_8px_0_rgba(91,76,245,0.25)]"
                  : "bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <HabitPreviewCard habit={habit} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Habit drafts
  const [habit1, setHabit1] = useState<HabitDraft>({
    ...EMPTY_HABIT,
    color: COLOR_SWATCHES[0].hex,
  });
  const [habit2, setHabit2] = useState<HabitDraft>({
    ...EMPTY_HABIT,
    color: COLOR_SWATCHES[2].hex,
  });
  const [habit3, setHabit3] = useState<HabitDraft>({
    ...EMPTY_HABIT,
    color: COLOR_SWATCHES[3].hex,
  });

  // Reminder
  const [reminderTime, setReminderTime] = useState("08:00");
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Submission
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdHabits, setCreatedHabits] = useState<string[]>([]);

  // Auth check on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/signup");
      } else {
        setUserId(data.user.id);
        setAuthChecked(true);
      }
    });
  }, []);

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function skip() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);

    const habitsToSave = [
      habit1,
      habit2.name.trim() ? habit2 : null,
      habit3.name.trim() ? habit3 : null,
    ].filter(Boolean) as HabitDraft[];

    const inserts = habitsToSave.map((h) => ({
      user_id: userId,
      name: h.name.trim(),
      color: h.color,
      frequency: h.frequency,
      description: null,
      icon: null,
      current_streak: 0,
      longest_streak: 0,
    }));

    const { error } = await supabase.from("habits").insert(inserts);

    if (error) {
      setSaveError("Something went wrong saving your habits. Please try again.");
      setSaving(false);
      return;
    }

    // Store reminder in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("streakly_reminder_time", reminderTime);
      localStorage.setItem(
        "streakly_reminders_enabled",
        remindersEnabled ? "true" : "false"
      );
    }

    setCreatedHabits(habitsToSave.map((h) => h.name.trim()));
    setSaving(false);
    setDirection(1);
    setStep(5);
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen hero-mesh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-mesh flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <ProgressBar step={step} />

        <AnimatePresence mode="wait" custom={direction}>
          {/* ── STEP 0: Welcome ── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="visible"
              animate="center"
              exit="exit"
              className="bg-[var(--card)] rounded-3xl border border-[var(--border)] card-shadow p-8 text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-[0_4px_24px_0_rgba(91,76,245,0.35)]">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight mb-3">
                Welcome to {APP_NAME}! 🎉
              </h1>
              <p className="text-[var(--muted-foreground)] leading-relaxed mb-8 max-w-sm mx-auto">
                Let&apos;s set up your habit tracker in just a few minutes. You&apos;ll create
                your first habits and set a daily reminder.
              </p>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === 0
                        ? "w-6 h-2 bg-[var(--primary)]"
                        : "w-2 h-2 bg-[var(--border)]"
                    )}
                  />
                ))}
              </div>

              <button
                onClick={goNext}
                className="w-full py-3.5 rounded-2xl bg-[var(--primary)] text-white font-semibold text-base shadow-[0_4px_16px_0_rgba(91,76,245,0.3)] hover:bg-[var(--primary-hover)] transition-all duration-200 flex items-center justify-center gap-2"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── STEP 1: Habit 1 ── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="visible"
              animate="center"
              exit="exit"
              className="bg-[var(--card)] rounded-3xl border border-[var(--border)] card-shadow p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                    Create your first habit
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Start with something small and achievable.
                  </p>
                </div>
              </div>

              <HabitForm habit={habit1} onChange={setHabit1} />

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!habit1.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Habit 2 ── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="visible"
              animate="center"
              exit="exit"
              className="bg-[var(--card)] rounded-3xl border border-[var(--border)] card-shadow p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                    Add a second habit
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Two habits are better than one.
                  </p>
                </div>
              </div>

              <HabitForm habit={habit2} onChange={setHabit2} />

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={skip}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                  Skip
                </button>
                <button
                  onClick={goNext}
                  disabled={!habit2.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Habit 3 ── */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={slideVariants}
              initial="visible"
              animate="center"
              exit="exit"
              className="bg-[var(--card)] rounded-3xl border border-[var(--border)] card-shadow p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                    One more habit{" "}
                    <span className="text-[var(--muted-foreground)] font-normal text-base">
                      (optional)
                    </span>
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Three habits is a great starting point.
                  </p>
                </div>
              </div>

              <HabitForm habit={habit3} onChange={setHabit3} />

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={skip}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                  Skip
                </button>
                <button
                  onClick={goNext}
                  disabled={!habit3.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Reminder ── */}
          {step === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={slideVariants}
              initial="visible"
              animate="center"
              exit="exit"
              className="bg-[var(--card)] rounded-3xl border border-[var(--border)] card-shadow p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                    Set your daily reminder
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    We&apos;ll nudge you at the right time.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Time picker */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    When should we remind you to check in?
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Quick select */}
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                    Quick select
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {QUICK_TIMES.map((qt) => (
                      <button
                        key={qt.time}
                        type="button"
                        onClick={() => setReminderTime(qt.time)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
                          reminderTime === qt.time
                            ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_2px_8px_0_rgba(91,76,245,0.25)]"
                            : "bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        )}
                      >
                        {qt.label}{" "}
                        <span className="opacity-70">({qt.display})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Enable daily reminders
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      You can change this anytime in Settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={remindersEnabled}
                    onClick={() => setRemindersEnabled((v) => !v)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2",
                      remindersEnabled ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                        remindersEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {saveError && (
                  <p className="text-sm text-[var(--destructive)] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {saveError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Finish Setup
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Done ── */}
          {step === 5 && (
            <motion.div
              key="step-5"
              custom={direction}
              variants={slideVariants}
              initial="visible"
              animate="center"
              exit="exit"
              className="bg-[var(--card)] rounded-3xl border border-[var(--border)] card-shadow p-8 text-center"
            >
              {/* Celebration icon */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="flex justify-center mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-[0_8px_32px_0_rgba(91,76,245,0.4)]">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
              </motion.div>

              {/* Confetti dots */}
              <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
                {["#5B4CF5", "#059669", "#D97706", "#E11D48", "#0EA5E9", "#7C3AED"].map(
                  (color, i) => (
                    <motion.div
                      key={color}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ y: 0, opacity: 0 }}
                      animate={{ y: [-8, 0], opacity: [0, 1, 0.8] }}
                      transition={{ delay: 0.2 + i * 0.07, duration: 0.5 }}
                    />
                  )
                )}
              </div>

              <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight mb-2">
                You&apos;re all set! 🚀
              </h2>
              <p className="text-[var(--muted-foreground)] leading-relaxed mb-6">
                Your habits are ready. Show up every day and watch your streaks grow.
              </p>

              {/* Summary */}
              {createdHabits.length > 0 && (
                <div className="bg-[var(--background)] rounded-2xl border border-[var(--border)] p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                    Habits created
                  </p>
                  <ul className="space-y-2">
                    {createdHabits.map((name, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href="/dashboard"
                className="block w-full py-3.5 rounded-2xl bg-[var(--primary)] text-white font-semibold text-base shadow-[0_4px_16px_0_rgba(91,76,245,0.3)] hover:bg-[var(--primary-hover)] transition-all duration-200 text-center"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
