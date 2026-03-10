import { prisma } from "@/lib/prisma";
import { createSite } from "@/app/actions";
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
              เพิ่มสถานที่ใหม่
            </h1>
          </div>
          <p className="text-gray-600 ml-15">สร้างสถานที่ใหม่สำหรับลูกค้า</p>
        </div>

        {/* Form */}
        <form action={createSite} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
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
              <p className="mt-2 text-xs text-gray-500">
                เลือกองค์กรลูกค้าที่สถานที่นี้สังกัด
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อสถานที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น สุขุมวิท, โรงงาน A, สำนักงานใหญ่"
              />
              <p className="mt-2 text-xs text-gray-500">
                💡 ระบุชื่อที่บ่งบอกที่ตั้งหรือลักษณะของสถานที่
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ที่อยู่
              </label>
              <textarea
                name="address"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white resize-none text-gray-900 placeholder:text-gray-400"
                placeholder="ที่อยู่เต็ม รวมถึงเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
              />
              <p className="mt-2 text-xs text-gray-500">
                ที่อยู่สำหรับการติดต่อและประสานงาน (ไม่บังคับ)
              </p>
            </div>

            {/* Map Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  📍 ตำแหน่งบนแผนที่
                </span>
              </label>
              <SiteMapPicker />
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">หลังจากสร้างสถานที่แล้ว</p>
                  <p className="text-gray-600">คุณสามารถเพิ่มอาคาร (Buildings), ชั้น (Floors), และห้อง (Rooms) ภายในสถานที่นี้ได้</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                aria-label="บันทึกข้อมูลสถานที่"
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
              >
                <span>บันทึก</span>
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
