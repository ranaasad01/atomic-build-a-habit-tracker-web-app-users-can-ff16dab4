"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, Save, Camera, Check, AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/data";
type HABIT_COLORS = any;
const HABIT_COLORS: any = [];
type HABIT_ICONS = any;
const HABIT_ICONS: any = [];
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

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

const ACCENT_COLORS = HABIT_COLORS;

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

  // Notification prefs (local state only — no table for this)
  const [notifDailyReminder, setNotifDailyReminder] = useState(true);
  const [notifStreakAlert, setNotifStreakAlert] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(false);
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
          setAvatarUrl(urlData.publicUrl);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleProfileSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName, timezone, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (updateError) {
      setError("Failed to save profile. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
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
      await supabase.from("profiles").update({ avatar_url: path, updated_at: new Date().toISOString() }).eq("id", profile.id);
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
    }
    setUploadingAvatar(false);
  }

  async function handlePasswordChange() {
    setPwError(null);
    if (newPassword !== confirmPassword) { setPwError("New passwords do not match."); return; }
    if (newPassword.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setPwSaving(true);
    const { error: pwUpdateError } = await supabase.auth.updateUser({ password: newPassword });
    if (pwUpdateError) {
      setPwError(pwUpdateError.message);
    } else {
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 2500);
    }
    setPwSaving(false);
  }

  function handleNotifSave() {
    setNotifSaving(true);
    setTimeout(() => {
      setNotifSaving(false);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    }, 600);
  }

  function handleAppearanceSave() {
    setAppearanceSaving(true);
    setTimeout(() => {
      setAppearanceSaving(false);
      setAppearanceSaved(true);
      setTimeout(() => setAppearanceSaved(false), 2500);
    }, 600);
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] pb-24">
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">

        {/* Page Header */}
        <Reveal>
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              Settings
            </h1>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">
              Manage your {APP_NAME} account, preferences, and security.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-8 lg:flex-row">

          {/* Sidebar Tabs */}
          <Reveal className="lg:w-56 shrink-0">
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    activeTab === tab.id
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

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Reveal>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="border-b border-[hsl(var(--border))] px-6 py-5">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Profile Information</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Update your display name, avatar, and timezone.</p>
                  </div>

                  {loading ? (
                    <div className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">Loading profile…</div>
                  ) : (
                    <div className="px-6 py-6 space-y-6">

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
                            disabled={uploadingAvatar}
                            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                          >
                            {uploadingAvatar ? (
                              <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                              <Camera className="h-3.5 w-3.5" />
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
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">Profile photo</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">JPG, PNG or GIF. Max 2MB.</p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            Change photo
                          </button>
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
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition"
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
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                        <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                          Used to calculate your daily habit reset time.
                        </p>
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      {/* Save Button */}
                      <div className="flex items-center gap-3 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleProfileSave}
                          disabled={saving}
                          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {saving ? (
                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : saved ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <Reveal>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="border-b border-[hsl(var(--border))] px-6 py-5">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Notification Preferences</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Choose when and how you want to be reminded.</p>
                  </div>
                  <div className="px-6 py-6 space-y-5">
                    {[
                      {
                        label: "Daily Reminder",
                        description: "Get a nudge each morning to check in on your habits.",
                        value: notifDailyReminder,
                        onChange: setNotifDailyReminder,
                      },
                      {
                        label: "Streak Alerts",
                        description: "Be notified when you're about to break a streak.",
                        value: notifStreakAlert,
                        onChange: setNotifStreakAlert,
                      },
                      {
                        label: "Weekly Summary",
                        description: "Receive a weekly digest of your habit performance.",
                        value: notifWeeklySummary,
                        onChange: setNotifWeeklySummary,
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-[hsl(var(--border))] last:border-0">
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{item.label}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.description}</p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={item.value}
                          onClick={() => item.onChange(!item.value)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                            item.value ? "bg-[var(--accent)]" : "bg-[hsl(var(--muted))]"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200",
                              item.value ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNotifSave}
                        disabled={notifSaving}
                        className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {notifSaving ? (
                          <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : notifSaved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {notifSaving ? "Saving…" : notifSaved ? "Saved!" : "Save Preferences"}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Reveal>
                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="border-b border-[hsl(var(--border))] px-6 py-5">
                      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Change Password</h2>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Use a strong password you don't use elsewhere.</p>
                    </div>
                    <div className="px-6 py-6 space-y-4">
                      {[
                        { label: "Current Password", value: currentPassword, onChange: setCurrentPassword, show: showCurrentPw, toggle: () => setShowCurrentPw((v) => !v) },
                        { label: "New Password", value: newPassword, onChange: setNewPassword, show: showNewPw, toggle: () => setShowNewPw((v) => !v) },
                        { label: "Confirm New Password", value: confirmPassword, onChange: setConfirmPassword, show: showNewPw, toggle: () => setShowNewPw((v) => !v) },
                      ].map((field) => (
                        <div key={field.label}>
                          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">{field.label}</label>
                          <div className="relative">
                            <input
                              type={field.show ? "text" : "password"}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition"
                            />
                            <button
                              type="button"
                              onClick={field.toggle}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                            >
                              {field.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      ))}

                      {pwError && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {pwError}
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePasswordChange}
                          disabled={pwSaving}
                          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {pwSaving ? (
                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : pwSaved ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                          {pwSaving ? "Updating…" : pwSaved ? "Updated!" : "Update Password"}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-2xl border border-red-200 bg-red-50/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="border-b border-red-200 px-6 py-5">
                      <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
                      <p className="text-sm text-red-600/80 mt-0.5">Irreversible actions. Proceed with caution.</p>
                    </div>
                    <div className="px-6 py-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-red-700">Delete Account</p>
                          <p className="text-xs text-red-600/80 mt-0.5">
                            Permanently delete your account and all habit data. This cannot be undone.
                          </p>
                        </div>
                        <button className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shrink-0">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <Reveal>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="border-b border-[hsl(var(--border))] px-6 py-5">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Appearance</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Personalize how {APP_NAME} looks for you.</p>
                  </div>
                  <div className="px-6 py-6 space-y-6">

                    {/* Accent Color */}
                    <div>
                      <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                        Accent Color
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {ACCENT_COLORS.map((color) => (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAccentColor(color)}
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
                        This color will be used for habit highlights and interactive elements.
                      </p>
                    </div>

                    {/* Habit Icon Preview */}
                    <div>
                      <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                        Default Habit Icons
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {HABIT_ICONS.map((icon) => (
                          <span
                            key={icon}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xl"
                          >
                            {icon}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        These icons are available when creating or editing a habit.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAppearanceSave}
                        disabled={appearanceSaving}
                        className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {appearanceSaving ? (
                          <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : appearanceSaved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Palette className="h-4 w-4" />
                        )}
                        {appearanceSaving ? "Saving…" : appearanceSaved ? "Saved!" : "Save Appearance"}
                      </motion.button>
                    </div>
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