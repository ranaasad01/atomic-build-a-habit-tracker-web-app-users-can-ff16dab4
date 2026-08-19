"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { navLinks, APP_NAME } from "@/lib/data";
import { Menu, X, Sparkles } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const navT = (Array.isArray(t.raw("nav")) ? {} : t.raw("nav")) as Record<string, string>;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const visibleLinks = navLinks.filter((link) => {
    if (link.authOnly && !userId) return false;
    if (link.guestOnly && userId) return false;
    return true;
  });

  function renderLink(link: (typeof navLinks)[0], mobile = false) {
    const isActive = pathname === link.href;
    const label = navT[link.key] ?? link.label;
    const baseClass = mobile
      ? `block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
          isActive
            ? "bg-[var(--primary)] text-white"
            : "text-[var(--foreground)] hover:bg-[var(--border)]"
        }`
      : `relative px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg ${
          isActive
            ? "text-[var(--primary)]"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`;

    const isSignup = link.key === "signup";

    if (isSignup && !mobile) {
      return (
        <Link
          key={link.key}
          href={link.href}
          className="ml-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:opacity-90 transition-all duration-200"
        >
          {label}
        </Link>
      );
    }

    if (link.href.startsWith("#")) {
      return (
        <Link
          key={link.key}
          href={pathname === "/" ? link.href : "/" + link.href}
          className={baseClass}
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" });
            }
            if (mobile) setMobileOpen(false);
          }}
        >
          {label}
        </Link>
      );
    }

    return (
      <Link
        key={link.key}
        href={link.href}
        className={baseClass}
        onClick={() => mobile && setMobileOpen(false)}
      >
        {label}
        {isActive && !mobile && (
          <motion.span
            layoutId="nav-indicator"
            className="absolute inset-0 rounded-lg bg-[var(--primary)]/10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </Link>
    );
  }

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--card)]/90 backdrop-blur-md shadow-[0_2px_12px_0_rgba(91,76,245,0.08)] border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--primary)] shadow-[0_2px_12px_0_rgba(91,76,245,0.3)]">
              <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold text-[var(--foreground)] tracking-tight">
              {APP_NAME}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {visibleLinks.map((link) => renderLink(link))}
          </nav>

          <button
            className="md:hidden p-2 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden overflow-hidden bg-[var(--card)] border-b border-[var(--border)]"
          >
            <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
              {visibleLinks.map((link) => renderLink(link, true))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}