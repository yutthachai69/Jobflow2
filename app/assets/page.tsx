export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma"; // เรียกตัวเชื่อม Database ที่เราทำไว้
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssetsClient from "./AssetsClient";
import Pagination from "@/app/components/Pagination";
import type { Prisma } from "@prisma/client";

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
  type AssetWithRoom = Prisma.AssetGetPayload<{
    include: {
      room: {
        include: {
          floor: {
            include: {
              building: {
                include: {
                  site: {
                    include: {
                      client?: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }>
  
  let assets: AssetWithRoom[] = []

  if (user.role === 'CLIENT') {
    // ดึง siteId จาก database โดยตรง (ไม่ใช้จาก session เพราะอาจจะเก่า)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { siteId: true },
    });
    
    const siteId = dbUser?.siteId ?? null;

    if (!siteId) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Assets] No siteId for CLIENT user:', user.userId)
      }
      // แสดง empty state แทน error เพื่อให้มี sidebar/header
      assets = []
    } else {
      // Query ตรงๆ จาก Asset โดยใช้ siteId (ไม่ต้องเช็ค site ก่อน)
      try {
        const clientAssets = await prisma.asset.findMany({
          where: {
            room: {
              floor: {
                building: {
                  siteId: siteId
                }
              }
            }
          },
        include: {
          room: {
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
          },
        },
          orderBy: {
            qrCode: "asc",
          },
        })
        assets = clientAssets as AssetWithRoom[]

        if (process.env.NODE_ENV !== 'production') {
          console.log('[Assets] Found', assets.length, 'assets for siteId:', siteId)
        }
      } catch (error) {
        console.error('[Assets] Error fetching assets:', error)
        // แสดง empty state แทน error เพื่อให้มี sidebar/header
        assets = []
      }
    }
  } else {
    // ADMIN: ดูทั้งหมด
    try {
      const adminAssets = await prisma.asset.findMany({
        include: {
          room: {
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
          },
        },
        orderBy: {
          qrCode: "asc",
        },
      });
      assets = adminAssets as AssetWithRoom[]

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Assets] Admin found', assets.length, 'assets')
      }
    } catch (error) {
      console.error('[Assets] Error fetching assets for ADMIN:', error)
      assets = []
    }
  }

  // Pagination
  const totalItems = assets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = assets.slice(startIndex, endIndex);

  // สำหรับ CLIENT: แสดงชื่อ Site (ลองดึงจาก database ถ้าไม่มี assets)
  let siteName: string | null = null
  if (user.role === 'CLIENT') {
    if (assets.length > 0) {
      siteName = assets[0]?.room?.floor?.building?.site?.name ?? null
    } else {
      // ถ้าไม่มี assets ให้ลองดึง site name จาก database
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { 
            siteId: true,
            site: {
              select: { name: true }
            }
          },
        })
        siteName = dbUser?.site?.name ?? null
      } catch (e) {
        // ignore error
      }
    }
  }

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-app-heading mb-1">
            📋 {siteName ? `รายการทรัพย์สิน: ${siteName}` : 'ทรัพย์สินและอุปกรณ์'} ({assets.length})
          </h1>
          {siteName && assets.length > 0 && (
            <p className="text-sm text-app-muted">จำนวนทั้งหมด {assets.length} รายการ</p>
          )}
          {assets.length === 0 && user.role === 'CLIENT' && (
            <p className="text-sm text-app-muted">ยังไม่มีทรัพย์สินในระบบ</p>
          )}
        </div>
        {user.role === 'ADMIN' && (
          <Link
            href="/assets/new"
            className="w-full sm:w-auto btn-app-primary px-4 py-2 rounded-lg hover:shadow-md font-medium text-sm sm:text-base text-center transition-all"
          >
            + เพิ่มทรัพย์สินใหม่
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