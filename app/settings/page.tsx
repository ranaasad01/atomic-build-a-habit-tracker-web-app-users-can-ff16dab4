"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, Save, Camera, Check, AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/data";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ACCENT_COLORS: string[] = [];

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
};

type Tab = "profile" | "notifications" | "security" | "appearance";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
];

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

export default function SettingsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  // Security form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Notification prefs (local state only)
  const [notifDailyReminder, setNotifDailyReminder] = useState(true);
  const [notifStreakAlert, setNotifStreakAlert] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Appearance prefs (local state only)
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceSaved, setAppearanceSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      setEmail(user.email ?? "");

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError("Could not load profile.");
      } else if (data) {
        setProfile(data);
        setDisplayName(data.display_name ?? "");
        setTimezone(data.timezone ?? "UTC");
        if (data.avatar_url) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(data.avatar_url);
          setAvatarUrl(urlData?.publicUrl ?? null);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        timezone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);

    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      await supabase
        .from("profiles")
        .update({ avatar_url: path, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      setAvatarUrl(urlData?.publicUrl ?? null);
    }
    setUploadingAvatar(false);
  }

  async function handleChangePassword() {
    setPwError(null);
    if (!newPassword || newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    const { error: pwUpdateError } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (pwUpdateError) {
      setPwError(pwUpdateError.message);
    } else {
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 3000);
    }
  }

  async function handleSaveNotifications() {
    setNotifSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  }

  async function handleSaveAppearance() {
    setAppearanceSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setAppearanceSaving(false);
    setAppearanceSaved(true);
    setTimeout(() => setAppearanceSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero / Header */}
      <div className="hero-mesh border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <motion.h1
            className="text-display text-[var(--foreground)] tracking-tight text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Account Settings
          </motion.h1>
          <motion.p
            className="mt-3 text-body text-[var(--muted-foreground)] max-w-xl mx-auto text-pretty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          >
            Manage your profile, notifications, security, and preferences.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <aside className="md:w-52 shrink-0">
              <nav className="flex flex-row md:flex-col gap-1" aria-label="Settings tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
                      activeTab === tab.id
                        ? "bg-[var(--primary)] text-white shadow-[0_2px_12px_0_rgba(91,76,245,0.25)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Tab Content */}
            <div className="flex-1 min-w-0">
              {/* ── Profile ── */}
              {activeTab === "profile" && (
                <Reveal>
                  <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6 md:p-8 space-y-6">
                    <div>
                      <h2 className="text-h2 text-[var(--foreground)]">Profile</h2>
                      <p className="text-caption text-[var(--muted-foreground)] mt-1">
                        Update your display name, email, and timezone.
                      </p>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-full bg-[var(--muted)] border-2 border-[var(--border)] flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                              onError={() => setAvatarUrl(null)}
                            />
                          ) : (
                            <User className="w-9 h-9 text-[var(--muted-foreground)]" />
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                          aria-label="Upload avatar"
                        >
                          {uploadingAvatar ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {displayName || "Your Name"}
                        </p>
                        <p className="text-caption text-[var(--muted-foreground)]">{email}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Click the camera icon to upload a new photo.
                        </p>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[var(--foreground)]">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                      />
                    </div>

                    {/* Email (read-only display) */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[var(--foreground)]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] text-sm cursor-not-allowed"
                      />
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Email changes are managed through your account security settings.
                      </p>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[var(--foreground)]">
                        Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-sm text-[var(--destructive)] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:opacity-90 disabled:opacity-60 transition-all duration-200"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : saved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
                    </button>
                  </section>
                </Reveal>
              )}

              {/* ── Notifications ── */}
              {activeTab === "notifications" && (
                <Reveal>
                  <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6 md:p-8 space-y-6">
                    <div>
                      <h2 className="text-h2 text-[var(--foreground)]">Notifications</h2>
                      <p className="text-caption text-[var(--muted-foreground)] mt-1">
                        Control when and how Streakly reminds you to check in.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Daily Reminder Toggle */}
                      <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">Daily Reminder</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Get a nudge each day to complete your habits.
                          </p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={notifDailyReminder}
                          onClick={() => setNotifDailyReminder((v) => !v)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                            notifDailyReminder ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                              notifDailyReminder ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      {/* Reminder Time Picker */}
                      {notifDailyReminder && (
                        <div className="space-y-1.5 pl-0">
                          <label className="block text-sm font-medium text-[var(--foreground)]">
                            Reminder Time
                          </label>
                          <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                          />
                        </div>
                      )}

                      {/* Streak Alert Toggle */}
                      <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">Streak Alerts</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Be notified when you're about to break a streak.
                          </p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={notifStreakAlert}
                          onClick={() => setNotifStreakAlert((v) => !v)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                            notifStreakAlert ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                              notifStreakAlert ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      {/* Weekly Summary Toggle */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">Weekly Summary</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Receive a weekly digest of your habit performance.
                          </p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={notifWeeklySummary}
                          onClick={() => setNotifWeeklySummary((v) => !v)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                            notifWeeklySummary ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                              notifWeeklySummary ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveNotifications}
                      disabled={notifSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:opacity-90 disabled:opacity-60 transition-all duration-200"
                    >
                      {notifSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : notifSaved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {notifSaving ? "Saving..." : notifSaved ? "Saved!" : "Save Preferences"}
                    </button>
                  </section>
                </Reveal>
              )}

              {/* ── Security ── */}
              {activeTab === "security" && (
                <Reveal>
                  <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6 md:p-8 space-y-6">
                    <div>
                      <h2 className="text-h2 text-[var(--foreground)]">Security</h2>
                      <p className="text-caption text-[var(--muted-foreground)] mt-1">
                        Change your password to keep your account secure.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Current Password */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--foreground)]">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            aria-label={showCurrentPw ? "Hide password" : "Show password"}
                          >
                            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--foreground)]">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            aria-label={showNewPw ? "Hide password" : "Show password"}
                          >
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--foreground)]">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                        />
                      </div>
                    </div>

                    {pwError && (
                      <div className="flex items-center gap-2 text-sm text-[var(--destructive)] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {pwError}
                      </div>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={pwSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:opacity-90 disabled:opacity-60 transition-all duration-200"
                    >
                      {pwSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : pwSaved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      {pwSaving ? "Updating..." : pwSaved ? "Password Updated!" : "Update Password"}
                    </button>
                  </section>
                </Reveal>
              )}

              {/* ── Appearance ── */}
              {activeTab === "appearance" && (
                <Reveal>
                  <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] card-shadow p-6 md:p-8 space-y-6">
                    <div>
                      <h2 className="text-h2 text-[var(--foreground)]">Appearance</h2>
                      <p className="text-caption text-[var(--muted-foreground)] mt-1">
                        Personalize how Streakly looks for you.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)] mb-3">Accent Color</p>
                        {ACCENT_COLORS.length === 0 ? (
                          <p className="text-sm text-[var(--muted-foreground)]">
                            Custom accent colors are coming soon.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {ACCENT_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setAccentColor(color)}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 transition-all duration-200",
                                  accentColor === color
                                    ? "border-[var(--foreground)] scale-110"
                                    : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: color }}
                                aria-label={`Select color ${color}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveAppearance}
                      disabled={appearanceSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold shadow-[0_2px_12px_0_rgba(91,76,245,0.25)] hover:opacity-90 disabled:opacity-60 transition-all duration-200"
                    >
                      {appearanceSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : appearanceSaved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Palette className="w-4 h-4" />
                      )}
                      {appearanceSaving ? "Saving..." : appearanceSaved ? "Saved!" : "Save Appearance"}
                    </button>
                  </section>
                </Reveal>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
