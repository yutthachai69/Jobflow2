import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkOrdersClient from "./WorkOrdersClient";
import { startOfLocalDay } from "@/lib/dashboard-job-stats";
import type { Prisma } from "@prisma/client";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    siteId?: string;
    page?: string;
    search?: string;
    /** ช่าง: mine = ของตัวเอง, all = ทั้งระบบ (ตรงตัวเลขแดชบอร์ด) */
    scope?: string;
    /** ACTIVE | DONE */
    status?: string;
    /** 1 = เฉพาะ endTime วันนี้ (ใช้กับ status=DONE) */
    today?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const { siteId: selectedSiteId, scope: listScope, status: listStatus, today: listToday, search: searchQuery } = params;
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
    duplicateOfId?: string | null;
    isPotentialDuplicatePmMonthly?: boolean;
    potentialDuplicateAssetCodes?: string[];
    potentialDuplicatePmCount?: number;
    conflictingWorkOrderIds?: string[];
    potentialDuplicateBuckets?: Array<{
      assetId: string;
      assetCode: string;
      pmTypeLabel: string;
      workOrderIds: string[];
    }>;
    _count: {
      duplicates: number;
    };
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
      adHocPmType?: string | null;
      asset: {
        id: string;
        qrCode: string;
      };
    }>;
  }> = [];
  let totalItems = 0;
  const markPotentialPmMonthlyDuplicates = <
    T extends {
      id: string;
      siteId?: string;
      jobType: string;
      status: string;
      scheduledDate: Date;
      jobItems: Array<{ asset: { id: string; qrCode: string }; adHocPmType?: string | null }>;
    }
  >(items: T[]): Array<T & {
    isPotentialDuplicatePmMonthly: boolean;
    potentialDuplicateAssetCodes: string[];
    potentialDuplicatePmCount: number;
    conflictingWorkOrderIds: string[];
    potentialDuplicateBuckets: Array<{
      assetId: string;
      assetCode: string;
      pmTypeLabel: string;
      workOrderIds: string[];
    }>;
  }> => {
    // key: siteId_month_assetId_pmType -> list of workOrderIds
    const assetPmToWorkOrders = new Map<string, string[]>();

    for (const item of items) {
      if (item.jobType !== 'PM' || item.status === 'CANCELLED') continue;
      const date = new Date(item.scheduledDate);
      const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      
      const uniqueAssetPmKeys = new Set(
        item.jobItems
          .filter((job) => job.adHocPmType === 'MAJOR' || job.adHocPmType === 'MINOR')
          .map((job) => `${job.asset.id}_${job.adHocPmType}`)
      );

      for (const assetPm of uniqueAssetPmKeys) {
        const key = `${item.siteId ?? ''}_${month}_${assetPm}`;
        const existing = assetPmToWorkOrders.get(key) ?? [];
        assetPmToWorkOrders.set(key, [...existing, item.id]);
      }
    }

    return items.map((item) => {
      if (item.jobType !== 'PM' || item.status === 'CANCELLED') {
        return {
          ...item,
          isPotentialDuplicatePmMonthly: false,
          potentialDuplicateAssetCodes: [],
          potentialDuplicatePmCount: 0,
          conflictingWorkOrderIds: [],
          potentialDuplicateBuckets: [],
        };
      }

      const date = new Date(item.scheduledDate);
      const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      const uniqueAssets = new Map<string, { assetId: string; qrCode: string; pmType: string }>();
      
      for (const job of item.jobItems) {
        if (job.adHocPmType !== 'MAJOR' && job.adHocPmType !== 'MINOR') continue;
        uniqueAssets.set(`${job.asset.id}_${job.adHocPmType}`, {
          assetId: job.asset.id,
          qrCode: job.asset.qrCode,
          pmType: job.adHocPmType === 'MAJOR' ? 'ล้างใหญ่' : 'ล้างย่อย',
        });
      }

      const duplicateAssetCodes: string[] = [];
      const conflictingIdsSet = new Set<string>();
      const buckets: Array<{ assetId: string; assetCode: string; pmTypeLabel: string; workOrderIds: string[] }> = [];

      for (const [assetPm, info] of uniqueAssets.entries()) {
        const key = `${item.siteId ?? ''}_${month}_${assetPm}`;
        const matches = assetPmToWorkOrders.get(key) ?? [];
        if (matches.length > 1) {
          duplicateAssetCodes.push(`${info.qrCode} (${info.pmType})`);
          matches.forEach(id => {
            if (id !== item.id) conflictingIdsSet.add(id);
          });
          buckets.push({
            assetId: info.assetId,
            assetCode: info.qrCode,
            pmTypeLabel: info.pmType,
            workOrderIds: matches.filter((id) => id !== item.id),
          });
        }
      }

      return {
        ...item,
        isPotentialDuplicatePmMonthly: duplicateAssetCodes.length > 0,
        potentialDuplicateAssetCodes: duplicateAssetCodes,
        potentialDuplicatePmCount: conflictingIdsSet.size + 1, // Number of work orders in the same "conflict group"
        conflictingWorkOrderIds: Array.from(conflictingIdsSet),
        potentialDuplicateBuckets: buckets,
      };
    });
  };
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

    totalItems = await prisma.workOrder.count({
      where: { siteId, jobType: { not: 'AD_HOC' } },
    });

    const fetchedWorkOrders = await prisma.workOrder.findMany({
      where: { siteId, jobType: { not: 'AD_HOC' } },
      include: {
        _count: {
          select: {
            duplicates: true,
          },
        },
        site: {
          include: { client: true },
        },
        jobItems: {
          select: {
            id: true,
            status: true,
            adHocPmType: true,
            asset: {
              select: {
                id: true,
                qrCode: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    });
    workOrders = markPotentialPmMonthlyDuplicates(fetchedWorkOrders);

    // Fetch site name for header display
    const clientSite = await prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true }
    });
    (user as any).siteName = clientSite?.name;
  } else if (user.role === 'TECHNICIAN') {
    const scopeAll = listScope === 'all';
    const jobItemWhere: Prisma.JobItemWhereInput = {};

    if (!scopeAll) {
      jobItemWhere.technicianId = user.id;
    }

    if (listStatus === 'DONE') {
      jobItemWhere.status = 'DONE';
      if (listToday === '1') {
        jobItemWhere.endTime = { gte: startOfLocalDay() };
      }
    } else if (listStatus === 'ACTIVE') {
      jobItemWhere.status = { in: ['PENDING', 'IN_PROGRESS', 'ISSUE_FOUND'] };
    }

    technicianJobItems = await prisma.jobItem.findMany({
      where: jobItemWhere,
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
    const where = selectedSiteId ? { siteId: selectedSiteId } : undefined
    totalItems = await prisma.workOrder.count({ where });

    const fetchedWorkOrders = await prisma.workOrder.findMany({
      where,
      include: {
        _count: {
          select: {
            duplicates: true,
          },
        },
        site: {
          include: { client: true },
        },
        jobItems: {
          select: {
            id: true,
            status: true,
            adHocPmType: true,
            asset: {
              select: {
                id: true,
                qrCode: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    });
    workOrders = markPotentialPmMonthlyDuplicates(fetchedWorkOrders);
  }

  // สำหรับ TECHNICIAN: ส่งข้อมูล Job Items ไปให้ Client Component
  if (user.role === 'TECHNICIAN') {
    const scopeAll = listScope === 'all';
    const listTitle =
      scopeAll && listStatus === 'DONE' && listToday === '1'
        ? 'งานที่เสร็จสิ้นวันนี้ (ทั้งระบบ)'
        : scopeAll && listStatus === 'DONE'
          ? 'งานที่เสร็จแล้วทั้งหมด (ทั้งระบบ)'
          : scopeAll && listStatus === 'ACTIVE'
            ? 'งานที่ดำเนินการ (ทั้งระบบ)'
            : 'ประวัติการทำงานของฉัน';

    return (
      <WorkOrdersClient
        userRole={user.role}
        technicianJobItems={technicianJobItems || []}
        technicianListTitle={listTitle}
        technicianListScope={scopeAll ? 'all' : 'mine'}
      />
    );
  }

  // Pagination for Work Orders
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // สำหรับ ADMIN และ CLIENT: ส่งข้อมูล Work Orders ไปให้ Client Component
  return (
    <WorkOrdersClient
      userRole={user.role}
      workOrders={workOrders}
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

