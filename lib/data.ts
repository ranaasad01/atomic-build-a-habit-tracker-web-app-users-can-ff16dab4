export interface NavLink {
  label: string;
  href: string;
  key: string;
  authOnly?: boolean;
  guestOnly?: boolean;
}

export const APP_NAME = "Streakly";
export const APP_TAGLINE = "Build habits that actually stick.";
export const APP_DESCRIPTION =
  "Track your daily habits, build streaks, and achieve your goals. Join thousands of people showing up for themselves every single day.";

export const navLinks: NavLink[] = [
  { label: "Home", href: "/", key: "home" },
  { label: "Dashboard", href: "/dashboard", key: "dashboard", authOnly: true },
  { label: "Settings", href: "/settings", key: "settings", authOnly: true },
  { label: "Log In", href: "/login", key: "login", guestOnly: true },
  { label: "Sign Up", href: "/signup", key: "signup", guestOnly: true },
];

export const footerLinks: NavLink[] = [
  { label: "Home", href: "/", key: "home" },
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Log In", href: "/login", key: "login" },
  { label: "Sign Up", href: "/signup", key: "signup" },
  { label: "Settings", href: "/settings", key: "settings" },
];

export type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  frequency: string;
  current_streak: number;
  longest_streak: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HabitCompletionRow = {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  note: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};