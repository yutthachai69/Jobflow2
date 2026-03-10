import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditUserForm from "./EditUserForm";
import Breadcrumbs from "@/app/components/Breadcrumbs";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // เฉพาะ ADMIN เท่านั้นที่สามารถแก้ไขผู้ใช้ได้
  if (user.role !== 'ADMIN') {
    redirect('/users');
  }

  // ดึงข้อมูลผู้ใช้ที่ต้องการแก้ไข
  const userToEdit = await prisma.user.findUnique({
    where: { id },
    include: {
      site: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!userToEdit) {
    redirect('/users');
  }

  // ดึงข้อมูล Sites สำหรับ dropdown (ถ้าเป็น CLIENT)
  const sites = await prisma.site.findMany({
    include: {
      client: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-full">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'จัดการผู้ใช้งาน', href: '/users' },
            { label: `แก้ไข: ${userToEdit.username}`, href: undefined },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              แก้ไขผู้ใช้
            </h1>
          </div>
          <p className="text-gray-600 ml-15">แก้ไขข้อมูลผู้ใช้: {userToEdit.username}</p>
        </div>

        {/* Form */}
        <EditUserForm user={userToEdit} sites={sites} />
      </div>
    </div>
  );
}

