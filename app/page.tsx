import { getCurrentUser } from "../lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import TechnicianDashboard from "@/app/components/dashboards/TechnicianDashboard";
import ClientDashboard from "@/app/components/dashboards/ClientDashboard";
import AdminDashboard from "@/app/components/dashboards/AdminDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();

  const roleTitles: Record<string, string> = {
    ADMIN: "Dashboard - ผู้ดูแลระบบ",
    TECHNICIAN: "Dashboard - ช่าง",
    CLIENT: "Dashboard - ลูกค้า",
  };

  return {
    title: user
      ? `${roleTitles[user.role] || "Dashboard"} - AirService Enterprise`
      : "Dashboard - AirService Enterprise",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // ถ้ายังไม่ได้ login ให้ไปหน้า welcome
  if (!user) {
    // Log only if debugging dashboard issues
    // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_DASHBOARD === 'true') {
    //   console.log('[Dashboard] No user found, redirecting to welcome')
    // }
    redirect('/welcome');
  }

  // Log only in development and only for debugging
  // Uncomment below if you need to debug dashboard issues:
  // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_DASHBOARD === 'true') {
  //   console.log('[Dashboard] User:', { userId: user.userId, role: user.role, siteId: user.siteId })
  // }

  // TECHNICIAN
  if (user.role === 'TECHNICIAN') {
    return <TechnicianDashboard userId={user.userId} />;
  }

  // CLIENT
  if (user.role === 'CLIENT') {
    let siteId = user.siteId;
    if (!siteId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { siteId: true },
        });
        siteId = dbUser?.siteId ?? null;
      } catch (error) {
        console.error('[Dashboard] Error fetching user siteId:', error);
        // ถ้า database error ให้ใช้ siteId จาก JWT (ถ้ามี)
        siteId = user.siteId ?? null;
      }
    }
    if (!siteId) {
      return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(194, 166, 106, 0.2)' }}>
              <svg className="w-8 h-8" style={{ color: '#C2A66A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-app-heading mb-2">
              ไม่พบข้อมูลสถานที่
            </h1>
            <p className="text-app-body">
              กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดสถานที่ให้กับบัญชีของคุณ หรือ ล็อกเอาท์แล้วล็อกอินใหม่หลัง seed
            </p>
          </div>
        </div>
      );
    }
    return <ClientDashboard siteId={siteId} />;
  }

  // ADMIN
  return <AdminDashboard />;
}
