'use client';

import Link from 'next/link';
import { WorkOrder, Site, JobItem } from '@prisma/client';

const REPAIR_TYPE_LABELS: Record<string, string> = {
  WASH_AC: 'ล้างแอร์',
  REPAIR_AC: 'ซ่อมแอร์',
  WASH_FAN: 'ล้างพัดลม',
  REPAIR_FAN: 'ซ่อมพัดลม',
  OTHER: 'อื่นๆ',
};

const STATUS_STYLES: Record<string, { label: string; tailwind: string; hex: string }> = {
  PENDING: { label: 'รอดำเนิน', tailwind: 'bg-yellow-100 text-yellow-800', hex: '#EAB308' },
  IN_PROGRESS: { label: 'กำลังดำเนิน', tailwind: 'bg-blue-100 text-blue-800', hex: '#3B82F6' },
  COMPLETED: { label: 'เสร็จสิ้น', tailwind: 'bg-green-100 text-green-800', hex: '#22C55E' },
  WAITING_APPROVAL: { label: 'รอการอนุมัติ', tailwind: 'bg-purple-100 text-purple-800', hex: '#A855F7' },
  APPROVED: { label: 'อนุมัติแล้ว', tailwind: 'bg-emerald-100 text-emerald-800', hex: '#10B981' },
  REJECTED: { label: 'ปฏิเสธ', tailwind: 'bg-red-100 text-red-800', hex: '#EF4444' },
  CANCELLED: { label: 'ยกเลิก', tailwind: 'bg-gray-100 text-gray-800', hex: '#6B7280' },
};

interface AdHocRepair extends WorkOrder {
  site: Site;
  jobItems: JobItem[];
}

interface AdHocRepairsClientProps {
  adHocRepairs: AdHocRepair[];
  userRole: string;
  isAdmin: boolean;
  isClient: boolean;
}

export default function AdHocRepairsClient({ adHocRepairs, userRole, isAdmin }: AdHocRepairsClientProps) {
  const getStatus = (status: string) => {
    return STATUS_STYLES[status] || { label: status, tailwind: 'bg-gray-100 text-gray-800', hex: '#6B7280' };
  };

  const getRepairTypeLabel = (type: string) => {
    return REPAIR_TYPE_LABELS[type] || type;
  };

  const formatThaiDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (adHocRepairs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-app-muted">ไม่พบข้อมูลการซ่อมนอกแผน</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {adHocRepairs.map((repair) => {
          const doneCount = repair.jobItems.filter((j) => j.status === 'DONE').length;
          const totalCount = repair.jobItems.length;
          const st = getStatus(repair.status);
          const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

          return (
            <div
              key={repair.id}
              className="bg-app-card rounded-lg border border-app border-l-4 p-5 shadow-lg w-full"
              style={{ borderLeftColor: st.hex }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-mono text-xs text-app-muted mb-1">เลขที่ {repair.workOrderNumber}</div>
                  <div className="font-bold text-app-heading text-base mb-2">
                    {getRepairTypeLabel(repair.repairType || 'OTHER')}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.tailwind}`}>{st.label}</span>
              </div>

              <div className="space-y-2 mb-3 pb-3 border-b border-app">
                <div>
                  <div className="text-xs text-app-muted mb-1">สถานที่</div>
                  <div className="text-sm text-app-heading font-medium">{repair.locationDescription}</div>
                  <div className="text-xs text-app-muted">{repair.site.name}</div>
                </div>

                <div>
                  <div className="text-xs text-app-muted mb-1">วันที่สร้าง</div>
                  <div className="text-sm text-app-heading">{formatThaiDate(repair.createdAt)}</div>
                </div>

                <div>
                  <div className="text-xs text-app-muted mb-1">รายการงาน</div>
                  <div className="text-sm text-app-heading mb-1">
                    {doneCount}/{totalCount} เสร็จ
                  </div>
                  {totalCount > 0 && (
                    <div className="w-full bg-app-section rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${progressPercent}%`, backgroundColor: st.hex }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/ad-hoc-repairs/${repair.id}`}
                  className="block w-full text-center btn-app-primary px-4 py-2 rounded-lg hover:shadow-md font-medium text-sm transition-all"
                >
                  ดูรายละเอียด
                </Link>
                {isAdmin && (
                  <Link
                    href={`/ad-hoc-repairs/${repair.id}/edit`}
                    className="block w-full text-center px-4 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium text-sm transition-all"
                  >
                    แก้ไข
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Card Grid */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {adHocRepairs.map((repair) => {
          const doneCount = repair.jobItems.filter((j) => j.status === 'DONE').length;
          const totalCount = repair.jobItems.length;
          const st = getStatus(repair.status);
          const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

          return (
            <div
              key={repair.id}
              className="bg-app-card rounded-lg border border-app border-l-4 p-4 shadow-lg hover:shadow-xl transition-shadow"
              style={{ borderLeftColor: st.hex }}
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-app-muted mb-1">เลขที่ {repair.workOrderNumber}</div>
                  <div className="font-bold text-app-heading text-sm mb-2 truncate">
                    {getRepairTypeLabel(repair.repairType || 'OTHER')}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${st.tailwind}`}>
                  {st.label}
                </span>
              </div>

              <div className="space-y-2 mb-3 pb-3 border-b border-app">
                <div>
                  <div className="text-xs text-app-muted mb-1">สถานที่</div>
                  <div className="text-sm text-app-heading font-medium line-clamp-2">{repair.locationDescription}</div>
                  <div className="text-xs text-app-muted">{repair.site.name}</div>
                </div>

                <div>
                  <div className="text-xs text-app-muted mb-1">วันที่สร้าง</div>
                  <div className="text-sm text-app-heading">{formatThaiDate(repair.createdAt)}</div>
                </div>

                <div>
                  <div className="text-xs text-app-muted mb-1">รายการงาน</div>
                  <div className="text-sm text-app-heading mb-1">
                    {doneCount}/{totalCount} เสร็จ
                  </div>
                  {totalCount > 0 && (
                    <div className="w-full bg-app-section rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${progressPercent}%`, backgroundColor: st.hex }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/ad-hoc-repairs/${repair.id}`}
                  className="block w-full text-center btn-app-primary px-3 py-2 rounded-lg hover:shadow-md font-medium text-xs transition-all"
                >
                  ดู
                </Link>
                {isAdmin && (
                  <Link
                    href={`/ad-hoc-repairs/${repair.id}/edit`}
                    className="block w-full text-center px-3 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium text-xs transition-all"
                  >
                    แก้ไข
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
