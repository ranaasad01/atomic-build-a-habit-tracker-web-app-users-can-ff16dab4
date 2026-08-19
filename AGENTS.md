# AGENTS.md

Project conventions for AI agents and humans editing this codebase.

## Original request
Build a habit tracker web app. Users can sign up and log in with email and password.

## Goal
Build a full-featured habit tracker SaaS web app with authentication, daily habit tracking, streaks, and progress stats using Next.js 14 App Router, TypeScript, and Tailwind CSS.

## Project type
saas-app

## Design system — match this exactly
- Color tokens: `--background: #F5F4FF`, `--foreground: #1A1533`, `--card: #FFFFFF`, `--border: #DDD9F7`, `--muted-foreground: #6B63A4`, `--primary: #5B4CF5`, `--accent: #A78BFA`, `--primary-hover: #4A3CE0`, `--destructive: #DC2626`, `--muted: #EDE9FE`
- Fonts: Inter

## Existing components — reuse these, don't create near-duplicates
- Footer (components/Footer.tsx)
- LanguageToggle (components/LanguageToggle.tsx)
- LocaleProvider (components/LocaleProvider.tsx)
- Navbar (components/Navbar.tsx)

## Existing i18n namespaces
Every translation key must be namespaced (`hero.title`, never a bare `title`) so two components never collide on the same catalog slot. Reuse one of these, or pick a new, distinct name:
`common`, `cta`, `dashboard`, `features`, `footer`, `habits`, `hero`, `howItWorks`, `login`, `nav`, `palette`, `settings`, `signup`, `testimonials`

When editing or adding pages: preserve the design system above, reuse existing components and the shared nav data file, and keep the established structure and tone.
