import { prisma } from "@/lib/prisma";
import { createUser } from "@/app/actions";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserForm from "./UserForm";

export default async function NewUserPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // เฉพาะ ADMIN เท่านั้นที่สามารถสร้าง User ใหม่ได้
  if (user.role !== 'ADMIN') {
    redirect('/users');
  }

  // ดึงข้อมูล Sites สำหรับเลือก (สำหรับ CLIENT role)
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
      <Link
        href="/users"
        className="text-gray-500 hover:text-blue-600 mb-4 inline-block"
      >
        ← กลับไปหน้ารายการ
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            เพิ่มผู้ใช้ใหม่
          </h1>
          <p className="text-gray-600">
            สร้างบัญชีผู้ใช้งานใหม่ในระบบ
          </p>
        </div>

        <UserForm sites={sites} />
      </div>
    </div>
  );
}


