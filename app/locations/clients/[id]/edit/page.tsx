import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import EditClientForm from "./EditClientForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Only ADMIN can edit clients
  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
              แก้ไขลูกค้า
            </h1>
          </div>
          <p className="text-gray-600 ml-15">อัพเดทข้อมูลลูกค้า</p>
        </div>

        <EditClientForm client={client} />
      </div>
    </div>
  );
}

