import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import QRCodeDisplay from "./QRCodeDisplay";
import DeleteAssetButton from "./DeleteButton";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import JobHistoryPanel from "./JobHistoryPanel";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

const assetInclude = {
  room: {
    include: {
      floor: { include: { building: { include: { site: true } } } },
    },
  },
} as const;

async function findAssetByParam(param: string) {
  const byId = await prisma.asset.findUnique({
    where: { id: param },
    include: assetInclude,
  });
  if (byId) return byId;
  return prisma.asset.findUnique({
    where: { qrCode: param },
    include: assetInclude,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const asset = await findAssetByParam(id);
    if (!asset) return { title: "ไม่พบข้อมูล - LMT air service" };
    const title = `${asset.qrCode} - LMT air service`;
    const description = `รายละเอียดทรัพย์สิน | QR Code: ${asset.qrCode} | สถานะ: ${asset.status}`;
    return {
      title,
      description,
      openGraph: { title, description, type: "website" },
      twitter: { card: "summary", title, description },
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "รายละเอียดทรัพย์สิน - LMT air service" };
  }
}

type AssetMessageReason =
  | 'no-user'
  | 'no-asset'
  | 'no-relation'
  | 'forbidden'
  | 'error'

const MESSAGES: Record<AssetMessageReason, string> = {
  'no-user': 'กรุณาเข้าสู่ระบบ',
  'no-asset': 'ไม่พบทรัพย์สินนี้ในระบบ (ไม่มี id หรือ qrCode ตรงกับ URL)',
  'no-relation': 'ข้อมูลสถานที่ของทรัพย์สินไม่สมบูรณ์ — ใน Supabase ให้ตรวจว่า Asset มี roomId ชี้ไปที่ Room ที่มีอยู่ และ Room → Floor → Building → Site ครบ',
  'forbidden': 'ไม่มีสิทธิ์ดูทรัพย์สินนี้',
  'error': 'เกิดข้อผิดพลาดในการโหลด กรุณาลองใหม่',
}

function AssetMessage({ reason }: { reason: AssetMessageReason }) {
  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8 flex items-center justify-center">
      <div className="text-center max-w-md">
        <p className="text-app-body mb-6">{MESSAGES[reason]}</p>
        <Link
          href="/assets"
          className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
        >
          กลับไปรายการทรัพย์สิน
        </Link>
      </div>
    </div>
  )
}

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) return <AssetMessage reason="no-user" />;

    const asset = await findAssetByParam(id);
    if (!asset) return <AssetMessage reason="no-asset" />;

    const assetWithJobs = await prisma.asset.findUnique({
      where: { id: asset.id },
      include: {
        room: {
          include: {
            floor: { include: { building: { include: { site: true } } } },
          },
        },
        jobItems: {
          include: {
            workOrder: {
              include: { site: { include: { client: true } } },
            },
            technician: true,
            photos: true,
          },
          orderBy: { startTime: "desc" },
        },
        pmSchedules: {
          where: { targetYear: new Date().getFullYear() },
          include: { jobItem: { select: { status: true, id: true } } },
          orderBy: { roundIndex: "asc" },
        },
      } as any,
    });

    if (!assetWithJobs) return <AssetMessage reason="no-asset" />;

    const a = assetWithJobs as any;

    const room = a.room;
    const floor = room?.floor;
    const building = floor?.building;
    const site = building?.site;
    const hasLocation = !!(room && floor && building && site);

    if (user.role === "CLIENT" && hasLocation) {
      let siteId = user.siteId;
      if (!siteId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { siteId: true },
        });
        siteId = dbUser?.siteId ?? null;
      }
      if (!siteId || siteId !== site.id) return <AssetMessage reason="forbidden" />;
    }

    const pendingJobItems = a.jobItems.filter(
    (ji: any) => ji.status === "PENDING" || ji.status === "IN_PROGRESS"
  );

  const pmDoneCount = (a.pmSchedules as any[]).filter(
    (s: any) => s.jobItem?.status === "DONE"
  ).length;

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8 w-full max-w-full font-sans">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "ทรัพย์สินและอุปกรณ์", href: "/assets" },
          { label: a.qrCode, href: undefined },
        ]}
      />

      {/* Asset Info Card */}
      <div className="bg-app-card rounded-xl shadow-lg border border-app p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                a.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : a.status === "BROKEN"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {a.status === "ACTIVE" && "ใช้งาน"}
              {a.status === "BROKEN" && "ชำรุด"}
              {a.status === "RETIRED" && "เลิกใช้งาน"}
            </span>
            <h1 className="text-3xl font-bold mt-2 text-app-heading">{a.qrCode}</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-sm text-app-muted">ขนาด BTU</div>
              <div className="text-2xl font-bold text-blue-600">
                {a.btu ? `${a.btu.toLocaleString()} BTU` : "-"}
              </div>
            </div>
            {user.role === "ADMIN" && (
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  href={`/work-orders/new?assetId=${a.id}`}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
                >
                  สร้างใบสั่งงาน
                </Link>
                <Link
                  href={`/assets/${a.id}/edit`}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-app bg-app-card text-app-body text-sm font-medium hover:bg-app-section transition-colors"
                >
                  แก้ไข
                </Link>
                <DeleteAssetButton assetId={a.id} />
              </div>
            )}
          </div>
        </div>

        <hr className="my-6 border-app" />

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-app-muted">สถานที่ติดตั้ง</p>
            {hasLocation ? (
              <>
                <p className="font-semibold text-lg text-app-heading">{site!.name}</p>
                <p className="text-app-body">
                  {building!.name} → {floor!.name} → {room!.name}
                </p>
              </>
            ) : (
              <p className="text-amber-600 font-medium">ไม่ระบุสถานที่ (ใน Supabase ตรวจว่า Room id ตรงกับ Asset.roomId และมี Floor → Building → Site ครบ)</p>
            )}
          </div>
          <div>
            <p className="text-app-muted">ข้อมูลเครื่อง</p>
            <p className="text-app-body">
              วันที่ติดตั้ง:{" "}
              {a.installDate ? new Date(a.installDate).toLocaleDateString("th-TH") : "-"}
            </p>
          </div>
        </div>

        {a.assetType === "AIR_CONDITIONER" && (
          <div className="mt-6">
            <QRCodeDisplay qrCode={a.qrCode} assetName={a.qrCode} />
          </div>
        )}
      </div>

      {/* PM Progress */}
      {a.assetType === "AIR_CONDITIONER" && a.pmSchedules.length > 0 && (
        <div className="bg-app-card rounded-xl shadow-lg border border-app p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-app-heading flex items-center gap-2">
                <span>🗓️</span> แผนบำรุงรักษาประจำปี {new Date().getFullYear()}
              </h2>
              <p className="text-sm text-app-muted">โควต้าล้างใหญ่ 2 ครั้ง และล้างย่อย 4 ครั้ง</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600">
                {pmDoneCount}
                <span className="text-sm text-app-muted font-normal ml-1">/ 6 ครั้งเสร็จสิ้น</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {(a.pmSchedules as any[]).map((schedule: any) => {
              const isDone = schedule.jobItem?.status === "DONE";
              const isInProgress =
                schedule.jobItem?.status === "IN_PROGRESS" ||
                schedule.jobItem?.status === "PENDING";

              return (
                <div
                  key={schedule.id}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1 ${
                    isDone
                      ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                      : isInProgress
                      ? "bg-blue-50 border-blue-400 text-blue-700 animate-pulse"
                      : "bg-app-section border-app text-app-muted opacity-60"
                  }`}
                >
                  <div className="text-[10px] uppercase font-black opacity-60 mb-1">
                    รอบที่ {schedule.roundIndex}
                  </div>
                  <div className="text-xs font-bold whitespace-nowrap">
                    {schedule.pmType === "MAJOR" ? "ล้างใหญ่" : "ล้างย่อย"}
                  </div>
                  <div className="text-[10px] mt-1">
                    {isDone ? "✅ เสร็จเรียบร้อย" : `📅 เดือน ${schedule.targetMonth}`}
                  </div>
                  <div
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      isDone ? "bg-green-500" : isInProgress ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technician: Pending Jobs */}
      {user.role === "TECHNICIAN" && pendingJobItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold text-app-heading">
              งานที่รอทำ ({pendingJobItems.length} งาน)
            </h2>
          </div>
          <div className="space-y-3">
            {pendingJobItems.map((jobItem: any) => (
              <Link
                key={jobItem.id}
                href={`/technician/job-item/${jobItem.id}`}
                className="block bg-app-card rounded-lg p-4 border border-app hover:border-yellow-400 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-app-heading mb-1">
                      {jobItem.workOrder.jobType} - {jobItem.workOrder?.site?.name ?? '-'}
                    </div>
                    <div className="text-sm text-app-body mb-1">
                      {jobItem.workOrder?.site?.client?.name ?? '-'}
                    </div>
                    <div className="text-xs text-app-muted">
                      วันนัดหมาย:{" "}
                      {jobItem.workOrder?.scheduledDate
                        ? new Date(jobItem.workOrder.scheduledDate).toLocaleDateString("th-TH")
                        : "-"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        jobItem.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {jobItem.status === "PENDING" ? "รอดำเนินการ" : "กำลังทำงาน"}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">เริ่มงาน →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {user.role === "TECHNICIAN" && pendingJobItems.length === 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-app-heading mb-1">ไม่มีงานที่รอทำ</h3>
              <p className="text-sm text-app-body">เครื่องนี้ไม่มีงานที่ต้องดำเนินการ</p>
            </div>
          </div>
        </div>
      )}

      {/* Job History */}
      <h2 className="text-xl font-bold text-app-heading mb-4 flex items-center">
        ประวัติการบำรุงรักษา
        <span className="ml-2 text-sm font-normal text-app-muted">
          ({a.jobItems.length} รายการ)
        </span>
      </h2>

      <JobHistoryPanel jobItems={a.jobItems} />
    </div>
  );
  } catch (e) {
    console.error('[AssetDetail]', id, e);
    return <AssetMessage reason="error" />;
  }
}