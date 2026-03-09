import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface AssetHistoryTimelineProps {
  assetId: string;
  currentJobItemId?: string; // เพื่อ highlight job item ปัจจุบัน
}

export default async function AssetHistoryTimeline({
  assetId,
  currentJobItemId,
}: AssetHistoryTimelineProps) {
  const jobItems = await prisma.jobItem.findMany({
    where: { assetId },
    include: {
      workOrder: {
        include: {
          site: { include: { client: true } },
        },
      },
      technician: true,
      photos: true,
    },
    orderBy: { startTime: "desc" },
    take: 10, // แสดง 10 รายการล่าสุด
  });

  if (jobItems.length === 0) {
    return (
      <div className="bg-app-section rounded-xl p-6 text-center border border-dashed border-app">
        <span className="text-2xl mb-2 block">📋</span>
        <p className="text-app-muted text-sm">ยังไม่มีประวัติการซ่อมบำรุง</p>
      </div>
    );
  }

  // ตรวจจับปัญหาเรื้อรัง: CM มากกว่า 2 ครั้งใน 3 เดือน
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentCM = jobItems.filter(
    (j) =>
      j.workOrder.jobType === "CM" &&
      j.startTime &&
      new Date(j.startTime) >= threeMonthsAgo
  );
  const hasChronicIssue = recentCM.length >= 2;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "DONE":
        return {
          color: "bg-green-500",
          text: "เสร็จสิ้น",
          textClass: "text-green-700 dark:text-green-400",
        };
      case "IN_PROGRESS":
        return {
          color: "bg-blue-500",
          text: "กำลังทำ",
          textClass: "text-blue-700 dark:text-blue-400",
        };
      case "ISSUE_FOUND":
        return {
          color: "bg-red-500",
          text: "พบปัญหา",
          textClass: "text-red-700 dark:text-red-400",
        };
      default:
        return {
          color: "bg-yellow-500",
          text: "รอดำเนินการ",
          textClass: "text-yellow-700 dark:text-yellow-400",
        };
    }
  };

  const getJobTypeConfig = (type: string) => {
    switch (type) {
      case "PM":
        return { emoji: "🔧", label: "บำรุงรักษา (PM)", bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" };
      case "CM":
        return { emoji: "🔨", label: "ซ่อมแซม (CM)", bg: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" };
      case "INSTALL":
        return { emoji: "📦", label: "ติดตั้ง", bg: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300" };
      default:
        return { emoji: "📋", label: type, bg: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300" };
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning: ปัญหาเรื้อรัง */}
      {hasChronicIssue && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-300">
              เครื่องนี้อาจมีปัญหาเรื้อรัง
            </h4>
            <p className="text-sm text-red-700 dark:text-red-400">
              พบงานซ่อม (CM) {recentCM.length} ครั้งในช่วง 3 เดือนที่ผ่านมา —
              อาจต้องตรวจสอบเพิ่มเติมหรือพิจารณาเปลี่ยนเครื่อง
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* เส้น Timeline */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-app-border"></div>

        <div className="space-y-4">
          {jobItems.map((item, index) => {
            const isCurrent = item.id === currentJobItemId;
            const status = getStatusConfig(item.status);
            const jobType = getJobTypeConfig(item.workOrder.jobType);

            return (
              <div
                key={item.id}
                className={`relative pl-10 ${
                  isCurrent ? "ring-2 ring-blue-500 rounded-xl" : ""
                }`}
              >
                {/* จุด Timeline */}
                <div
                  className={`absolute left-2.5 w-3 h-3 rounded-full ${status.color} border-2 border-app-bg`}
                  style={{ top: "1.25rem" }}
                ></div>

                <div
                  className={`bg-app-card rounded-xl p-4 border ${
                    isCurrent
                      ? "border-blue-400 dark:border-blue-600"
                      : "border-app"
                  } shadow-sm`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${jobType.bg}`}
                      >
                        {jobType.emoji} {jobType.label}
                      </span>
                      <span
                        className={`text-xs font-semibold ${status.textClass}`}
                      >
                        {status.text}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold animate-pulse">
                          งานนี้
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-app-muted">
                      {item.startTime
                        ? new Date(item.startTime).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "ไม่ระบุวัน"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-sm">
                    {item.technician && (
                      <div className="text-app-body">
                        <span className="text-app-muted">ช่าง:</span>{" "}
                        <span className="font-medium">
                          {item.technician.fullName ||
                            item.technician.username}
                        </span>
                      </div>
                    )}
                    {item.techNote && (
                      <div className="text-app-body mt-1">
                        <span className="text-app-muted">บันทึก:</span>{" "}
                        <span className="italic">{item.techNote}</span>
                      </div>
                    )}
                    {item.startTime && item.endTime && (
                      <div className="text-app-muted text-xs">
                        ⏱️ ใช้เวลา{" "}
                        {Math.round(
                          (new Date(item.endTime).getTime() -
                            new Date(item.startTime).getTime()) /
                            60000
                        )}{" "}
                        นาที
                      </div>
                    )}
                  </div>

                  {/* Photos Preview */}
                  {item.photos.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {item.photos.slice(0, 4).map((photo) => (
                        <div key={photo.id} className="flex-shrink-0">
                          <img
                            src={photo.url}
                            alt={photo.type}
                            className="w-16 h-16 object-cover rounded-lg border border-app"
                          />
                          <div className="text-[10px] text-center text-app-muted mt-0.5">
                            {photo.type === "BEFORE"
                              ? "ก่อน"
                              : photo.type === "AFTER"
                              ? "หลัง"
                              : photo.type === "DEFECT"
                              ? "ชำรุด"
                              : "เกจ"}
                          </div>
                        </div>
                      ))}
                      {item.photos.length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 bg-app-section rounded-lg flex items-center justify-center text-xs text-app-muted">
                          +{item.photos.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
