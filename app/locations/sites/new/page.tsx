import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NewSiteForm from "./NewSiteForm";

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

        <NewSiteForm clients={clients} defaultClientId={clientId || undefined} />
      </div>
    </div>
  );
}
