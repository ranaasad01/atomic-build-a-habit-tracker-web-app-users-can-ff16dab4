"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/data";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(t("login.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center mb-8"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-6">
                {APP_NAME}
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] text-balance"
            >
              {t("login.heading")}
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-3 text-[hsl(var(--muted-foreground))] text-base leading-relaxed"
            >
              {t("login.subheading")}
            </motion.p>
          </motion.div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[hsl(var(--foreground))]"
                >
                  {t("login.emailLabel")}
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                    className={cn(
                      "w-full rounded-xl border bg-[hsl(var(--background))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all duration-200",
                      "border-[hsl(var(--border))] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20",
                      error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : ""
                    )}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    {t("login.passwordLabel")}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 rounded"
                  >
                    {t("login.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.passwordPlaceholder")}
                    className={cn(
                      "w-full rounded-xl border bg-[hsl(var(--background))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all duration-200",
                      "border-[hsl(var(--border))] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20",
                      error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : ""
                    )}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.985 }}
                className={cn(
                  "relative w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
                  "bg-[var(--accent)] text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)]",
                  "hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{t("login.signingIn")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("login.submitButton")}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{t("login.orDivider")}</span>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              {t("login.noAccount")}{" "}
              <Link
                href="/signup"
                className="font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 rounded"
              >
                {t("login.signUpLink")}
              </Link>
            </p>
          </div>
        </Reveal>

        {/* Trust badges */}
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {(Array.isArray(t.raw("login.trustBadges")) ? t.raw("login.trustBadges") : []) as { text: string }[]}
            {(
              (Array.isArray(t.raw("login.trustBadges")) ? t.raw("login.trustBadges") : []) as { text: string }[]
            ).map((badge, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"
              >
                <span className="h-1 w-1 rounded-full bg-[var(--accent)]/60" aria-hidden="true" />
                {badge.text}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </main>
  );
}