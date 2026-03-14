export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getJobStatus } from "@/lib/status-colors";

export default async function TechnicianPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') redirect('/');

  // สถานะใบงานที่ช่างเห็นได้ (รวมรออนุมัติ/อนุมัติแล้ว)
  const activeStatuses = ["OPEN", "IN_PROGRESS", "WAITING_APPROVAL", "APPROVED"] as const;

  // สถานะรายการงานที่ยังไม่เสร็จ (รวม "พบปัญหา" เพื่อให้ช่างเห็นและกดดำเนินการต่อได้)
  const jobItemActiveStatuses = ["PENDING", "IN_PROGRESS", "ISSUE_FOUND"] as const;

  // งานที่ assign ให้ช่างคนนี้
  const myWorkOrders = await prisma.workOrder.findMany({
    where: {
      status: { in: [...activeStatuses] },
      jobItems: {
        some: {
          technicianId: user.userId,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    include: {
      site: { include: { client: true } },
      jobItems: {
        include: { asset: true },
        where: {
          technicianId: user.userId,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  // งานที่ยังไม่มีคนรับ (unassigned) — แสดงให้ช่างเห็นและกดรับงานได้
  const unassignedWorkOrders = await prisma.workOrder.findMany({
    where: {
      status: { in: [...activeStatuses] },
      jobItems: {
        some: {
          technicianId: null,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    include: {
      site: { include: { client: true } },
      jobItems: {
        include: { asset: true },
        where: {
          technicianId: null,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  const renderWorkOrderCard = (wo: any, isMyJob: boolean) => {
    const statusConfig = wo.status === "IN_PROGRESS"
      ? { bg: "from-blue-500 to-indigo-600", text: "กำลังทำงาน" }
      : { bg: "from-gray-400 to-gray-500", text: "รอดำเนินการ" };

    return (
      <div key={wo.id} className="bg-app-card rounded-2xl shadow-xl p-6 border border-app hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-xl font-bold text-app-heading">{wo.jobType}</h2>
              <div className={`px-3 py-1 bg-gradient-to-r ${statusConfig.bg} text-white rounded-lg shadow-sm text-xs font-semibold`}>
                {statusConfig.text}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-app-body">
                <span className="text-lg">🏢</span>
                <span className="font-medium">{wo.site.name}</span>
              </div>
              <div className="flex items-center gap-2 text-app-muted text-sm">
                <span>•</span>
                <span>{wo.site.client.name}</span>
              </div>
              <div className="flex items-center gap-2 text-app-muted text-sm">
                <span>📅</span>
                <span>วันนัดหมาย: {new Date(wo.scheduledDate).toLocaleDateString("th-TH", {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>
          <Link
            href={`/technician/work-order/${wo.id}`}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>{isMyJob ? '▶️' : '👀'}</span>
            <span>{isMyJob ? 'เข้าทำงาน' : 'ดูรายละเอียด'}</span>
          </Link>
        </div>

        <div className="border-t border-app pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-app-body">
              รายการงาน:
            </span>
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-bold">
              {wo.jobItems.length} รายการ
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wo.jobItems.slice(0, 4).map((jobItem: any) => (
              <div
                key={jobItem.id}
                className="bg-app-section rounded-xl p-3 border border-app hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">❄️</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-app-heading truncate">
                      {jobItem.asset.qrCode}
                    </div>
                    <div className="text-xs text-app-muted font-mono bg-app-card px-2 py-0.5 rounded inline-block mt-1">
                      {jobItem.asset.qrCode}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {wo.jobItems.length > 4 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-app-muted bg-app-section px-3 py-1 rounded-full">
                + อีก {wo.jobItems.length - 4} รายการ
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">🔧</span>
            </div>
            <h1 className="text-3xl font-bold text-app-heading">
              หน้างาน (ช่าง)
            </h1>
          </div>
          <p className="text-app-muted ml-15">จัดการงานบำรุงรักษาและซ่อมแซม</p>
        </div>

        {/* งานที่ยังไม่มีคนรับ — แสดงก่อนเพื่อให้เห็นใบงานที่แอดมินสร้างแล้วทันที */}
        {unassignedWorkOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-app-heading">📋 งานที่ยังไม่มีคนรับ</h2>
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-bold">
                {unassignedWorkOrders.length}
              </span>
            </div>
            <p className="text-sm text-app-muted mb-3">ใบงานที่แอดมินสร้างแล้ว ยังไม่ได้มอบหมายช่าง — กดดูรายละเอียดแล้วมอบหมายตัวเองได้จากหน้ารายละเอียดใบงาน</p>
            <div className="space-y-4">
              {unassignedWorkOrders.map((wo) => renderWorkOrderCard(wo, false))}
            </div>
          </div>
        )}

        {/* งานของฉัน */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-app-heading">📌 งานของฉัน</h2>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold">
              {myWorkOrders.length}
            </span>
          </div>

          {myWorkOrders.length === 0 ? (
            <div className="bg-app-card rounded-2xl shadow-xl p-8 text-center border border-app">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-lg font-bold text-app-heading mb-2">ไม่มีงานที่ต้องทำ</h3>
              <p className="text-app-muted text-sm">
                {unassignedWorkOrders.length > 0
                  ? 'หรือเลือกรับงานจากรายการ "งานที่ยังไม่มีคนรับ" ด้านบน'
                  : 'ดูงานที่ยังไม่มีคนรับด้านบนเมื่อแอดมินสร้างใบงานใหม่'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myWorkOrders.map((wo) => renderWorkOrderCard(wo, true))}
            </div>
          )}
        </div>

        {/* Quick Instructions */}
        <div className="bg-app-card border border-app rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📱</span>
            <h3 className="font-bold text-app-heading text-lg">วิธีใช้งาน (สำหรับช่าง)</h3>
          </div>
          <ol className="space-y-3 text-sm text-app-body">
            {[
              "เลือกงานที่ต้องทำจาก \"งานของฉัน\" หรือกดรับงาน",
              "กดปุ่ม \"เข้าทำงาน\" เพื่อดูรายละเอียด",
              "สแกน QR Code ที่ตัวแอร์ หรือเลือกจากรายการ",
              "ถ่ายรูป Before (ก่อนทำ) และ After (หลังทำ)",
              "ให้ลูกค้าเซ็นรับงาน แล้วบันทึกข้อมูล"
            ].map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="flex-1 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
