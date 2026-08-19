"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { footerLinks, APP_NAME, APP_TAGLINE } from "@/lib/data";
import { Sparkles, Code2 as Github, MessageCircle as Twitter } from 'lucide-react';

export default function Footer() {
  const t = useTranslations();
  const pathname = usePathname();
  const navT = (Array.isArray(t.raw("nav")) ? {} : t.raw("nav")) as Record<string, string>;
  const footerT = (Array.isArray(t.raw("footer")) ? {} : t.raw("footer")) as Record<string, string>;

  function renderLink(link: (typeof footerLinks)[0]) {
    const label = navT[link.key] ?? link.label;

    if (link.href.startsWith("#")) {
      return (
        <Link
          key={link.key}
          href={pathname === "/" ? link.href : "/" + link.href}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors duration-200"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" });
            }
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
        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors duration-200"
      >
        {label}
      </Link>
    );
  }

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-[var(--border)] bg-[var(--card)] mt-auto"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--primary)] shadow-[0_2px_12px_0_rgba(91,76,245,0.3)]">
                <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xs">
              {APP_TAGLINE}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Streakly on Twitter"
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--border)] transition-all duration-200"
              >
                <Twitter className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Streakly on GitHub"
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--border)] transition-all duration-200"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {footerT["navigation"] ?? "Navigation"}
            </h3>
            <nav className="flex flex-col gap-2" aria-label="Footer navigation">
              {footerLinks.map((link) => renderLink(link))}
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {footerT["product"] ?? "Product"}
            </h3>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">
                {footerT["free_forever"] ?? "Free forever for core features"}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">
                {footerT["no_credit_card"] ?? "No credit card required"}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">
                {footerT["built_with_love"] ?? "Built with care for habit builders"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            {footerT["copyright"] ?? `© ${new Date().getFullYear()} Streakly. All rights reserved.`}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {footerT["tagline"] ?? "Show up. Every day. Build the life you want."}
          </p>
        </div>
      </div>
    </motion.footer>
  );
}