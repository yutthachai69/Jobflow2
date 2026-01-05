import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import EditSiteForm from "./EditSiteForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSitePage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Only ADMIN can edit sites
  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }

  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      client: true,
    },
  });

  if (!site) {
    notFound();
  }

  // Get all clients for form
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
  });

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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              แก้ไขสถานที่
            </h1>
          </div>
          <p className="text-gray-600 ml-15">อัพเดทข้อมูลสถานที่</p>
        </div>

        <EditSiteForm site={site} clients={clients} />
      </div>
    </div>
  );
}

