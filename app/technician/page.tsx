export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TechnicianPage() {
  // ดึง Work Orders ที่ยังไม่เสร็จ
  const activeWorkOrders = await prisma.workOrder.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    include: {
      site: {
        include: { client: true },
      },
      jobItems: {
        include: {
          asset: true,
        },
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const getStatusConfig = (status: string) => {
    if (status === "IN_PROGRESS") {
      return { bg: "from-blue-500 to-indigo-600", text: "กำลังทำงาน", icon: "" };
    }
    return { bg: "from-gray-400 to-gray-500", text: "รอดำเนินการ", icon: "" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">🔧</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent">
              หน้างาน (ช่าง)
            </h1>
          </div>
          <p className="text-gray-600 ml-15">จัดการงานบำรุงรักษาและซ่อมแซม</p>
        </div>

        {activeWorkOrders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">ไม่มีงานที่ต้องทำ</h2>
            <p className="text-gray-600">งานทั้งหมดเสร็จเรียบร้อยแล้ว พักผ่อนได้เลย!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeWorkOrders.map((wo) => {
              const statusConfig = getStatusConfig(wo.status);
              return (
                <div key={wo.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">
                          {wo.jobType}
                        </h2>
                        <div className={`px-3 py-1 bg-gradient-to-r ${statusConfig.bg} text-white rounded-lg shadow-sm flex items-center gap-1.5 text-xs font-semibold`}>
                          <span>{statusConfig.icon}</span>
                          <span>{statusConfig.text}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-lg">🏢</span>
                          <span className="font-medium">{wo.site.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <span>•</span>
                          <span>{wo.site.client.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <span>📅</span>
                          <span>วันนัดหมาย: {new Date(wo.scheduledDate).toLocaleDateString("th-TH", { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/technician/work-order/${wo.id}`}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span>▶️</span>
                      <span>เริ่มงาน</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-gray-700">
                        รายการงานที่เหลือ:
                      </span>
                      <span className="px-2 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-lg text-sm font-bold">
                        {wo.jobItems.length} รายการ
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {wo.jobItems.slice(0, 4).map((jobItem) => (
                        <div
                          key={jobItem.id}
                          className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-3 border border-gray-200 hover:border-blue-300 transition-all duration-200"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">❄️</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {jobItem.asset.brand} {jobItem.asset.model}
                              </div>
                              <div className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded inline-block mt-1">
                                {jobItem.asset.qrCode}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {wo.jobItems.length > 4 && (
                      <div className="mt-3 text-center">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          + อีก {wo.jobItems.length - 4} รายการ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Instructions */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📱</span>
            <h3 className="font-bold text-blue-900 text-lg">วิธีใช้งาน (สำหรับช่าง)</h3>
          </div>
          <ol className="space-y-3 text-sm text-gray-700">
            {[
              "เลือกงานที่ต้องทำจากรายการด้านบน",
              "กดปุ่ม \"เริ่มงาน\" เพื่อดูรายละเอียด",
              "สแกน QR Code ที่ตัวแอร์ หรือพิมพ์รหัส QR Code",
              "ถ่ายรูป Before (ก่อนทำ) และ After (หลังทำ)",
              "บันทึกข้อมูลและอัปเดตสถานะงาน"
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
