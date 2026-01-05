import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditRoomForm from "./EditRoomForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRoomPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }

  const { id } = await params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      floor: {
        include: {
          building: {
            include: {
              site: {
                include: {
                  client: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!room) {
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
          <span className="font-medium">กลับ</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-orange-900 bg-clip-text text-transparent">
              แก้ไขห้อง
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
                  <span className="font-medium text-gray-900">{room.floor.building.site.client.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">สถานที่:</span>
                  <span className="font-medium text-gray-900">{room.floor.building.site.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">อาคาร:</span>
                  <span className="font-medium text-gray-900">{room.floor.building.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">ชั้น:</span>
                  <span className="font-medium text-gray-900">{room.floor.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <EditRoomForm room={room} />
      </div>
    </div>
  );
}

