import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";
import Pagination from "@/app/components/Pagination";

interface Props {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // เฉพาะ ADMIN เท่านั้นที่สามารถดูหน้านี้ได้
  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  const params = await searchParams;
  const { error, success } = params;
  const currentPage = parseInt(params.page || '1', 10);
  const itemsPerPage = 20;

  // ดึงข้อมูล Users ทั้งหมด (รวม locked fields)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      locked: true,
      lockedUntil: true,
      lockedReason: true,
      createdAt: true,
      site: {
        select: {
          id: true,
          name: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'ผู้ดูแลระบบ';
      case 'TECHNICIAN':
        return 'ช่าง';
      case 'CLIENT':
        return 'ลูกค้า';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'TECHNICIAN':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'unauthorized':
        return 'คุณไม่มีสิทธิ์ในการดำเนินการนี้';
      case 'cannot_delete_self':
        return 'ไม่สามารถลบบัญชีของตัวเองได้ กรุณาให้ผู้ดูแลระบบคนอื่นลบให้';
      case 'not_found':
        return 'ไม่พบผู้ใช้ที่ต้องการลบ';
      case 'has_job_items':
        return 'ไม่สามารถลบผู้ใช้ที่มีงานที่มอบหมายได้ กรุณาเปลี่ยนผู้รับผิดชอบงานก่อน';
      case 'server_error':
        return 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
      default:
        return 'เกิดข้อผิดพลาด';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      {/* Success/Error Messages */}
      {success === 'deleted' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">ลบผู้ใช้สำเร็จแล้ว</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{getErrorMessage(error)}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">👥 จัดการผู้ใช้งาน ({users.length})</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">สร้างและจัดการบัญชีผู้ใช้งานในระบบ</p>
        </div>
        <Link
          href="/users/new"
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base text-center"
        >
          + เพิ่มผู้ใช้ใหม่
        </Link>
      </div>

      {(() => {
        // Pagination
        const totalItems = users.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = users.slice(startIndex, endIndex);

        return (
          <>
            <UsersClient users={paginatedUsers} currentUserId={user.id} />
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
          </>
        );
      })()}
    </div>
  );
}

