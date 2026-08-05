import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://queuesis.vercel.app"),
  title: {
    default: "Queuesis — CUHK Timetable Planner",
    template: "%s · Queuesis",
  },
  applicationName: "Queuesis",
  description: "Plan your perfect CUHK timetable.",
  keywords: [
    "CUHK timetable",
    "CUHK timetable planner",
    "CUHK timetable app",
    "CU timetable planner",
    "Timetable CUHK",
    "CUHK Course",
    "CUHK planner",
    "CUHK course planner",
    "CUHK schedule planner",
    "Chinese University of Hong Kong timetable",
    "CUSIS timetable",
  ],
  authors: [{ name: "Queuesis" }],
  category: "Education",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Queuesis — CUHK Timetable Planner",
    description: "Build, optimize, and export your CUHK class timetable.",
    url: "/",
    siteName: "Queuesis",
    type: "website",
    locale: "en_HK",
  },
  twitter: {
    card: "summary",
    title: "Queuesis — CUHK Timetable Planner",
    description: "Build, optimize, and export your CUHK class timetable.",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
  },
};

// import TaiPoFirePopup from "@/components/TaiPoFirePopup";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://queuesis.vercel.app";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:bg-[#1e1e1e]`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Queuesis",
              url: baseUrl,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              description:
                "A CUHK timetable planner for searching courses, creating clash-free schedules, and exporting classes to a calendar.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "HKD",
              },
              areaServed: {
                "@type": "CollegeOrUniversity",
                name: "The Chinese University of Hong Kong",
              },
            }),
          }}
        />
        <ThemeProvider>
          {children}
          {/* <TaiPoFirePopup /> */}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
