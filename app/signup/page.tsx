"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/data";

function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations();
  const checks = [
    { label: t("signup.strength.length"), pass: password.length >= 8 },
    { label: t("signup.strength.uppercase"), pass: /[A-Z]/.test(password) },
    { label: t("signup.strength.number"), pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-500", "bg-yellow-500", "bg-green-500"];
  const labels = [
    t("signup.strength.weak"),
    t("signup.strength.fair"),
    t("signup.strength.strong"),
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < score ? colors[score - 1] : "bg-[hsl(var(--border))]"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        {score > 0 ? labels[score - 1] : ""}
      </p>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              c.pass
                ? "text-green-500"
                : "text-[hsl(var(--muted-foreground))]"
            )}
          >
            <CheckCircle
              className={cn(
                "h-3 w-3 transition-opacity duration-200",
                c.pass ? "opacity-100" : "opacity-30"
              )}
            />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SignUpPage() {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const errors = {
    name: touched.name && !name.trim() ? t("signup.errors.nameRequired") : "",
    email:
      touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? t("signup.errors.emailInvalid")
        : "",
    password:
      touched.password && password.length < 8
        ? t("signup.errors.passwordShort")
        : "",
    confirmPassword:
      touched.confirmPassword && password !== confirmPassword
        ? t("signup.errors.passwordMismatch")
        : "",
  };

  const isValid =
    name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t("signup.errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[var(--accent)]/8 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {success ? (
          <Reveal>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]"
            >
              <motion.div variants={fadeInUp} className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="mt-4 text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]"
              >
                {t("signup.success.title")}
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]"
              >
                {t("signup.success.body")}
              </motion.p>
              <motion.div variants={fadeInUp} className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {t("signup.success.cta")}
                </Link>
              </motion.div>
            </motion.div>
          </Reveal>
        ) : (
          <Reveal>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Header */}
              <motion.div variants={fadeInUp} className="mb-8 text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                  {t("signup.badge")}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] text-balance">
                  {t("signup.heading")}
                </h1>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  {t("signup.subheading")}
                </p>
              </motion.div>

              {/* Card */}
              <motion.div
                variants={fadeInUp}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-red-500">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
                    >
                      {t("signup.form.nameLabel")}
                    </label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, name: true }))
                      }
                      placeholder={t("signup.form.namePlaceholder")}
                      className={cn(
                        "w-full rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
                        errors.name
                          ? "border-red-500/50 focus:ring-red-500/20"
                          : "border-[hsl(var(--border))] focus:border-[var(--accent)]/50"
                      )}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
                    >
                      {t("signup.form.emailLabel")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, email: true }))
                      }
                      placeholder={t("signup.form.emailPlaceholder")}
                      className={cn(
                        "w-full rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
                        errors.email
                          ? "border-red-500/50 focus:ring-red-500/20"
                          : "border-[hsl(var(--border))] focus:border-[var(--accent)]/50"
                      )}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
                    >
                      {t("signup.form.passwordLabel")}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, password: true }))
                        }
                        placeholder={t("signup.form.passwordPlaceholder")}
                        className={cn(
                          "w-full rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
                          errors.password
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : "border-[hsl(var(--border))] focus:border-[var(--accent)]/50"
                        )}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword
                            ? t("signup.form.hidePassword")
                            : t("signup.form.showPassword")
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {errors.password}
                      </p>
                    )}
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
                    >
                      {t("signup.form.confirmLabel")}
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() =>
                          setTouched((prev) => ({
                            ...prev,
                            confirmPassword: true,
                          }))
                        }
                        placeholder={t("signup.form.confirmPlaceholder")}
                        className={cn(
                          "w-full rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
                          errors.confirmPassword
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : confirmPassword && !errors.confirmPassword
                            ? "border-green-500/50 focus:ring-green-500/20"
                            : "border-[hsl(var(--border))] focus:border-[var(--accent)]/50"
                        )}
                      />
                      <button
                        type="button"
                        aria-label={
                          showConfirm
                            ? t("signup.form.hidePassword")
                            : t("signup.form.showPassword")
                        }
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                    {confirmPassword &&
                      !errors.confirmPassword &&
                      password === confirmPassword && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-green-500">
                          <CheckCircle className="h-3 w-3" />
                          {t("signup.form.passwordsMatch")}
                        </p>
                      )}
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("signup.form.submitting")}
                      </>
                    ) : (
                      t("signup.form.submit")
                    )}
                  </motion.button>
                </form>

                <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  {t("signup.loginPrompt")}{" "}
                  <Link
                    href="/login"
                    className="font-medium text-[var(--accent)] underline-offset-4 transition-colors hover:underline"
                  >
                    {t("signup.loginLink")}
                  </Link>
                </p>
              </motion.div>

              {/* Terms */}
              <motion.p
                variants={fadeInUp}
                className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]"
              >
                {t("signup.terms.prefix")}{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-[hsl(var(--foreground))]"
                >
                  {t("signup.terms.tos")}
                </Link>{" "}
                {t("signup.terms.and")}{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-[hsl(var(--foreground))]"
                >
                  {t("signup.terms.privacy")}
                </Link>
                .
              </motion.p>
            </motion.div>
          </Reveal>
        )}
      </div>
    </main>
  );
}