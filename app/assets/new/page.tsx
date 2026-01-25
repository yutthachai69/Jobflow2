import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AssetForm from "./AssetForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewAssetPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // เฉพาะ ADMIN เท่านั้นที่สามารถสร้าง Asset ใหม่ได้
  if (user.role !== 'ADMIN') {
    redirect('/assets');
  }
  // ดึงข้อมูล sites ทั้งหมดพร้อม buildings, floors, rooms
  const sites = await prisma.site.findMany({
    include: {
      client: true,
      buildings: {
        include: {
          floors: {
            include: {
              rooms: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (sites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Link 
            href="/assets" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span className="font-medium">กลับ</span>
          </Link>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">ยังไม่มีสถานที่ในระบบ</h2>
            <p className="text-gray-600 mb-8">ต้องมีสถานที่และห้องก่อนจึงจะสามารถเพิ่มทรัพย์สินได้</p>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300"
            >
              <span>+</span>
              <span>ไปเพิ่มสถานที่ใหม่</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/assets" 
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
            <h1 className="text-3xl font-bold text-gray-900">
              เพิ่มทรัพย์สินใหม่
            </h1>
          </div>
          <p className="text-gray-600 ml-15">ลงทะเบียนทรัพย์สินและอุปกรณ์ใหม่ในระบบ</p>
        </div>

        {/* Form */}
        <AssetForm sites={sites} />
      </div>
    </div>
  );
}