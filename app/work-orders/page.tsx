import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkOrdersClient from "./WorkOrdersClient";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string; page?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const { siteId: selectedSiteId } = params;
  const currentPage = parseInt(params.page || '1', 10);
  const itemsPerPage = 20;

  // สำหรับ CLIENT: ดูเฉพาะ Work Orders ใน Site ของตัวเอง
  // สำหรับ ADMIN: ดูทั้งหมด หรือ filter ตาม siteId ที่เลือก
  // สำหรับ TECHNICIAN: แสดงเฉพาะ Job Items ที่ตัวเองทำ
  let workOrders: Array<{
    id: string;
    workOrderNumber?: string | null;
    jobType: string;
    scheduledDate: Date;
    status: string;
    site: {
      id: string;
      name: string;
      client: {
        name: string;
      };
    };
    jobItems: Array<{
      id: string;
      status: string;
      asset: {
        id: string;
        qrCode: string;
      };
      technician: {
        id: string;
        fullName: string | null;
        username: string;
      } | null;
    }>;
  }> = [];
  let allSites: Array<{
    id: string;
    name: string;
    client: {
      name: string;
    };
  }> | null = null; // สำหรับ ADMIN filter
  let technicianJobItems: Array<{
    id: string;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
    techNote: string | null;
    workOrder: {
      id: string;
      jobType: string;
      scheduledDate: Date;
      status: string;
      site: {
        name: string;
        client: {
          name: string;
        };
      };
    };
    asset: {
      id: string;
      qrCode: string;
      brand: string | null;
      model: string | null;
      room: {
        name: string;
        floor: {
          name: string;
          building: {
            name: string;
            site: {
              name: string;
            };
          };
        };
      };
    };
    technician: {
      id: string;
      fullName: string | null;
      username: string;
    } | null;
    photos: Array<{
      id: string;
      type: string;
      url: string;
      createdAt: Date;
    }>;
  }> | null = null; // สำหรับ TECHNICIAN

  if (user.role === 'CLIENT') {
    let siteId = user.siteId;
    if (!siteId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { siteId: true },
      });
      siteId = dbUser?.siteId ?? null;
    }
    if (!siteId) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลสถานที่</h1>
            <p className="text-gray-600">กรุณาติดต่อผู้ดูแลระบบ หรือ ล็อกเอาท์แล้วล็อกอินใหม่</p>
          </div>
        </div>
      );
    }

    workOrders = await prisma.workOrder.findMany({
      where: { siteId: siteId },
      include: {
        site: {
          include: { client: true },
        },
        jobItems: {
          include: {
            asset: true,
            technician: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch site name for header display
    const clientSite = await prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true }
    });
    (user as any).siteName = clientSite?.name;
  } else if (user.role === 'TECHNICIAN') {
    // TECHNICIAN: ดึงเฉพาะ Job Items ที่ตัวเองทำ (technicianId = user.id)
    technicianJobItems = await prisma.jobItem.findMany({
      where: {
        technicianId: user.id,
      },
      include: {
        workOrder: {
          include: {
            site: {
              include: { client: true },
            },
          },
        },
        asset: {
          include: {
            room: {
              include: {
                floor: {
                  include: {
                    building: {
                      include: { site: true },
                    },
                  },
                },
              },
            },
          },
        },
        technician: true,
        photos: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startTime: "desc" },
    });

    // สำหรับ TECHNICIAN เราไม่ใช้ workOrders แต่ใช้ technicianJobItems แทน
    workOrders = [];
  } else {
    // ADMIN: ดึง Sites ทั้งหมดสำหรับ filter
    allSites = await prisma.site.findMany({
      include: {
        client: true,
      },
      orderBy: { name: "asc" },
    });

    // ADMIN: ดูทั้งหมด หรือ filter ตาม siteId ที่เลือก
    workOrders = await prisma.workOrder.findMany({
      where: selectedSiteId ? { siteId: selectedSiteId } : undefined,
      include: {
        site: {
          include: { client: true },
        },
        jobItems: {
          include: {
            asset: true,
            technician: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // สำหรับ TECHNICIAN: ส่งข้อมูล Job Items ไปให้ Client Component
  if (user.role === 'TECHNICIAN') {
    return (
      <WorkOrdersClient
        userRole={user.role}
        technicianJobItems={technicianJobItems || []}
      />
    );
  }

  // Pagination for Work Orders
  const totalItems = workOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWorkOrders = workOrders.slice(startIndex, endIndex);

  // สำหรับ ADMIN และ CLIENT: ส่งข้อมูล Work Orders ไปให้ Client Component
  return (
    <WorkOrdersClient
      userRole={user.role}
      workOrders={paginatedWorkOrders}
      allSites={allSites}
      selectedSiteId={selectedSiteId}
      userSiteName={user.role === 'CLIENT' ? (user as any).siteName : undefined}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
    />
  );
}

