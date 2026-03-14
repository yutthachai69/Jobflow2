import { prisma } from "@/lib/prisma";
import { createSiteWithStructure } from "@/app/actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Tooltip from "@/app/components/Tooltip";
import SiteMapPicker from "@/app/components/SiteMapPicker";

interface Props {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewSitePage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // เฉพาะ ADMIN เท่านั้นที่สามารถสร้าง Site ใหม่ได้
  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }

  const { clientId } = await searchParams;

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
  });

  if (!clientId && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="w-full max-w-full">
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span className="font-medium">กลับ</span>
          </Link>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">ยังไม่มีลูกค้าในระบบ</h2>
            <p className="text-gray-600 mb-8">ต้องมีลูกค้าก่อนจึงจะสามารถสร้างสถานที่ได้</p>
            <Link
              href="/locations/clients/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300"
            >
              <span>+</span>
              <span>เพิ่มลูกค้าใหม่</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="w-full max-w-full">
        {/* Back Link */}
        <Link
          href="/locations"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับ</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              เพิ่มสถานที่ (พร้อมอาคาร ชั้น ห้อง)
            </h1>
          </div>
          <p className="text-gray-600 ml-15">กรอกข้อมูลในการ์ดเดียว แล้วกดบันทึกครั้งเดียว</p>
        </div>

        {/* Form - การ์ดเดียว: สถานที่ + อาคาร + ชั้น + ห้อง */}
        <form action={createSiteWithStructure} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  ลูกค้า <span className="text-red-500">*</span>
                  <Tooltip content="เลือกองค์กรลูกค้าที่สถานที่นี้สังกัด">
                    <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
                  </Tooltip>
                </span>
              </label>
              <select
                name="clientId"
                defaultValue={clientId || ""}
                aria-label="เลือกลูกค้า"
                aria-required="true"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900"
              >
                <option value="">-- เลือกลูกค้า --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* สถานที่ */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-blue-700 mb-3">📍 สถานที่</h3>
              <div className="space-y-4 pl-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสถานที่ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                    placeholder="เช่น สุขุมวิท, โรงงาน A, สำนักงานใหญ่"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                  <textarea
                    name="address"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white resize-none text-gray-900 placeholder:text-gray-400"
                    placeholder="ที่อยู่เต็ม (ไม่บังคับ)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งบนแผนที่</label>
                  <SiteMapPicker />
                </div>
              </div>
            </div>

            {/* อาคาร */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 ชื่ออาคาร <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="buildingName"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น อาคาร A, อาคารหลัก"
              />
            </div>

            {/* ชั้น */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 ชื่อชั้น <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="floorName"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น ชั้น 1, G (Ground), ชั้น 2"
              />
            </div>

            {/* ห้อง */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🚪 ชื่อห้อง/โซน <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="roomName"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น Lobby, ห้องประชุม 1, Server Room"
              />
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong>บันทึกครั้งเดียว</strong> — ระบบจะสร้างสถานที่ อาคาร ชั้น และห้องในคราวเดียวกัน แล้วกลับไปหน้ารายการ
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                aria-label="บันทึกสถานที่ อาคาร ชั้น ห้อง"
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
              >
                <span>บันทึกทั้งหมด</span>
              </button>
              <Link
                href="/locations"
                aria-label="ยกเลิกและกลับไปหน้ารายการ"
                className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                ยกเลิก
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
