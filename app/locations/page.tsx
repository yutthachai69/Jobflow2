import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LocationsMap from "@/app/components/LocationsMap";
import LocationsTree from "./LocationsTree";

export default async function LocationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // CLIENT ไม่สามารถเข้าถึงหน้า Locations (ใช้ดูข้อมูลผ่าน Dashboard/Assets แทน)
  if (user.role === 'CLIENT') {
    redirect('/');
  }

  // ADMIN และ TECHNICIAN: ดูทั้งหมด (หรืออาจจะจำกัดเฉพาะที่เกี่ยวข้อง)
  const clients = await prisma.client.findMany({
    include: {
      sites: {
        include: {
          buildings: {
            include: {
              floors: {
                include: {
                  rooms: {
                    include: {
                      _count: {
                        select: { assets: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      _count: {
        select: { sites: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Collect all site markers for the map
  const siteMarkers = clients.flatMap(client =>
    client.sites
      .filter(site => site.latitude && site.longitude)
      .map(site => ({
        id: site.id,
        lat: site.latitude!,
        lng: site.longitude!,
        title: `${site.name} (${client.name})`,
        address: site.address,
      }))
  )

  return (
    <div className="min-h-screen bg-app-bg p-3 sm:p-4 md:p-8 overflow-x-hidden">
      <div className="w-full max-w-full min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-app-heading">จัดการสถานที่</h1>
          {user.role === 'ADMIN' && (
            <Link
              href="/locations/clients/new"
              className="inline-flex items-center justify-center rounded-lg font-medium text-sm bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 w-full sm:w-auto"
            >
              + เพิ่มลูกค้าใหม่
            </Link>
          )}
        </div>

        {siteMarkers.length > 0 && <LocationsMap markers={siteMarkers} />}

        <LocationsTree clients={clients} isAdmin={user.role === 'ADMIN'} />
      </div>
    </div>
  );
}

