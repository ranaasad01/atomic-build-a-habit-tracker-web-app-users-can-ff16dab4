"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/data";

const PERKS = [
  "Track unlimited daily habits",
  "Visualize streaks and progress",
  "Get insights on your consistency",
  "Sync across all your devices",
];

export default function SignUpPage() {
  const t = useTranslations();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <Reveal className="w-full max-w-md">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10">
              <CheckCircle className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              {t("signup.success.title")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
              {t("signup.success.body")}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              {t("signup.success.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <motion.div
          className="grid grid-cols-1 gap-8 lg:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Left — branding + perks */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col justify-center space-y-8"
          >
            <div>
              <span className="inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("signup.badge")}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] lg:text-5xl">
                {t("signup.heading")}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("signup.subheading")}
              </p>
            </div>

            <ul className="space-y-3">
              {PERKS.map((perk, i) => (
                <motion.li
                  key={i}
                  variants={fadeInUp}
                  className="flex items-center gap-3 text-sm text-[hsl(var(--foreground))]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15">
                    <CheckCircle className="h-3.5 w-3.5 text-[var(--accent)]" />
                  </span>
                  {perk}
                </motion.li>
              ))}
            </ul>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t("signup.loginPrompt")}{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
              >
                {t("signup.loginLink")}
              </Link>
            </p>
          </motion.div>

          {/* Right — form */}
          <motion.div variants={fadeInUp}>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
              <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
                {t("signup.formTitle")}
              </h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {t("signup.formSubtitle")}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                {/* Display name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    {t("signup.nameLabel")}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
                    <input
                      id="displayName"
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("signup.namePlaceholder")}
                      className={cn(
                        "w-full rounded-xl border bg-[hsl(var(--background))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-all duration-200",
                        "border-[hsl(var(--border))] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                      )}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    {t("signup.emailLabel")}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("signup.emailPlaceholder")}
                      className={cn(
                        "w-full rounded-xl border bg-[hsl(var(--background))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-all duration-200",
                        "border-[hsl(var(--border))] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                      )}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    {t("signup.passwordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("signup.passwordPlaceholder")}
                      className={cn(
                        "w-full rounded-xl border bg-[hsl(var(--background))] py-2.5 pl-10 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-all duration-200",
                        "border-[hsl(var(--border))] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t("signup.passwordHint")}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                    role="alert"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300",
                    "hover:opacity-90 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t("signup.submitting")}
                    </>
                  ) : (
                    <>
                      {t("signup.submit")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {t("signup.terms")}
                </p>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}