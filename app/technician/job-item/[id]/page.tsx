import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateJobItemStatus, updateJobItemNote } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import PhotoUpload from "./PhotoUpload";
import DeletePhotoButton from "./DeletePhotoButton";
import ChecklistSection from "@/app/work-orders/[id]/ChecklistSection";
import RequestRepairButton from "./RequestRepairButton";
import SendApprovalButton from "./SendApprovalButton";
import CleanRoomForm from "@/app/components/forms/CleanRoomForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TechnicianJobItemPage({ params }: Props) {
  const { id } = await params;

  // Authorization check
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const jobItem = await prisma.jobItem.findUnique({
    where: { id },
    select: {
      id: true,
      assetId: true,
      status: true,
      techNote: true,
      technicianId: true,
      workOrderId: true,
      startTime: true,
      endTime: true,
      checklist: true,
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
      workOrder: true,
      generatedWorkOrder: true,
      technician: true,
      photos: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!jobItem) {
    notFound();
  }

  // Authorization: TECHNICIAN can view job items assigned to them or unassigned (unless ADMIN)
  if (user.role === 'TECHNICIAN' && jobItem.technicianId !== null && jobItem.technicianId !== user.id) {
    redirect('/technician?error=unauthorized');
  }

  // Check if required photos exist
  const hasBefore = jobItem.photos.some(photo => photo.type === 'BEFORE')
  const hasAfter = jobItem.photos.some(photo => photo.type === 'AFTER')
  const canComplete = hasBefore && hasAfter

  const getStatusConfig = (status: string) => {
    const configs = {
      DONE: { bg: "from-green-500 to-emerald-600", text: "เสร็จสิ้น", icon: "" },
      IN_PROGRESS: { bg: "from-blue-500 to-indigo-600", text: "กำลังทำงาน", icon: "" },
      ISSUE_FOUND: { bg: "from-yellow-500 to-orange-600", text: "พบปัญหา", icon: "" },
      PENDING: { bg: "from-gray-400 to-gray-500", text: "รอดำเนินการ", icon: "" },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(jobItem.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href={`/technician/work-order/${jobItem.workOrderId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับไปหน้างาน</span>
        </Link>

        {/* Asset Info Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {jobItem.asset.brand} {jobItem.asset.model}
                </h1>
                <p className="text-sm text-gray-500">ข้อมูลเครื่องปรับอากาศ</p>
              </div>
            </div>
            <div className={`px-4 py-2 bg-gradient-to-r ${statusConfig.bg} text-white rounded-xl shadow-md flex items-center gap-2`}>
              <span>{statusConfig.icon}</span>
              <span className="font-semibold text-sm">{statusConfig.text}</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="font-semibold text-gray-600 min-w-20">QR Code:</span>
              <span className="font-mono text-gray-900 bg-white px-3 py-1 rounded-lg">{jobItem.asset.qrCode}</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="font-semibold text-gray-600 min-w-20">สถานที่:</span>
              <div className="text-gray-900">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white px-2 py-1 rounded-lg">{jobItem.asset.room.floor.building.site.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-white px-2 py-1 rounded-lg">{jobItem.asset.room.floor.building.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-white px-2 py-1 rounded-lg">{jobItem.asset.room.floor.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-white px-2 py-1 rounded-lg">{jobItem.asset.room.name}</span>
                </div>
                {jobItem.asset.room.floor.building.site.latitude && jobItem.asset.room.floor.building.site.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${jobItem.asset.room.floor.building.site.latitude},${jobItem.asset.room.floor.building.site.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    🗺️ นำทางไปสถานที่
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="font-semibold text-gray-600 min-w-20">BTU:</span>
              <span className="text-gray-900">{jobItem.asset.btu?.toLocaleString() || "-"}</span>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">อัปเดตสถานะ</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {jobItem.status === "PENDING" && (
              <form action={updateJobItemStatus.bind(null, id, "IN_PROGRESS")}>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <span>เริ่มงาน</span>
                </button>
              </form>
            )}
            {jobItem.status === "IN_PROGRESS" && (
              <>
                <form action={updateJobItemStatus.bind(null, id, "DONE")}>
                  <button
                    type="submit"
                    disabled={!canComplete}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${canComplete
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl hover:scale-105'
                      : 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                      }`}
                    title={!canComplete ? 'กรุณาอัปโหลดรูปภาพก่อนทำ (BEFORE) และหลังทำ (AFTER) ก่อนเสร็จสิ้นงาน' : ''}
                  >
                    <span>เสร็จสิ้น</span>
                  </button>
                </form>
                {!canComplete && (
                  <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <span>ต้องอัปโหลดรูปภาพก่อนทำ (BEFORE) และหลังทำ (AFTER) ก่อนเสร็จสิ้นงาน</span>
                    </p>
                    <div className="mt-2 text-xs text-yellow-700 flex items-center gap-4">
                      <span className={hasBefore ? 'text-green-600' : ''}>
                        {hasBefore ? '✓' : '○'} รูปก่อนทำ
                      </span>
                      <span className={hasAfter ? 'text-green-600' : ''}>
                        {hasAfter ? '✓' : '○'} รูปหลังทำ
                      </span>
                    </div>
                  </div>
                )}
                <form action={updateJobItemStatus.bind(null, id, "ISSUE_FOUND")}>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <span>พบปัญหา</span>
                  </button>
                </form>
              </>
            )}
            {jobItem.status === "ISSUE_FOUND" && (
              <form action={updateJobItemStatus.bind(null, id, "IN_PROGRESS")}>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <span>ดำเนินการต่อ (Resume)</span>
                </button>
              </form>
            )}
          </div>

          {/* Request Repair Card or Status - only show when ISSUE_FOUND */}
          {(jobItem.status === 'ISSUE_FOUND' || jobItem.generatedWorkOrder) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              {jobItem.generatedWorkOrder ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">แจ้งซ่อมแล้ว (Repair Requested)</h3>
                      <p className="text-sm text-gray-600">เลขที่ใบงาน: <Link href={`/work-orders/${jobItem.generatedWorkOrder.id}`} className="text-blue-600 hover:underline font-mono">{jobItem.generatedWorkOrder.workOrderNumber}</Link></p>
                    </div>
                  </div>
                  <div className="mt-3 pl-11">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      สถานะ: {jobItem.generatedWorkOrder.status}
                    </span>
                  </div>
                </div>
              ) : (
                <RequestRepairButton
                  assetId={jobItem.assetId}
                  userId={user.id}
                  jobStatus={jobItem.status}
                  assetName={`${jobItem.asset.brand} - ${jobItem.asset.model}`}
                  assetLocation={`${jobItem.asset.room.name} (${jobItem.asset.room.floor.building.name})`}
                  assetCode={jobItem.asset.qrCode}
                  sourceJobItemId={jobItem.id}
                />
              )}
            </div>
          )}

          {/* Approval Workflow Section - only show when ISSUE_FOUND and no repair yet */}
          {jobItem.status === 'ISSUE_FOUND' && !jobItem.generatedWorkOrder && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">การอนุมัติงานซ่อม (Customer Approval)</h3>
              <SendApprovalButton
                workOrderId={jobItem.workOrderId}
                status={jobItem.workOrder.status}
                approvalToken={jobItem.workOrder.approvalToken}
              />
            </div>
          )}
        </div>



        {/* Checklist Section — General PM */}
        {jobItem.workOrder.jobType === 'PM' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
            <ChecklistSection
              jobItemId={id}
              initialData={jobItem.checklist}
              isEditable={jobItem.status !== 'DONE'}
              jobType={jobItem.workOrder.jobType}
            />
          </div>
        )}

        {/* Clean Room Report Form Section (Only for PM as an alternative or additional form) */}
        {jobItem.workOrder.jobType === 'PM' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">ฟอร์มรายการตรวจเช็ค Clean Room</h2>
              <Link
                href={`/reports/clean-room/${id}`}
                className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
              >
                📄 พิมพ์รายงาน A4
              </Link>
            </div>
            <CleanRoomForm
              jobItemId={id}
              initialData={jobItem.checklist || undefined}
              onSaveAction={async (id, data) => {
                "use server";
                // We will create this action in the next step
                const { updateJobItemChecklist } = await import("@/app/actions");
                try {
                  await updateJobItemChecklist(id, data);
                  return { success: true };
                } catch (e: any) {
                  return { success: false, error: e.message };
                }
              }}
            />
          </div>
        )}

        {/* Tech Note */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">บันทึกของช่าง</h2>
          </div>
          {jobItem.status === 'DONE' ? (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{jobItem.techNote || 'ไม่มีบันทึก'}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <span>งานเสร็จสิ้นแล้ว ไม่สามารถแก้ไขบันทึกได้</span>
                </p>
              </div>
            </div>
          ) : (
            <form action={updateJobItemNote.bind(null, id)}>
              <textarea
                name="techNote"
                defaultValue={jobItem.techNote || ""}
                placeholder="บันทึกอาการเสีย/สิ่งที่ทำไป...&#10;เช่น: ล้างแอร์เสร็จเรียบร้อย พบว่าแผงระบายความร้อนสกปรกมาก"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white resize-none text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:shadow-lg hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <span>บันทึก</span>
              </button>
            </form>
          )}
        </div>

        {/* Photos */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">รูปภาพ</h2>
          </div>
          {jobItem.photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobItem.photos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                  <img
                    src={photo.url}
                    alt={photo.type}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    {photo.type === "BEFORE" && <span>ก่อนทำ</span>}
                    {photo.type === "AFTER" && <span>หลังทำ</span>}
                    {photo.type === "DEFECT" && <span>จุดชำรุด</span>}
                    {photo.type === "METER" && <span>ค่าเกจ</span>}
                  </div>
                  {jobItem.status !== 'DONE' && (user.role === 'ADMIN' || (user.role === 'TECHNICIAN' && jobItem.technicianId === user.id)) && (
                    <DeletePhotoButton photoId={photo.id} photoType={photo.type} />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="text-xs text-white">
                      {new Date(photo.createdAt).toLocaleString("th-TH")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <p className="text-gray-600 font-medium mb-4">ยังไม่มีรูปภาพ</p>
            </div>
          )}

          {/* Upload Section (only show if not DONE) */}
          {jobItem.status !== 'DONE' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">อัปโหลดรูปภาพ</h3>
              <PhotoUpload jobItemId={id} />
            </div>
          )}
          {jobItem.status === 'DONE' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <span>งานเสร็จสิ้นแล้ว ไม่สามารถเพิ่มรูปภาพได้</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Time Info */}
        {jobItem.startTime && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 text-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-gray-900">เวลาทำงาน</span>
            </div>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-medium">เริ่มงาน:</span>
                <span>{new Date(jobItem.startTime).toLocaleString("th-TH")}</span>
              </div>
              {jobItem.endTime && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">เสร็จสิ้น:</span>
                    <span>{new Date(jobItem.endTime).toLocaleString("th-TH")}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                    <span className="font-semibold">ใช้เวลารวม:</span>
                    <span className="font-bold text-blue-700">
                      {Math.round(
                        (new Date(jobItem.endTime).getTime() - new Date(jobItem.startTime).getTime()) / 60000
                      )} นาที
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}