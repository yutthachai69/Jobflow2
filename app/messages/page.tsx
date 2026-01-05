import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Pagination from "@/app/components/Pagination";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function MessagesPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  const itemsPerPage = 20;

  // Mark all messages as read เมื่อเข้าดูหน้า
  await prisma.contactMessage.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  // Get total count for pagination
  const totalItems = await prisma.contactMessage.count();

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;

  // ดึงข้อความทั้งหมด
  const messages = await prisma.contactMessage.findMany({
    include: {
      user: {
        include: {
          site: {
            include: {
              client: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: itemsPerPage,
  });

  // Query unreadCount จาก database (หลัง mark read แล้วจะเป็น 0 เสมอ)
  const unreadCount = await prisma.contactMessage.count({
    where: { isRead: false },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">กล่องข้อความ</h1>
          <p className="text-gray-600">
            ข้อความที่ส่งมาจากลูกค้า {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} ข้อความใหม่
              </span>
            )}
          </p>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <p className="text-gray-500 text-base md:text-lg">ยังไม่มีข้อความ</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {messages.map((message: {
                id: string;
                phone: string;
                message: string;
                isRead: boolean;
                createdAt: Date;
                user: {
                  username: string;
                  fullName: string | null;
                  site: {
                    name: string;
                    client: {
                      name: string;
                    };
                  } | null;
                };
              }) => (
                <div
                  key={message.id}
                  className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${!message.isRead ? 'border-blue-200 bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-base mb-1">
                        {message.user.fullName || message.user.username}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        @{message.user.username}
                      </div>
                    </div>
                    {!message.isRead ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ใหม่
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        อ่านแล้ว
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">เบอร์โทรศัพท์</div>
                      <div className="text-sm text-gray-900 font-medium">{message.phone}</div>
                    </div>
                    {message.user.site && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">สถานที่</div>
                        <div className="text-sm text-gray-900">{message.user.site.name}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">เวลา</div>
                      <div className="text-sm text-gray-600">
                        {new Date(message.createdAt).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">ข้อความ</div>
                    <div className="text-sm text-gray-900">{message.message}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ส่ง
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เบอร์โทรศัพท์
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ข้อความ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานที่
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เวลา
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message: {
                    id: string;
                    phone: string;
                    message: string;
                    isRead: boolean;
                    createdAt: Date;
                    user: {
                      username: string;
                      fullName: string | null;
                      site: {
                        name: string;
                        client: {
                          name: string;
                        };
                      } | null;
                    };
                  }) => (
                    <tr
                      key={message.id}
                      className={`hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!message.isRead ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ใหม่
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            อ่านแล้ว
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {message.user.fullName || message.user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{message.user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{message.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {message.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {message.user.site ? (
                          <div className="text-sm text-gray-900">
                            {message.user.site.name}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  );
}

