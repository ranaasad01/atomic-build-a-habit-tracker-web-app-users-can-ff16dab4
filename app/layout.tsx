import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocaleProvider from "@/components/LocaleProvider";
import LanguageToggle from "@/components/LanguageToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  formatDetection: { telephone: false, date: false, email: false, address: false },
  title: {
    default: "Streakly — Build Habits That Actually Stick",
    template: "%s | Streakly",
  },
  description:
    "Track your daily habits, build streaks, and achieve your goals with Streakly. Join thousands of people showing up for themselves every single day.",
  keywords: ["habit tracker", "streaks", "daily habits", "productivity", "goal tracking"],
  openGraph: {
    title: "Streakly — Build Habits That Actually Stick",
    description:
      "Track your daily habits, build streaks, and achieve your goals with Streakly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[var(--background)] text-[var(--foreground)] font-sans antialiased min-h-screen flex flex-col">
        <LocaleProvider>
          <LanguageToggle />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}