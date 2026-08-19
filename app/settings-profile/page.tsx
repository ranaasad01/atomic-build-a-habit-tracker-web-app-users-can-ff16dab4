"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, Save, Camera, Check, AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
type HABIT_COLORS = any;
const HABIT_COLORS: any = [];
type HabitColor = any;
const HabitColor: any = [];
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

const ACCENT_COLORS: HabitColor[] = [...HABIT_COLORS];

type TabKey = "profile" | "notifications" | "security" | "appearance";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { key: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { key: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
];

export default function SettingsProfilePage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile form
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Notification prefs (local state only — no table for these)
  const [notifDailyReminder, setNotifDailyReminder] = useState(true);
  const [notifStreakAlert, setNotifStreakAlert] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");

  // Security form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Appearance
  const [accentColor, setAccentColor] = useState<HabitColor>(ACCENT_COLORS[0]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name ?? "");
        setTimezone(data.timezone ?? "UTC");
        setAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        timezone,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      setSaveError("Failed to save profile. Please try again.");
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
    }
    setAvatarUploading(false);
  }

  async function handleChangePassword() {
    setPwError(null);
    setPwSuccess(false);
    if (!newPassword || newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    }
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] pb-24 pt-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <Reveal>
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              Settings
            </h1>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">
              Manage your profile, notifications, and account preferences.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-8 lg:flex-row">

          {/* Sidebar Tabs */}
          <Reveal className="lg:w-56 shrink-0">
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    activeTab === tab.key
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </Reveal>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <Reveal>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6">
                    Profile Information
                  </h2>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">

                      {/* Avatar */}
                      <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--accent)]/30"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
                              {initials}
                            </div>
                          )}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-md transition-transform hover:scale-110 disabled:opacity-60"
                          >
                            <Camera className="h-3.5 w-3.5" />
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--foreground))]">
                            {displayName || "No name set"}
                          </p>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {avatarUploading ? "Uploading..." : "Click the camera icon to update your photo"}
                          </p>
                        </div>
                      </div>

                      {/* Display Name */}
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                        />
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                          Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                        <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                          Used to calculate your daily habit resets.
                        </p>
                      </div>

                      {/* Feedback */}
                      {saveError && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {saveError}
                        </div>
                      )}
                      {saveSuccess && (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600">
                          <Check className="h-4 w-4 shrink-0" />
                          Profile saved successfully.
                        </div>
                      )}

                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  )}
                </div>
              </Reveal>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifications" && (
              <Reveal>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-5">
                    {/* Daily Reminder */}
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-[hsl(var(--border))] p-4">
                      <div>
                        <p className="font-medium text-[hsl(var(--foreground))] text-sm">Daily Reminder</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          Get a nudge each morning to check in on your habits.
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifDailyReminder((v) => !v)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                          notifDailyReminder ? "bg-[var(--accent)]" : "bg-[hsl(var(--muted))]"
                        )}
                        role="switch"
                        aria-checked={notifDailyReminder}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200",
                            notifDailyReminder ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Reminder Time */}
                    {notifDailyReminder && (
                      <div className="ml-4 flex items-center gap-3">
                        <label className="text-sm text-[hsl(var(--muted-foreground))]">Reminder time</label>
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                        />
                      </div>
                    )}

                    {/* Streak Alert */}
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-[hsl(var(--border))] p-4">
                      <div>
                        <p className="font-medium text-[hsl(var(--foreground))] text-sm">Streak at Risk Alert</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          Notify me when a streak is about to break by end of day.
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifStreakAlert((v) => !v)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                          notifStreakAlert ? "bg-[var(--accent)]" : "bg-[hsl(var(--muted))]"
                        )}
                        role="switch"
                        aria-checked={notifStreakAlert}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200",
                            notifStreakAlert ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Weekly Summary */}
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-[hsl(var(--border))] p-4">
                      <div>
                        <p className="font-medium text-[hsl(var(--foreground))] text-sm">Weekly Summary</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          Receive a weekly digest of your habit performance every Sunday.
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifWeeklySummary((v) => !v)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                          notifWeeklySummary ? "bg-[var(--accent)]" : "bg-[hsl(var(--muted))]"
                        )}
                        role="switch"
                        aria-checked={notifWeeklySummary}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200",
                            notifWeeklySummary ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Notification delivery depends on your browser or device permissions.
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <Reveal>
                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6">
                      Change Password
                    </h2>

                    <div className="space-y-4">
                      {/* Current Password */}
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                          >
                            {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                          >
                            {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* Strength indicator */}
                        {newPassword.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {[1, 2, 3, 4].map((level) => {
                              const strength = Math.min(4, Math.floor(newPassword.length / 3));
                              return (
                                <div
                                  key={level}
                                  className={cn(
                                    "h-1 flex-1 rounded-full transition-colors",
                                    level <= strength
                                      ? strength <= 1 ? "bg-red-500" : strength <= 2 ? "bg-amber-500" : strength <= 3 ? "bg-yellow-400" : "bg-emerald-500"
                                      : "bg-[hsl(var(--muted))]"
                                  )}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                        />
                      </div>

                      {pwError && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {pwError}
                        </div>
                      )}
                      {pwSuccess && (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600">
                          <Check className="h-4 w-4 shrink-0" />
                          Password updated successfully.
                        </div>
                      )}

                      <button
                        onClick={handleChangePassword}
                        disabled={pwSaving}
                        className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                      >
                        <Shield className="h-4 w-4" />
                        {pwSaving ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
                    <h3 className="text-base font-semibold text-red-600 mb-1">Danger Zone</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                      Deleting your account is permanent and cannot be undone. All your habits and history will be erased.
                    </p>
                    <button
                      className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-white/50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-500 hover:text-white"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                          // Account deletion would require a server-side function
                          alert("Please contact support to delete your account.");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </Reveal>
            )}

            {/* ── APPEARANCE TAB ── */}
            {activeTab === "appearance" && (
              <Reveal>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6">
                    Appearance
                  </h2>

                  <div className="space-y-8">
                    {/* Accent Color */}
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                        Accent Color
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {ACCENT_COLORS.map((color) => (
                          <motion.button
                            key={color}
                            onClick={() => setAccentColor(color)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "h-9 w-9 rounded-full transition-all duration-200 ring-offset-2 ring-offset-[hsl(var(--card))]",
                              accentColor === color ? "ring-2 ring-[hsl(var(--foreground))]" : "ring-0"
                            )}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          >
                            {accentColor === color && (
                              <Check className="h-4 w-4 text-white mx-auto" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        This color is used for habit cards and highlights across the app.
                      </p>
                    </div>

                    {/* Preview Card */}
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Preview</p>
                      <div
                        className="rounded-2xl border p-5 transition-all duration-300"
                        style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ backgroundColor: accentColor }}
                          >
                            🏃
                          </div>
                          <div>
                            <p className="font-semibold text-[hsl(var(--foreground))] text-sm">Morning Run</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Daily · 14 day streak</p>
                          </div>
                          <div className="ml-auto">
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: accentColor }}
                            >
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-2 flex-1 rounded-full"
                              style={{
                                backgroundColor: i < 5 ? accentColor : `${accentColor}30`,
                                opacity: i < 5 ? 1 : 0.4,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      More theme options coming soon, including dark mode and compact layout.
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}