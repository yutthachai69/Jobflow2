import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function TechnicianWorkOrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;

  // Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') redirect('/');

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      site: { include: { client: true } },
      jobItems: {
        include: {
          asset: {
            include: {
              room: {
                include: {
                  floor: {
                    include: {
                      building: {
                        include: { site: true },
                      },
                    },
                  },
                },
              },
            },
          },
          technician: true,
          photos: true,
        },
      },
    },
  });

  if (!workOrder) {
    notFound();
  }

  // Authorization: TECHNICIAN can only view work orders they are assigned to or have unassigned items
  if (user.role === 'TECHNICIAN') {
    const hasAccess = workOrder.jobItems.some(
      (j) => j.technicianId === user.userId || j.technicianId === null
    );
    if (!hasAccess) {
      redirect('/technician?error=unauthorized');
    }
  }

  const pendingJobs = workOrder.jobItems.filter((j) => j.status === "PENDING");
  const inProgressJobs = workOrder.jobItems.filter((j) => j.status === "IN_PROGRESS");
  const doneJobs = workOrder.jobItems.filter((j) => j.status === "DONE");

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/technician" className="text-app-muted hover:text-blue-600 mb-4 inline-block">
          ← กลับ
        </Link>

        {/* Error Messages */}
        {error === 'notfound' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-400 text-sm">⚠️ ไม่พบเครื่องปรับอากาศ (QR Code) ที่ระบุ กรุณาตรวจสอบรหัสอีกครั้ง</p>
          </div>
        )}
        {error === 'notinworkorder' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <p className="text-amber-800 dark:text-amber-400 text-sm">⚠️ เครื่องปรับอากาศนี้ไม่ได้อยู่ในใบงานนี้</p>
          </div>
        )}

        <div className="bg-app-card rounded-lg shadow border border-app p-4 md:p-6 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-app-heading mb-2">
            {workOrder.jobType} - {workOrder.site.name}
          </h1>
          <p className="text-app-muted text-sm md:text-base">
            {workOrder.site.client.name}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
              ต้องทำ: {pendingJobs.length}
            </span>
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-semibold">
              กำลังทำ: {inProgressJobs.length}
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
              เสร็จแล้ว: {doneJobs.length}
            </span>
          </div>
        </div>

        {/* QR Code Input */}
        <div className="bg-app-card rounded-lg shadow border border-app p-4 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-app-heading mb-4">
            สแกน QR Code หรือพิมพ์รหัส
          </h2>
          <form action={`/technician/work-order/${id}/scan`} method="GET" className="flex gap-2">
            <input
              type="text"
              name="qrCode"
              placeholder="พิมพ์หรือสแกน QR Code"
              className="flex-1 border border-app rounded-lg px-4 py-3 text-lg bg-app-card text-app-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-app-muted"
              autoFocus
            />
            <button
              type="submit"
              className="btn-app-primary px-6 py-3 rounded-lg font-medium whitespace-nowrap"
            >
              ค้นหา
            </button>
          </form>
        </div>

        {/* Job Items List */}
        <div className="space-y-4">
          {/* Pending Jobs */}
          {pendingJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-app-heading mb-3">
                รายการที่ยังไม่ทำ ({pendingJobs.length})
              </h2>
              <div className="space-y-2">
                {pendingJobs.map((jobItem) => (
                  <Link
                    key={jobItem.id}
                    href={`/technician/job-item/${jobItem.id}`}
                    className="block bg-app-card rounded-lg shadow border border-app p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-app-heading mb-1">
                          {jobItem.asset.brand} {jobItem.asset.model}
                        </div>
                        <div className="text-sm text-app-muted font-mono mb-1">
                          QR: {jobItem.asset.qrCode}
                        </div>
                        <div className="text-xs text-app-muted">
                          {jobItem.asset.room.floor.building.site.name} → {jobItem.asset.room.floor.building.name} → {jobItem.asset.room.floor.name} → {jobItem.asset.room.name}
                        </div>
                        {jobItem.technician && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            ช่าง: {jobItem.technician.fullName || jobItem.technician.username}
                          </div>
                        )}
                      </div>
                      <div className="text-blue-600 font-medium ml-4">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Jobs */}
          {inProgressJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-app-heading mb-3">
                กำลังทำ ({inProgressJobs.length})
              </h2>
              <div className="space-y-2">
                {inProgressJobs.map((jobItem) => (
                  <Link
                    key={jobItem.id}
                    href={`/technician/job-item/${jobItem.id}`}
                    className="block bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-app-heading mb-1">
                          {jobItem.asset.brand} {jobItem.asset.model}
                        </div>
                        <div className="text-sm text-app-muted font-mono mb-1">
                          QR: {jobItem.asset.qrCode}
                        </div>
                        <div className="text-xs text-app-muted mt-1">
                          {jobItem.asset.room.floor.building.site.name} → {jobItem.asset.room.floor.building.name} → {jobItem.asset.room.floor.name} → {jobItem.asset.room.name}
                        </div>
                      </div>
                      <div className="text-blue-600 font-medium ml-4">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Done Jobs */}
          {doneJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-app-heading mb-3">
                ✅ เสร็จแล้ว ({doneJobs.length})
              </h2>
              <div className="space-y-2">
                {doneJobs.map((jobItem) => (
                  <div
                    key={jobItem.id}
                    className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-app-heading mb-1">
                          {jobItem.asset.brand} {jobItem.asset.model}
                        </div>
                        <div className="text-sm text-app-muted font-mono mb-1">
                          QR: {jobItem.asset.qrCode}
                        </div>
                        <div className="text-xs text-app-muted mt-1">
                          {jobItem.asset.room.floor.building.site.name} → {jobItem.asset.room.floor.building.name} → {jobItem.asset.room.floor.name} → {jobItem.asset.room.name}
                        </div>
                        {jobItem.photos.length > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                            มีรูปภาพ {jobItem.photos.length} ภาพ
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/technician/job-item/${jobItem.id}`}
                        className="text-blue-600 hover:underline text-sm ml-4"
                      >
                        ดู
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
