'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

type Photo = {
  id: string;
  url: string;
  type: string;
  createdAt: string | Date;
};

type JobItem = {
  id: string;
  status: string;
  techNote: string | null;
  startTime: string | Date | null;
  endTime: string | Date | null;
  pmType?: string | null;
  workOrder: {
    id: string;
    jobType: string;
    site: { name: string; client: { name: string } };
    scheduledDate: string | Date;
  };
  technician: { fullName: string } | null;
  photos: Photo[];
};

const STATUS_LABEL: Record<string, string> = {
  DONE: 'เสร็จสิ้น',
  IN_PROGRESS: 'กำลังทำ',
  PENDING: 'รอดำเนินการ',
  CANCELLED: 'ยกเลิก',
};

const STATUS_STYLE: Record<string, string> = {
  DONE: 'bg-green-100 text-green-700 border-green-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

function PhotoSection({ photos, types, label }: { photos: Photo[]; types: string[]; label: (t: string) => string }) {
  const filtered = photos.filter(p => types.includes(p.type));
  if (!filtered.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {filtered.map(photo => (
        <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" className="block group">
          <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">{label(photo.type)}</div>
          <div className="relative overflow-hidden rounded-xl border border-gray-100 aspect-video bg-gray-50">
            <img
              src={photo.url}
              alt={photo.type}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">ดูรูปใหญ่</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function JobDetailDrawer({ job, onClose }: { job: JobItem; onClose: () => void }) {
  const durationMin = job.startTime && job.endTime
    ? Math.round((new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 60000)
    : null;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer: รองไว้ที่ body เพื่อไม่ให้ถูกตัดโดย overflow ของ layout หลัก + ความสูงชัดเจน */}
      <div
        className="fixed bottom-0 right-0 top-0 z-[9999] w-full max-w-lg bg-white shadow-2xl flex flex-col"
        style={{ height: '100vh' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <div className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border mb-2 ${STATUS_STYLE[job.status] ?? STATUS_STYLE['PENDING']}`}>
              {STATUS_LABEL[job.status] ?? job.status}
              {job.pmType && (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-white/70 text-[10px]">
                  {job.pmType === 'MAJOR' ? 'ล้างใหญ่' : 'ล้างย่อย'}
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg tracking-tight leading-tight">
              {job.workOrder.jobType}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{job.workOrder?.site?.name ?? '-'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body - ความสูงชัดเจนจาก calc เพื่อให้ overflow-y-auto เลื่อนได้แน่นอน */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6"
          style={{ minHeight: 0, maxHeight: 'calc(100vh - 180px)' }}
        >
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'ช่างผู้ดำเนินการ', value: job.technician?.fullName || 'System Admin' },
              {
                label: 'วันที่ทำงาน',
                value: job.startTime
                  ? new Date(job.startTime).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'ไม่ระบุ'
              },
              { label: 'ลูกค้า / สถานที่', value: job.workOrder?.site?.client?.name ?? '-' },
              { label: 'ระยะเวลา', value: durationMin != null ? `${durationMin} นาที` : 'ไม่ระบุ' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Tech Note */}
          {job.techNote && (
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">📝 บันทึกของช่าง</div>
              <p className="text-sm text-blue-900 leading-relaxed font-medium">{job.techNote}</p>
            </div>
          )}

          {/* Photos */}
          {job.photos.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📷 รูปภาพประกอบ</div>
              <PhotoSection
                photos={job.photos}
                types={['BEFORE', 'AFTER']}
                label={t => t === 'BEFORE' ? '🔴 ก่อนทำ' : '🟢 หลังทำ'}
              />
              <PhotoSection
                photos={job.photos}
                types={['DEFECT', 'METER']}
                label={t => t === 'DEFECT' ? '⚠️ จุดชำรุด' : '📊 ค่าเกจ'}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <Link
            href={`/reports/job/${job.id}`}
            className="flex-1 text-center py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            📄 ดู Service Report
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
          >
            ปิด
          </button>
        </div>
      </div>
    </>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(drawerContent, document.body);
}

export default function JobHistoryPanel({ jobItems }: { jobItems: JobItem[] }) {
  const [selected, setSelected] = useState<JobItem | null>(null);

  return (
    <>
      {jobItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3 opacity-20">🔧</div>
          <p className="text-gray-400 font-medium">ยังไม่มีประวัติการซ่อมบำรุง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobItems.map(job => {
            const beforePhoto = job.photos.find(p => p.type === 'BEFORE');
            const afterPhoto = job.photos.find(p => p.type === 'AFTER');

            return (
              <button
                key={job.id}
                onClick={() => setSelected(job)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
              >
                <div className="flex items-start gap-4 p-5">
                  {/* Photo Thumbnail */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                    {(afterPhoto || beforePhoto) ? (
                      <img
                        src={(afterPhoto || beforePhoto)!.url}
                        alt="thumb"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🔧</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${STATUS_STYLE[job.status] ?? STATUS_STYLE['PENDING']}`}>
                          {STATUS_LABEL[job.status] ?? job.status}
                        </span>
                        {job.pmType && (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100">
                            {job.pmType === 'MAJOR' ? 'ล้างใหญ่' : 'ล้างย่อย'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {job.startTime
                          ? new Date(job.startTime).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                          : 'ไม่ระบุวัน'}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm leading-tight truncate">{job.workOrder.jobType}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">ช่าง: {job.technician?.fullName || 'System Admin'}</div>
                    {job.techNote && (
                      <div className="text-xs text-gray-500 mt-1.5 line-clamp-1 italic">"{job.techNote}"</div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors text-sm">
                    →
                  </div>
                </div>

                {/* Progress bar: before/after photos count */}
                {job.photos.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-gray-400 font-medium">{job.photos.length} รูปภาพ</div>
                      <div className="flex-1 flex gap-1">
                        {job.photos.slice(0, 6).map((_, i) => (
                          <div key={i} className="flex-1 h-1 rounded-full bg-blue-200" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <JobDetailDrawer
          job={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
