import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import ToastProvider from "./components/ToastProvider";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateEnvVars } from "@/lib/env";

// Validate environment variables at startup
if (typeof window === 'undefined') {
  validateEnvVars();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AirService Enterprise - ระบบบริหารจัดการงานบริการแอร์",
  description: "Enterprise Air Service Management System - ระบบจัดการงานบริการเครื่องปรับอากาศแบบครบวงจร สำหรับองค์กร",
  keywords: ["Air Service", "เครื่องปรับอากาศ", "Maintenance", "Work Order", "Asset Management"],
  authors: [{ name: "AirService Enterprise Team" }],
  creator: "AirService Enterprise",
  publisher: "AirService Enterprise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "AirService Enterprise - ระบบบริหารจัดการงานบริการแอร์",
    description: "Enterprise Air Service Management System - ระบบจัดการงานบริการเครื่องปรับอากาศแบบครบวงจร",
    url: "/",
    siteName: "AirService Enterprise",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AirService Enterprise - ระบบบริหารจัดการงานบริการแอร์",
    description: "Enterprise Air Service Management System - ระบบจัดการงานบริการเครื่องปรับอากาศแบบครบวงจร",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  
  // แปลง user เป็น format ที่ Navigation ต้องการ
  const navUser = user ? {
    username: user.username,
    fullName: user.fullName || undefined,
    role: user.role as "ADMIN" | "TECHNICIAN" | "CLIENT",
  } : null;

  // ดึงจำนวนข้อความที่ยังไม่ได้อ่านสำหรับ ADMIN
  let unreadMessageCount = 0;
  if (user?.role === 'ADMIN') {
    try {
      unreadMessageCount = await prisma.contactMessage.count({
        where: {
          isRead: false,
        },
      });
    } catch (error) {
      // Ignore error (อาจเป็นเพราะ Prisma client ยังไม่ regenerate)
      unreadMessageCount = 0;
    }
  }

  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <ToastProvider />
        <Navigation user={navUser} unreadMessageCount={unreadMessageCount} />
        <main>{children}</main>
      </body>
    </html>
  );
}
