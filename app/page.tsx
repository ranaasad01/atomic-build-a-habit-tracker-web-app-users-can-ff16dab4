"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from "@/lib/data";
type HABIT_ICONS = any;
const HABIT_ICONS: any = [];
type HABIT_COLORS = any;
const HABIT_COLORS: any = [];
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Check, Flame, BarChart2, Bell, Repeat, Star, ArrowRight, Zap, Shield, Calendar } from 'lucide-react';

// ─── Inline data ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Flame,
    title: "Streak Tracking",
    description:
      "Never lose momentum. Streakly counts every consecutive day you complete a habit and celebrates your milestones.",
    color: "#F59E0B",
  },
  {
    icon: Calendar,
    title: "Daily Check-ins",
    description:
      "A clean, distraction-free view of today's habits. Tap once to mark complete and move on with your day.",
    color: "#5B4CF5",
  },
  {
    icon: BarChart2,
    title: "Progress Insights",
    description:
      "Visual history calendars and completion-rate charts show exactly where you're thriving and where to improve.",
    color: "#059669",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Set custom reminder times per habit so you never forget — without the notification fatigue of generic apps.",
    color: "#3B82F6",
  },
  {
    icon: Repeat,
    title: "Flexible Frequency",
    description:
      "Daily, weekdays, weekends, or custom days. Build habits that fit your real schedule, not an ideal one.",
    color: "#EC4899",
  },
  {
    icon: Shield,
    title: "Private by Default",
    description:
      "Your habits are yours. Row-level security means your data is never visible to anyone but you.",
    color: "#14B8A6",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create a habit",
    description:
      "Name it, pick an icon and color, set your frequency. Takes under 30 seconds.",
  },
  {
    step: "02",
    title: "Check in daily",
    description:
      "Open your dashboard each day, tap the habits you completed. That's it.",
  },
  {
    step: "03",
    title: "Watch streaks grow",
    description:
      "Streakly tracks your consecutive days automatically and surfaces your longest runs.",
  },
  {
    step: "04",
    title: "Review and refine",
    description:
      "Use the history calendar and completion charts to spot patterns and adjust your routine.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "I've tried every habit app out there. Streakly is the first one I've actually stuck with for more than a week.",
    name: "Maya R.",
    role: "Product designer",
    avatar: "/images/maya-product-designer-avatar.jpg",
    streak: 47,
  },
  {
    quote:
      "The streak counter is weirdly motivating. I genuinely don't want to break my reading streak now.",
    name: "James T.",
    role: "Software engineer",
    avatar: "/images/james-software-engineer-avatar.jpg",
    streak: 83,
  },
  {
    quote:
      "Clean, fast, and it doesn't try to gamify everything to death. Just the right amount of encouragement.",
    name: "Priya K.",
    role: "Freelance writer",
    avatar: "/images/priya-freelance-writer-avatar.jpg",
    streak: 31,
  },
] as const;

const STATS = [
  { value: "2.4M+", label: "Habits tracked" },
  { value: "180K+", label: "Active users" },
  { value: "94%", label: "30-day retention" },
  { value: "4.9", label: "App store rating" },
] as const;

const SAMPLE_HABITS = [
  { icon: "🏃", name: "Morning run", streak: 14, color: "#5B4CF5", done: true },
  { icon: "💧", name: "Drink 2L water", streak: 7, color: "#3B82F6", done: true },
  { icon: "📖", name: "Read 20 pages", streak: 22, color: "#059669", done: false },
  { icon: "🧘", name: "Meditate", streak: 5, color: "#A78BFA", done: false },
] as const;

// ─── Hero mock UI ────────────────────────────────────────────────────────────

function HeroMockUI() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
      className="relative mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-5 shadow-[0_8px_40px_-8px_rgba(91,76,245,0.35)]"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Today</p>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Monday, June 9</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-3 py-1">
          <Flame className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span className="text-xs font-bold text-[var(--accent)]">14 day streak</span>
        </div>
      </div>

      {/* Habit rows */}
      <div className="space-y-2.5">
        {SAMPLE_HABITS.map((h) => (
          <div
            key={h.name}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
              h.done
                ? "border-transparent bg-[var(--accent)]/8 opacity-80"
                : "border-[hsl(var(--border))] bg-[hsl(var(--background))]"
            )}
          >
            <span className="text-xl">{h.icon}</span>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  h.done
                    ? "line-through text-[hsl(var(--muted-foreground))]"
                    : "text-[hsl(var(--foreground))]"
                )}
              >
                {h.name}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                🔥 {h.streak} day streak
              </p>
            </div>
            <div
              className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                h.done ? "border-transparent" : "border-[hsl(var(--border))]"
              )}
              style={h.done ? { backgroundColor: h.color } : {}}
            >
              {h.done && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span>Today's progress</span>
          <span>2 / 4</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[hsl(var(--border))]">
          <div
            className="h-1.5 rounded-full bg-[var(--accent)]"
            style={{ width: "50%" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative flex min-h-[92vh] flex-col items-center justify-center px-4 py-24 md:py-32"
      >
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-[var(--accent)]/10 blur-[120px]" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="text-xs font-semibold tracking-wide text-[var(--accent)]">
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="text-balance text-5xl font-extrabold leading-[1.08] tracking-tight text-[hsl(var(--foreground))] sm:text-6xl lg:text-7xl"
            >
              {t("hero.headline")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.18 }}
              className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-[hsl(var(--muted-foreground))] lg:mx-0 mx-auto"
            >
              {t("hero.subheadline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.26 }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center"
            >
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_24px_-4px_var(--accent)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_6px_32px_-4px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              >
                {t("hero.cta_primary")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-7 py-3.5 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-300 hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              >
                {t("hero.cta_secondary")}
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 text-xs text-[hsl(var(--muted-foreground))]"
            >
              {t("hero.no_credit_card")}
            </motion.p>
          </div>

          {/* Mock UI */}
          <div className="flex justify-center lg:justify-end">
            <HeroMockUI />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <Reveal>
        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] py-14">
          <div className="mx-auto max-w-5xl px-4">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-2 gap-8 sm:grid-cols-4"
            >
              {STATS.map((s) => (
                <motion.div
                  key={s.label}
                  variants={fadeInUp}
                  className="text-center"
                >
                  <div className="text-4xl font-extrabold tracking-tight text-[var(--accent)]">
                    {s.value}
                  </div>
                  <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Features ── */}
      <Reveal>
        <section id="features" className="py-24 md:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("features.eyebrow")}
              </p>
              <h2 className="text-balance text-4xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                {t("features.headline")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("features.subheadline")}
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    variants={scaleIn}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={cn(
                      "group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] transition-all duration-300 hover:border-[var(--accent)]/30 hover:shadow-[0_4px_32px_-8px_rgba(91,76,245,0.18)]",
                      i === 0 ? "lg:col-span-1" : ""
                    )}
                  >
                    <div
                      className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${f.color}18` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: f.color }} />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-[hsl(var(--foreground))]">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {f.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── How it works ── */}
      <Reveal>
        <section
          id="how-it-works"
          className="bg-[hsl(var(--card))] py-24 md:py-32"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              {/* Copy side */}
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
                  {t("howItWorks.eyebrow")}
                </p>
                <h2 className="text-balance text-4xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                  {t("howItWorks.headline")}
                </h2>
                <p className="mt-4 text-pretty text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {t("howItWorks.subheadline")}
                </p>
              </div>

              {/* Steps */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="space-y-5"
              >
                {HOW_IT_WORKS.map((step) => (
                  <motion.div
                    key={step.step}
                    variants={fadeInUp}
                    className="flex gap-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-sm font-bold text-[var(--accent)]">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-[hsl(var(--foreground))]">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Habit palette preview ── */}
      <Reveal>
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              {/* Visual: color + icon grid */}
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_8px_40px_-8px_rgba(91,76,245,0.18)]">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    {t("palette.pick_icon")}
                  </p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {HABIT_ICONS.map((icon, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all",
                          i === 0
                            ? "border-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[var(--accent)]/40"
                        )}
                        aria-label={`Select icon ${icon}`}
                      >
                        {icon}
                      </motion.button>
                    ))}
                  </div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    {t("palette.pick_color")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_COLORS.map((color, i) => (
                      <motion.button
                        key={color}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className="h-8 w-8 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: color,
                          borderColor: i === 0 ? color : "transparent",
                          boxShadow: i === 0 ? `0 0 0 3px ${color}40` : "none",
                        }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div className="order-1 lg:order-2">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
                  {t("palette.eyebrow")}
                </p>
                <h2 className="text-balance text-4xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                  {t("palette.headline")}
                </h2>
                <p className="mt-4 text-pretty text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {t("palette.subheadline")}
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    t("palette.bullet1"),
                    t("palette.bullet2"),
                    t("palette.bullet3"),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[hsl(var(--foreground))]">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ── */}
      <Reveal>
        <section
          id="testimonials"
          className="bg-[hsl(var(--card))] py-24 md:py-32"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("testimonials.eyebrow")}
              </p>
              <h2 className="text-balance text-4xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                {t("testimonials.headline")}
              </h2>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 gap-6 md:grid-cols-3"
            >
              {TESTIMONIALS.map((t_item) => (
                <motion.div
                  key={t_item.name}
                  variants={scaleIn}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
                >
                  {/* Stars */}
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]"
                      />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-relaxed text-[hsl(var(--foreground))]">
                    &ldquo;{t_item.quote}&rdquo;
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img
                      src={t_item.avatar}
                      alt={t_item.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--accent)]/20"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(t_item.name)}&background=5B4CF5&color=fff`;
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {t_item.name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {t_item.role} · 🔥 {t_item.streak} day streak
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── CTA ── */}
      <Reveal>
        <section id="cta" className="relative overflow-hidden py-24 md:py-32">
          {/* Background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          >
            <div className="h-[500px] w-[700px] rounded-full bg-[var(--accent)]/12 blur-[100px]" />
          </div>

          <div className="mx-auto max-w-3xl px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5"
            >
              <Flame className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="text-xs font-semibold tracking-wide text-[var(--accent)]">
                {t("cta.badge")}
              </span>
            </motion.div>

            <h2 className="text-balance text-4xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl lg:text-6xl">
              {t("cta.headline")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
              {t("cta.subheadline")}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold text-white shadow-[0_4px_24px_-4px_var(--accent)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_6px_32px_-4px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              >
                {t("cta.button")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
              {t("cta.footnote")}
            </p>
          </div>
        </section>
      </Reveal>
    </main>
  );
}