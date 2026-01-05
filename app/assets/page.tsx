import { prisma } from "@/lib/prisma"; // เรียกตัวเชื่อม Database ที่เราทำไว้
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssetsClient from "./AssetsClient";
import Pagination from "@/app/components/Pagination";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AssetsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  const itemsPerPage = 20;

  // สำหรับ CLIENT: ดูเฉพาะแอร์ใน Site ของตัวเอง
  // สำหรับ ADMIN: ดูทั้งหมด
  let assets;
  
  if (user.role === 'CLIENT') {
    if (!user.siteId) {
      return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลสถานที่</h1>
            <p className="text-gray-600">กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </div>
      );
    }

    // ดึงแอร์ทั้งหมดใน Site ของ CLIENT
    const site = await prisma.site.findUnique({
      where: { id: user.siteId },
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                rooms: {
                  include: {
                    assets: {
                      include: {
                        room: {
                          include: {
                            floor: {
                              include: {
                                building: {
                                  include: {
                                    site: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!site) {
      return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลสถานที่</h1>
          </div>
        </div>
      );
    }

    assets = site.buildings.flatMap(b => 
      b.floors.flatMap(f => 
        f.rooms.flatMap(r => r.assets)
      )
    );
  } else {
    // ADMIN: ดูทั้งหมด
    assets = await prisma.asset.findMany({
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    site: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        qrCode: "asc",
      },
    });
  }

  // Pagination
  const totalItems = assets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = assets.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📋 ทะเบียนแอร์ทั้งหมด ({assets.length})</h1>
          {user.role === 'CLIENT' && user.site?.name && (
            <p className="text-gray-600 mt-1">สถานที่: {user.site.name}</p>
          )}
        </div>
        {user.role === 'ADMIN' && (
          <Link
            href="/assets/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base text-center"
          >
            + เพิ่มแอร์ใหม่
          </Link>
        )}
      </div>

      <AssetsClient assets={paginatedAssets} userRole={user.role} />
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}