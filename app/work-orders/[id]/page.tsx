import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateWorkOrderStatus } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import DeleteWorkOrderButton from "./DeleteButton";
import AssignTechnicianButton from "./AssignTechnicianButton";
import ExportButton from "./ExportButton";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      site: {
        include: { client: true },
      },
    },
  });

  if (!workOrder) {
    return {
      title: "ไม่พบข้อมูล - AirService Enterprise",
    };
  }

  const jobTypeLabels: Record<string, string> = {
    PM: "บำรุงรักษา",
    CM: "ซ่อมแซม",
    INSTALL: "ติดตั้ง",
  };

  const statusLabels: Record<string, string> = {
    OPEN: "เปิด",
    IN_PROGRESS: "กำลังดำเนินการ",
    COMPLETED: "เสร็จสิ้น",
    CANCELLED: "ยกเลิก",
  };

  const title = `ใบสั่งงาน ${jobTypeLabels[workOrder.jobType] || workOrder.jobType} - AirService Enterprise`;
  const description = `ใบสั่งงาน ${jobTypeLabels[workOrder.jobType] || workOrder.jobType} | สถานะ: ${statusLabels[workOrder.status] || workOrder.status} | ${workOrder.site.client.name} - ${workOrder.site.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      site: {
        include: { client: true },
      },
      jobItems: {
        include: {
          asset: {
            include: {
              room: {
                include: {
                  floor: {
                    include: {
                      building: {
                        include: {
                          site: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          technician: true,
          photos: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!workOrder) {
    notFound();
  }

  // Access Control: CLIENT สามารถดูได้เฉพาะ Work Order ใน Site ของตัวเอง
  if (user.role === 'CLIENT') {
    if (!user.siteId || workOrder.siteId !== user.siteId) {
      notFound();
    }
  }

  const doneCount = workOrder.jobItems.filter((j) => j.status === "DONE").length;
  const progressPercent = workOrder.jobItems.length > 0
    ? (doneCount / workOrder.jobItems.length) * 100
    : 0;

  // Get all technicians for assignment (only for ADMIN)
  const technicians = user.role === 'ADMIN' ? await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: {
      id: true,
      username: true,
      fullName: true,
    },
    orderBy: { username: 'asc' },
  }) : [];

  const getWOStatusConfig = (status: string) => {
    const configs = {
      COMPLETED: { bg: "from-green-500 to-emerald-600", text: "เสร็จสิ้น", icon: "" },
      IN_PROGRESS: { bg: "from-blue-500 to-indigo-600", text: "กำลังทำงาน", icon: "" },
      CANCELLED: { bg: "from-red-500 to-pink-600", text: "ยกเลิก", icon: "" },
      OPEN: { bg: "from-gray-400 to-gray-500", text: "รอดำเนินการ", icon: "" },
    };
    return configs[status as keyof typeof configs] || configs.OPEN;
  };

  const getJobStatusConfig = (status: string) => {
    const configs = {
      DONE: { bg: "from-green-500 to-emerald-600", text: "เสร็จสิ้น", icon: "" },
      IN_PROGRESS: { bg: "from-blue-500 to-indigo-600", text: "กำลังทำ", icon: "" },
      ISSUE_FOUND: { bg: "from-yellow-500 to-orange-600", text: "พบปัญหา", icon: "" },
      PENDING: { bg: "from-gray-400 to-gray-500", text: "รอทำ", icon: "" },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const woStatusConfig = getWOStatusConfig(workOrder.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/work-orders" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium text-gray-900">กลับไปหน้ารายการ</span>
        </Link>

        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          {/* Action Buttons - Only for ADMIN */}
          {user.role === 'ADMIN' && (
            <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-gray-200">
              <ExportButton workOrder={workOrder} />
              <Link
                href={`/work-orders/${id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                แก้ไข
              </Link>
              <DeleteWorkOrderButton workOrderId={id} />
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-2xl">📋</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {workOrder.jobType}
                </h1>
                <div className={`px-4 py-2 bg-gradient-to-r ${woStatusConfig.bg} text-white rounded-xl shadow-md flex items-center gap-2`}>
                  <span>{woStatusConfig.icon}</span>
                  <span className="font-semibold text-sm">{woStatusConfig.text}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium text-gray-900">{workOrder.site.name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{workOrder.site.client.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <span>📅</span>
                  <span>วันนัดหมาย: {new Date(workOrder.scheduledDate).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</span>
                </div>
                {workOrder.assignedTeam && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <span>👥</span>
                    <span>ทีม: {workOrder.assignedTeam}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 min-w-[200px]">
              <div className="text-sm text-gray-600 mb-2">ความคืบหน้า</div>
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {doneCount}<span className="text-xl text-gray-400">/{workOrder.jobItems.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                {Math.round(progressPercent)}% เสร็จสิ้น
              </div>
            </div>
          </div>

          {/* Status Actions - Only for ADMIN */}
          {user.role === 'ADMIN' && workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED" && (
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
              {workOrder.status === "OPEN" && (
                <form action={updateWorkOrderStatus.bind(null, workOrder.id, "IN_PROGRESS")}>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <span>เริ่มงาน</span>
                  </button>
                </form>
              )}
              {workOrder.status === "IN_PROGRESS" && (
                <form action={updateWorkOrderStatus.bind(null, workOrder.id, "COMPLETED")}>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <span>เสร็จสิ้นงาน</span>
                  </button>
                </form>
              )}
              <form action={updateWorkOrderStatus.bind(null, workOrder.id, "CANCELLED")}>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <span>ยกเลิก</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Job Items List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">
                รายการงาน
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                {workOrder.jobItems.length} รายการ
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {workOrder.jobItems.map((jobItem) => {
              const jobStatusConfig = getJobStatusConfig(jobItem.status);
              return (
                <div key={jobItem.id} className="p-6 hover:bg-blue-50/50 transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Link
                          href={`/assets/${jobItem.asset.id}`}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-lg"
                        >
                          {jobItem.asset.brand} {jobItem.asset.model}
                        </Link>
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-600">
                          {jobItem.asset.qrCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 flex-wrap">
                        <span>{jobItem.asset.room.floor.building.site.name}</span>
                        <span className="text-gray-400">→</span>
                        <span>{jobItem.asset.room.floor.building.name}</span>
                        <span className="text-gray-400">→</span>
                        <span>{jobItem.asset.room.floor.name}</span>
                        <span className="text-gray-400">→</span>
                        <span>{jobItem.asset.room.name}</span>
                      </div>
                      {jobItem.techNote && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                          <div className="flex items-start gap-2">
                            <p className="text-gray-700 text-sm flex-1">{jobItem.techNote}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-4 py-2 bg-gradient-to-r ${jobStatusConfig.bg} text-white rounded-xl shadow-md flex items-center gap-2`}>
                        <span>{jobStatusConfig.icon}</span>
                        <span className="font-semibold text-sm">{jobStatusConfig.text}</span>
                      </div>
                      {jobItem.technician ? (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span>ช่าง: {jobItem.technician.fullName || jobItem.technician.username}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <span>ยังไม่ได้มอบหมาย</span>
                        </div>
                      )}
                      {user.role === 'ADMIN' && (
                        <div className="mt-2">
                          <AssignTechnicianButton
                            jobItemId={jobItem.id}
                            currentTechnicianId={jobItem.technicianId}
                            technicians={technicians}
                          />
                        </div>
                      )}
                      {jobItem.startTime && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span>🕐</span>
                          <span>{new Date(jobItem.startTime).toLocaleString("th-TH")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {jobItem.photos.length > 0 && (
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                      {jobItem.photos.map((photo) => (
                        <div key={photo.id} className="relative flex-shrink-0 group">
                          <img
                            src={photo.url}
                            alt={photo.type}
                            className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-200"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs px-2 py-1.5 rounded-b-xl font-semibold">
                            {photo.type === "BEFORE" && "ก่อน"}
                            {photo.type === "AFTER" && "หลัง"}
                            {photo.type === "DEFECT" && "ชำรุด"}
                            {photo.type === "METER" && "เกจ"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}