import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updateWorkOrderStatus } from "@/app/actions";
import DeleteWorkOrderButton from "./DeleteButton";
import CancelWorkOrderButton from "./CancelButton";
import AssignTechnicianButton from "./AssignTechnicianButton";
import ExportButton from "./ExportButton";
import ReopenJobItemButton from "./ReopenJobItemButton";
import WorkOrderJobItemPhotos from "./WorkOrderJobItemPhotos";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { getWOStatus, getJobStatus } from "@/lib/status-colors";
import { getWorkOrderDisplayNumber } from "@/lib/work-order-number";
import type { Metadata } from "next";
import { formatThaiDate } from "@/lib/date-utils";

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
      title: "ไม่พบข้อมูล - LMT air service",
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

  const title = `ใบสั่งงาน ${jobTypeLabels[workOrder.jobType] || workOrder.jobType} - LMT air service`;
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

  const baseInclude = {
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
        pmSchedule: { select: { pmType: true } },
        photos: {
          orderBy: { createdAt: 'asc' },
        },
      },
    },
  } as const

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      ...baseInclude,
      duplicateOf: {
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          scheduledDate: true,
          jobItems: {
            select: {
              asset: {
                select: {
                  qrCode: true,
                },
              },
            },
          },
        },
      },
      duplicates: {
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          scheduledDate: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  }).catch(async (error) => {
    // Backward-compatible fallback when Prisma Client is stale and
    // doesn't include duplicateOf/duplicates relation yet.
    const message = error instanceof Error ? error.message : ''
    if (!message.includes('Unknown field `duplicateOf`')) throw error

    const fallback = await prisma.workOrder.findUnique({
      where: { id },
      include: baseInclude,
    })

    if (!fallback) return fallback
    return { ...fallback, duplicateOf: null, duplicates: [] }
  })

  if (!workOrder) {
    notFound();
  }

  // Access Control: CLIENT สามารถดูได้เฉพาะ Work Order ใน Site ของตัวเอง
  if (user.role === 'CLIENT') {
    let siteId = user.siteId
    if (!siteId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { siteId: true },
      })
      siteId = dbUser?.siteId ?? null
    }
    if (!siteId || workOrder.siteId !== siteId) {
      notFound()
    }
  }

  // Access Control: TECHNICIAN สามารถดูได้เฉพาะ Work Order ที่มี jobItem ที่ assign ให้ตัวเองเท่านั้น
  if (user.role === 'TECHNICIAN') {
    const isAssigned = workOrder.jobItems.some(
      (item) => item.technicianId === user.id
    )
    if (!isAssigned) {
      notFound()
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

  const woStatusConfig = getWOStatus(workOrder.status);

  const jobTypeLabels: Record<string, string> = {
    PM: "บำรุงรักษา",
    CM: "ซ่อมแซม",
    INSTALL: "ติดตั้ง",
  };
  const currentAssetCodes = workOrder.jobItems.map((item) => item.asset.qrCode)
  const duplicateAssetCodes = workOrder.duplicateOf?.jobItems?.map((item) => item.asset.qrCode) || []
  const overlappingAssetCodes = currentAssetCodes.filter((code) => duplicateAssetCodes.includes(code))
  const overlapPreview = overlappingAssetCodes.slice(0, 3).join(', ')
  const overlapMoreCount = overlappingAssetCodes.length - Math.min(overlappingAssetCodes.length, 3)

  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-full">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'ใบสั่งงาน', href: '/work-orders' },
            { label: `${jobTypeLabels[workOrder.jobType] || workOrder.jobType} - ${workOrder.site.name}`, href: undefined },
          ]}
        />

        {/* Header Card - Status Card style (border-left) */}
        <div className="bg-app-card rounded-2xl shadow-xl p-6 mb-6 border border-app border-l-4" style={{ borderLeftColor: woStatusConfig.hex }}>
          <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-app">
            {/* Export buttons are visible to everyone (Client/Admin/Tech) */}
            <ExportButton workOrder={workOrder} />
            {user.role === 'ADMIN' && (
              <>
                <Link href={`/work-orders/${id}/edit`} className="inline-flex items-center px-4 py-2 btn-app-primary rounded-lg hover:shadow-md transition-all">
                  แก้ไข
                </Link>
                <DeleteWorkOrderButton workOrderId={id} />
              </>
            )}
          </div>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${woStatusConfig.hex}30` }}>
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-app-heading">{workOrder.jobType}</h1>
                  <div className="text-sm font-mono text-app-muted mt-1">เลขที่ {getWorkOrderDisplayNumber(workOrder)}</div>
                </div>
                <span className={`px-4 py-2 rounded-xl font-semibold text-sm ${woStatusConfig.tailwind}`}>{woStatusConfig.label}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-app-body">
                  <span className="font-medium text-app-heading">{workOrder.site.name}</span>
                  <span className="text-app-muted">•</span>
                  <span className="text-app-body">{workOrder.site.client.name}</span>
                  {user.role !== 'CLIENT' && workOrder.site.latitude && workOrder.site.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${workOrder.site.latitude},${workOrder.site.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold hover:bg-green-200 transition-colors"
                    >
                      🗺️ นำทาง
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 text-app-body text-sm">
                  <span>📅</span>
                  <span>วันนัดหมาย: {formatThaiDate(workOrder.scheduledDate, 'long')}</span>
                </div>
                {workOrder.assignedTeam && (
                  <div className="flex items-center gap-2 text-app-body text-sm">
                    <span>👥</span>
                    <span>ทีม: {workOrder.assignedTeam}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-app-section rounded-xl p-5 border border-app min-w-[200px]">
              <div className="text-sm text-app-muted mb-2">ความคืบหน้า</div>
              <div className="text-3xl font-bold mb-3" style={{ color: woStatusConfig.hex }}>
                {doneCount}<span className="text-xl text-app-muted">/{workOrder.jobItems.length}</span>
              </div>
              <div className="w-full bg-app-section rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, backgroundColor: woStatusConfig.hex }}
                />
              </div>
              <div className="text-xs text-app-muted mt-2 text-center">
                {Math.round(progressPercent)}% เสร็จสิ้น
              </div>
            </div>
          </div>

          {/* Status Actions - Only for ADMIN */}
          {user.role === 'ADMIN' && workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED" && (
            <div className="flex flex-wrap gap-3 pt-6 border-t border-app">
              {(doneCount === workOrder.jobItems.length) && (
                <form action={updateWorkOrderStatus.bind(null, workOrder.id, "COMPLETED")}>
                  <button type="submit" className="btn-app-primary px-6 py-3 rounded-xl hover:shadow-xl font-semibold transition-all flex items-center gap-2">
                    <span>เสร็จสิ้นงาน</span>
                  </button>
                </form>
              )}
              <CancelWorkOrderButton workOrderId={workOrder.id} />
            </div>
          )}
        </div>

        {(workOrder.duplicateOf || workOrder.duplicates.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <h3 className="text-lg font-bold text-amber-900 mb-3">ความสัมพันธ์งานซ้ำ (เครื่อง/เดือนเดียวกัน)</h3>

            {workOrder.duplicateOf && (
              <div className="text-sm text-amber-900 mb-3">
                <span className="font-semibold">งานนี้อ้างอิงจากใบงานเดิม: </span>
                <Link href={`/work-orders/${workOrder.duplicateOf.id}`} className="underline font-semibold hover:text-amber-700">
                  {workOrder.duplicateOf.workOrderNumber || workOrder.duplicateOf.id}
                </Link>
                <span className="text-amber-800"> • {formatThaiDate(workOrder.duplicateOf.scheduledDate, 'short')}</span>
                <p className="mt-2 text-amber-900">
                  ซ้ำในความหมายของระบบ: เครื่องเดียวกัน + ประเภทงานเดียวกัน + เดือนเดียวกัน
                  {overlappingAssetCodes.length > 0 && (
                    <>
                      {' '}เช่น {overlapPreview}
                      {overlapMoreCount > 0 && ` และอีก ${overlapMoreCount} เครื่อง`}
                    </>
                  )}
                </p>
              </div>
            )}

            {workOrder.duplicates.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-amber-900 mb-2">
                  ใบงานที่ถูกสร้างซ้ำจากงานนี้ ({workOrder.duplicates.length} รายการ)
                </div>
                <div className="flex flex-wrap gap-2">
                  {workOrder.duplicates.map((dup) => (
                    <Link
                      key={dup.id}
                      href={`/work-orders/${dup.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-sm hover:bg-amber-100 transition-colors"
                    >
                      {dup.workOrderNumber || dup.id}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Items List */}
        <div className="bg-app-card rounded-2xl shadow-xl border border-app overflow-hidden">
          <div className="p-6 border-b border-app bg-app-section">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-app-heading">รายการงาน</h2>
              <span className="px-3 py-1 rounded-lg text-sm font-bold" style={{ backgroundColor: 'rgba(91,124,153,0.2)', color: '#5B7C99' }}>
                {workOrder.jobItems.length} รายการ
              </span>
            </div>
          </div>
          <div className="divide-y divide-app">
            {workOrder.jobItems.map((jobItem) => {
              const jobSt = getJobStatus(jobItem.status);
              return (
                <div key={jobItem.id} className="p-6 hover:bg-app-section/50 transition-all border-l-4 border-app" style={{ borderLeftColor: jobSt.hex }}>
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Link href={`/assets/${jobItem.asset.id}`} className="font-bold hover:underline text-lg" style={{ color: '#C2A66A' }}>
                          {jobItem.asset.qrCode}
                        </Link>
                        <span className="font-mono text-sm bg-app-section px-3 py-1 rounded-lg text-app-muted">{jobItem.asset.qrCode}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-app-body mb-3 flex-wrap">
                        <span>{jobItem.asset.room.floor.building.site.name}</span>
                        <span className="text-app-muted">→</span>
                        <span>{jobItem.asset.room.floor.building.name}</span>
                        <span className="text-app-muted">→</span>
                        <span>{jobItem.asset.room.floor.name}</span>
                        <span className="text-app-muted">→</span>
                        <span>{jobItem.asset.room.name}</span>
                      </div>
                      {jobItem.techNote && (
                        <div className="rounded-xl p-3 mt-3 border border-app" style={{ backgroundColor: 'rgba(194,166,106,0.1)' }}>
                          <p className="text-app-body text-sm flex-1">{jobItem.techNote}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-2 rounded-xl font-semibold text-sm ${jobSt.tailwind}`}>{jobSt.label}</span>
                      {jobItem.technician ? (
                        <div className="text-xs text-app-muted flex items-center gap-1">
                          <span>ช่าง: {jobItem.technician.fullName || jobItem.technician.username}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-app-muted flex items-center gap-1">
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
                        <div className="text-xs text-app-muted flex items-center gap-1">
                          <span>🕐</span>
                          <span>{new Date(jobItem.startTime).toLocaleString("th-TH")}</span>
                        </div>
                      )}

                      {/* ปุ่มดูใบรายงาน (PM/CM ที่มี checklist แบบฟอร์ม) */}
                      {jobItem.status === 'DONE' &&
                        (workOrder.jobType === 'PM' || workOrder.jobType === 'CM') &&
                        jobItem.checklist && (
                        <Link
                          href={`/reports/job/${jobItem.id}`}
                          className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors border border-blue-200"
                        >
                          📄 ดูใบรายงาน (Report)
                        </Link>
                      )}

                      {/* ADMIN: เปิดงานที่เสร็จสิ้นแล้วกลับมาแก้ไข */}
                      {user.role === 'ADMIN' && jobItem.status === 'DONE' && (
                        <ReopenJobItemButton jobItemId={jobItem.id} />
                      )}
                    </div>
                  </div>
                  {jobItem.photos.length > 0 && (
                    <WorkOrderJobItemPhotos photos={jobItem.photos} />
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