import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppLayout from "./components/AppLayout";
import ToastProvider from "./components/ToastProvider";
import ThemeProvider from "./components/ThemeProvider";
import ViewTransitionHandler from "./components/ViewTransitionHandler";
import { validateEnvVars } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Validate environment variables at startup
if (typeof window === 'undefined') {
  validateEnvVars();
}

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
  
  // ดึงข้อมูล user เพิ่มเติมจาก DB (username, fullName, siteName)
  let userData = null;
  if (user) {
    try {
      // ดึง siteId จาก DB ถ้า JWT ไม่มี (รองรับ session เก่า)
      let siteId = user.siteId;
      if (!siteId && user.role === 'CLIENT') {
        const siteIdCheck = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { siteId: true },
        });
        siteId = siteIdCheck?.siteId ?? null;
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          username: true,
          fullName: true,
          role: true,
          siteId: true,
          site: {
            select: {
              name: true,
            },
          },
        },
      });
      
      if (dbUser) {
        // ใช้ siteId จาก DB ถ้ามี (ใหม่กว่า JWT)
        const finalSiteId = dbUser.siteId || siteId;
        let siteName = dbUser.site?.name || null;
        
        // ถ้ายังไม่มี siteName แต่มี siteId ให้ query ใหม่
        if (!siteName && finalSiteId) {
          const site = await prisma.site.findUnique({
            where: { id: finalSiteId },
            select: { name: true },
          });
          siteName = site?.name || null;
        }
        
        userData = {
          role: dbUser.role as "ADMIN" | "TECHNICIAN" | "CLIENT",
          username: dbUser.username,
          fullName: dbUser.fullName,
          siteName,
        };
      }
    } catch (error) {
      console.error('[Layout] Error fetching user data:', error);
      // Fallback to basic user data from JWT
      userData = {
        role: user.role as "ADMIN" | "TECHNICIAN" | "CLIENT",
        username: undefined,
        fullName: null,
        siteName: null,
      };
    }
  }

  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className="antialiased bg-app-bg text-app-body font-sans"
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){var t=localStorage.getItem("airservice-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);})();`}
        </Script>
        <ThemeProvider>
          <ViewTransitionHandler />
          <ToastProvider />
          {userData ? (
            <AppLayout
              role={userData.role}
              username={userData.username}
              fullName={userData.fullName}
              siteName={userData.siteName}
            >
              {children}
            </AppLayout>
          ) : (
            <main className="page-transition min-h-screen">
              {children}
            </main>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
