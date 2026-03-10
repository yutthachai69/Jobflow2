export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Suspense } from 'react';
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssetsClient from "./AssetsClient";
import type { Prisma } from "@prisma/client";

interface Props { searchParams?: Promise<{ page?: string }> }


export default async function AssetsPage(_props: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }


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
        // Log errors (important for debugging)
        console.error('[Assets] Error fetching assets:', error instanceof Error ? error.message : String(error))
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Assets] Error details:', error)
        }
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


  // No server-side pagination — AssetsClient handles filtering + pagination client-side


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
      {/* ส่ง assets ทั้งหมด ไม่ต้อง paginate ที่นี่ — AssetsClient จัดการ pagination + filter เอง */}
      <Suspense fallback={<div className="p-8 text-center text-app-muted">กำลังโหลดข้อมูล...</div>}>
        <AssetsClient assets={assets} userRole={user.role} defaultSiteName={siteName} />
      </Suspense>
    </div>
  );
}