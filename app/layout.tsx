import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { cache } from "react";
import AppLayout from "./components/AppLayout";
import ToastProvider from "./components/ToastProvider";
import ThemeProvider from "./components/ThemeProvider";
import { validateEnvVars } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Validate environment variables at startup
if (typeof window === 'undefined') {
  validateEnvVars();
}

export const metadata: Metadata = {
  title: "LMT air service - ระบบบริหารจัดการงานบริการแอร์",
  description: "LMT air service Management System - ระบบจัดการงานบริการเครื่องปรับอากาศแบบครบวงจร สำหรับองค์กร",
  keywords: ["LMT air service", "เครื่องปรับอากาศ", "Maintenance", "Work Order", "Asset Management"],
  authors: [{ name: "LMT air service Team" }],
  creator: "LMT air service",
  publisher: "LMT air service",
  icons: {
    icon: '/L.M.T.png',
    apple: '/L.M.T.png',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "LMT air service - ระบบบริหารจัดการงานบริการแอร์",
    description: "LMT air service Management System - ระบบจัดการงานบริการเครื่องปรับอากาศแบบครบวงจร",
    url: "/",
    siteName: "LMT air service",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMT air service - ระบบบริหารจัดการงานบริการแอร์",
    description: "LMT air service Management System - ระบบจัดการงานบริการเครื่องปรับอากาศแบบครบวงจร",
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

/** ดึงโปรไฟล์ครั้งเดียวต่อ request — ลด query ซ้ำถ้า React render ซ้อน */
const getUserProfileForLayout = cache(async (userId: string) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      fullName: true,
      role: true,
      siteId: true,
      lineUserId: true,
      site: { select: { name: true } },
    },
  });
  if (!dbUser) return null;
  let siteName = dbUser.site?.name ?? null;
  const finalSiteId = dbUser.siteId;
  if (!siteName && finalSiteId) {
    const site = await prisma.site.findUnique({
      where: { id: finalSiteId },
      select: { name: true },
    });
    siteName = site?.name ?? null;
  }
  return {
    role: dbUser.role as "ADMIN" | "TECHNICIAN" | "CLIENT",
    username: dbUser.username,
    fullName: dbUser.fullName,
    siteName,
    lineUserId: dbUser.lineUserId,
  };
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // ถ้าไม่มี user และไม่ใช่ public route ให้ redirect ไป login
  // (แต่ให้ middleware จัดการก่อน เพราะ middleware จะทำงานก่อน)
  // ตรงนี้เป็น fallback สำหรับกรณีที่ middleware ไม่ได้ทำงาน

  let userData = null;
  if (user) {
    try {
      const profile = await getUserProfileForLayout(user.userId);
      if (profile) {
        userData = profile;
      } else {
        userData = {
          role: user.role as "ADMIN" | "TECHNICIAN" | "CLIENT",
          username: undefined,
          fullName: null,
          siteName: null,
          lineUserId: null,
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
        lineUserId: null,
      };
    }
  }


  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className="antialiased bg-app-bg text-app-body font-sans overflow-x-hidden"
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){var t=localStorage.getItem("airservice-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);})();`}
        </Script>
        <ThemeProvider>
          <ToastProvider />
          {userData ? (
            <AppLayout
              role={userData.role}
              username={userData.username}
              fullName={userData.fullName}
              siteName={userData.siteName}
              lineUserId={userData.lineUserId}
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
