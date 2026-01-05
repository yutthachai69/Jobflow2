import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditFloorForm from "./EditFloorForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFloorPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }

  const { id } = await params;

  const floor = await prisma.floor.findUnique({
    where: { id },
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
          <span className="font-medium">กลับ</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent">
              แก้ไขชั้น
            </h1>
          </div>
        </div>

        {/* Building Info Card */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">อาคาร</p>
              <p className="font-semibold text-gray-900 text-lg">{floor.building.name}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <span>{floor.building.site.name}</span>
                <span className="text-gray-400">•</span>
                <span>{floor.building.site.client.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <EditFloorForm floor={floor} />
      </div>
    </div>
  );
}

