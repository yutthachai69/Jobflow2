import { prisma } from "@/lib/prisma";
import { createRoom } from "@/app/actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  searchParams: Promise<{ floorId?: string }>;
}

export default async function NewRoomPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }

  const { floorId } = await searchParams;

  if (!floorId) {
    redirect('/locations')
  }

  const floor = await prisma.floor.findUnique({
    where: { id: floorId },
    include: {
      building: {
        include: {
          site: {
            include: { client: true },
          },
        },
      },
    },
  });

  if (!floor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/locations" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium text-gray-900">กลับ</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-orange-900 bg-clip-text text-transparent">
              เพิ่มห้องใหม่
            </h1>
          </div>
        </div>

        {/* Location Breadcrumb Card */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">ตำแหน่ง</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">ลูกค้า:</span>
                  <span className="font-medium text-gray-900">{floor.building.site.client.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">สถานที่:</span>
                  <span className="font-medium text-gray-900">{floor.building.site.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">อาคาร:</span>
                  <span className="font-medium text-gray-900">{floor.building.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">ชั้น:</span>
                  <span className="font-semibold text-lg text-orange-700">{floor.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form action={createRoom} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <input type="hidden" name="floorId" value={floorId} />

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อห้อง/โซน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น Lobby Hall, Server Room, Meeting Room 1"
              />
              <p className="mt-2 text-xs text-gray-500">
                💡 ระบุชื่อห้องหรือโซนให้ชัดเจน สามารถระบุหมายเลขห้องได้
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>บันทึก</span>
              </button>
              <Link
                href="/locations"
                className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700"
              >
                ยกเลิก
              </Link>
            </div>
          </div>
        </form>

        {/* Helper Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>หลังจากสร้างห้องแล้ว คุณสามารถเพิ่มเครื่องปรับอากาศในห้องนี้ได้</p>
        </div>
      </div>
    </div>
  );
}
