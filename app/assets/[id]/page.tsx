import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import QRCodeDisplay from "./QRCodeDisplay";
import DeleteAssetButton from "./DeleteButton";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
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
  });

  if (!asset) {
    return {
      title: "ไม่พบข้อมูล - Flomac Service",
    };
  }

  const title = `${asset.brand} ${asset.model} - Flomac Service`;
  const description = `รายละเอียดเครื่องปรับอากาศ ${asset.brand} ${asset.model} | QR Code: ${asset.qrCode} | สถานะ: ${asset.status}`;

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

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
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
      jobItems: {
        include: {
          workOrder: {
            include: {
              site: {
                include: { client: true },
              },
            },
          },
          technician: true,
          photos: true,
        },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!asset) {
    notFound();
  }

  // Access Control: CLIENT can only view assets within their assigned site
  if (user.role === 'CLIENT') {
    let siteId = user.siteId
    if (!siteId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { siteId: true },
      })
      siteId = dbUser?.siteId ?? null
    }
    if (!siteId || siteId !== asset.room.floor.building.siteId) {
      notFound()
    }
  }

  // สำหรับช่าง: ค้นหางานที่รอทำ (PENDING/IN_PROGRESS)
  const pendingJobItems = asset.jobItems.filter(
    (ji) => ji.status === 'PENDING' || ji.status === 'IN_PROGRESS'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-4xl mx-auto font-sans">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'ทรัพย์สินและอุปกรณ์', href: '/assets' },
          { label: `${asset.brand} ${asset.model}`, href: undefined },
        ]}
      />

      <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              asset.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : asset.status === 'BROKEN'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {asset.status === 'ACTIVE' && 'ใช้งาน'}
              {asset.status === 'BROKEN' && 'ชำรุด'}
              {asset.status === 'RETIRED' && 'เลิกใช้งาน'}
            </span>
            <h1 className="text-3xl font-bold mt-2 text-gray-800">
              {asset.brand} - {asset.model}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">ขนาด BTU</div>
              <div className="text-2xl font-bold text-blue-600">
                {asset.btu ? `${asset.btu.toLocaleString()} BTU` : '-'}
              </div>
            </div>
            {user.role === 'ADMIN' && (
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  href={`/assets/${asset.id}/edit`}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  แก้ไข
                </Link>
                <DeleteAssetButton assetId={asset.id} />
              </div>
            )}
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-gray-500">สถานที่ติดตั้ง</p>
            <p className="font-semibold text-lg text-gray-900">{asset.room.floor.building.site.name}</p>
            <p className="text-gray-700">{asset.room.floor.building.name} → {asset.room.floor.name} → {asset.room.name}</p>
          </div>
          <div>
            <p className="text-gray-500">ข้อมูลเครื่อง</p>
            <p className="text-gray-700">S/N: {asset.serialNo || "-"}</p>
            <p className="text-gray-700">วันที่ติดตั้ง: {asset.installDate ? asset.installDate.toLocaleDateString('th-TH') : "-"}</p>
          </div>
        </div>

        {/* QR Code Display - แสดงเฉพาะเครื่องปรับอากาศ */}
        {asset.assetType === 'AIR_CONDITIONER' && (
          <div className="mt-6">
            <QRCodeDisplay 
              qrCode={asset.qrCode} 
              assetName={`${asset.brand || ''} ${asset.model || ''}`.trim() || asset.qrCode}
            />
          </div>
        )}
      </div>

      {/* สำหรับช่าง: แสดงงานที่รอทำ */}
      {user.role === 'TECHNICIAN' && pendingJobItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold text-gray-900">
              งานที่รอทำ ({pendingJobItems.length} งาน)
            </h2>
          </div>
          <div className="space-y-3">
            {pendingJobItems.map((jobItem) => (
              <Link
                key={jobItem.id}
                href={`/technician/job-item/${jobItem.id}`}
                className="block bg-white rounded-lg p-4 border border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {jobItem.workOrder.jobType} - {jobItem.workOrder.site.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {jobItem.workOrder.site.client.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      วันนัดหมาย: {new Date(jobItem.workOrder.scheduledDate).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        jobItem.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {jobItem.status === 'PENDING' ? 'รอดำเนินการ' : 'กำลังทำงาน'}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      เริ่มงาน →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* สำหรับช่าง: แสดงข้อความเมื่อไม่มีงานรอทำ */}
      {user.role === 'TECHNICIAN' && pendingJobItems.length === 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">ไม่มีงานที่รอทำ</h3>
              <p className="text-sm text-gray-600">เครื่องนี้ไม่มีงานที่ต้องดำเนินการ</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        ประวัติการบำรุงรักษา
        <span className="ml-2 text-sm font-normal text-gray-700">({asset.jobItems.length} รายการ)</span>
      </h2>

      <div className="space-y-4">
        {asset.jobItems.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed text-gray-500">
            ยังไม่มีประวัติการซ่อมบำรุง
          </div>
        ) : (
          asset.jobItems.map((job) => (
            <div key={job.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition">
              <div className="flex justify-between mb-2">
                <div className="font-bold text-blue-800">
                  {job.workOrder.jobType} - {job.status}
                </div>
                <div className="text-sm text-gray-500">
                  {job.startTime ? new Date(job.startTime).toLocaleDateString('th-TH') : "ไม่ระบุวัน"}
                </div>
              </div>
              <p className="text-gray-700 mb-3">{job.techNote || "ไม่มีบันทึกเพิ่มเติม"}</p>
              
              {/* แสดงรูปภาพ Before/After */}
              {job.photos && job.photos.length > 0 && (
                <div className="mt-4 mb-3">
                  <div className="grid grid-cols-2 gap-4">
                    {job.photos
                      .filter((photo) => photo.type === 'BEFORE' || photo.type === 'AFTER')
                      .map((photo) => (
                        <div key={photo.id} className="relative">
                          <div className="text-xs font-semibold mb-1 text-gray-600 uppercase">
                            {photo.type === 'BEFORE' ? 'ก่อนทำ' : 'หลังทำ'}
                          </div>
                          <img
                            src={photo.url}
                            alt={photo.type}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(photo.createdAt).toLocaleString('th-TH')}
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {/* แสดงรูปภาพอื่นๆ (DEFECT, METER) */}
                  {job.photos.some((p) => p.type === 'DEFECT' || p.type === 'METER') && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {job.photos
                        .filter((photo) => photo.type === 'DEFECT' || photo.type === 'METER')
                        .map((photo) => (
                          <div key={photo.id} className="relative">
                            <div className="text-xs font-semibold mb-1 text-gray-600">
                              {photo.type === 'DEFECT' ? 'จุดชำรุด' : 'ค่าเกจ'}
                            </div>
                            <img
                              src={photo.url}
                              alt={photo.type}
                              className="w-full h-40 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-400 border-t pt-2">
                โดยช่าง: {job.technician?.fullName || "System Admin"}
                {job.startTime && job.endTime && (
                  <span className="ml-2">
                    • ใช้เวลา: {Math.round((new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 60000)} นาที
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}