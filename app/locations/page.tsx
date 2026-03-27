import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeleteClientButton from "./DeleteClientButton";
import DeleteSiteButton from "./DeleteSiteButton";
import DeleteBuildingButton from "./DeleteBuildingButton";
import DeleteFloorButton from "./DeleteFloorButton";
import DeleteRoomButton from "./DeleteRoomButton";
import LocationsMap from "@/app/components/LocationsMap";

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

  const actionBtn =
    "inline-flex items-center justify-center rounded-lg font-medium text-sm whitespace-nowrap shrink-0";
  const actionBtnPrimary = `${actionBtn} bg-blue-600 text-white px-3 py-2 hover:bg-blue-700`;
  const actionBtnSuccess = `${actionBtn} bg-green-600 text-white px-3 py-2 hover:bg-green-700`;
  const linkMuted = "text-blue-600 hover:underline text-xs sm:text-sm break-words";

  return (
    <div className="min-h-screen bg-app-bg p-3 sm:p-4 md:p-8 overflow-x-hidden">
      <div className="w-full max-w-full min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-app-heading pr-1">
            จัดการสถานที่
          </h1>
          <Link
            href="/locations/clients/new"
            className={`${actionBtnPrimary} w-full sm:w-auto`}
          >
            + เพิ่มลูกค้าใหม่
          </Link>
        </div>

        {/* Google Map Overview */}
        {siteMarkers.length > 0 && (
          <LocationsMap markers={siteMarkers} />
        )}

        <div className="space-y-6">
          {clients.length === 0 ? (
            <div className="bg-app-card rounded-lg shadow p-12 text-center border border-app">
              <h2 className="text-xl font-bold text-app-heading mb-2">ยังไม่มีข้อมูลลูกค้า</h2>
              <p className="text-app-body mb-4">เริ่มต้นโดยการเพิ่มลูกค้าใหม่</p>
              <Link
                href="/locations/clients/new"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                + เพิ่มลูกค้าใหม่
              </Link>
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="bg-app-card rounded-lg shadow border border-app min-w-0">
                {/* Client Header */}
                <div className="p-4 sm:p-6 border-b border-app bg-app-section">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-app-heading mb-2 break-words">
                        {client.name}
                      </h2>
                      {client.contactInfo && (
                        <p className="text-app-body text-sm sm:text-base break-words">
                          {client.contactInfo}
                        </p>
                      )}
                      <p className="text-sm text-app-muted mt-1">
                        {client._count.sites} สถานที่
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:max-w-none lg:justify-end">
                      {user.role === 'ADMIN' && (
                        <>
                          <Link
                            href={`/locations/clients/${client.id}/edit`}
                            className={`${actionBtnPrimary} flex-1 min-[380px]:flex-none sm:flex-none`}
                          >
                            แก้ไข
                          </Link>
                          <div className="flex-1 min-[380px]:flex-none sm:flex-none min-w-0 [&_button]:w-full [&_button]:justify-center">
                            <DeleteClientButton clientId={client.id} clientName={client.name} />
                          </div>
                        </>
                      )}
                      <Link
                        href={`/locations/sites/new?clientId=${client.id}`}
                        className={`${actionBtnSuccess} w-full sm:w-auto lg:flex-none`}
                      >
                        + เพิ่มสถานที่
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Sites */}
                <div className="p-3 sm:p-6">
                  {client.sites.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>ยังไม่มีสถานที่</p>
                      <Link
                        href={`/locations/sites/new?clientId=${client.id}`}
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        + เพิ่มสถานที่ใหม่
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {client.sites.map((site) => (
                        <div
                          key={site.id}
                          id={`site-${site.id}`}
                          className="border border-app rounded-lg p-3 sm:p-4 bg-app-bg/50 transition-all duration-500 min-w-0"
                        >
                          {/* Site Header */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-bold text-app-heading mb-1 break-words">
                                {site.name}
                              </h3>
                              {site.address && (
                                <p className="text-xs sm:text-sm text-app-muted break-words">
                                  {site.address}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
                              {user.role === 'ADMIN' && (
                                <>
                                  <Link
                                    href={`/locations/sites/${site.id}/edit`}
                                    className={`${actionBtnPrimary} px-3 py-1.5 flex-1 min-[360px]:flex-none`}
                                  >
                                    แก้ไข
                                  </Link>
                                  <div className="flex-1 min-[360px]:flex-none min-w-0 [&_button]:w-full [&_button]:justify-center">
                                    <DeleteSiteButton siteId={site.id} siteName={site.name} />
                                  </div>
                                </>
                              )}
                              <Link
                                href={`/locations/buildings/new?siteId=${site.id}`}
                                className={`${actionBtnSuccess} px-3 py-1.5 w-full sm:w-auto`}
                              >
                                + เพิ่มอาคาร
                              </Link>
                            </div>
                          </div>

                          {/* Buildings */}
                          {site.buildings.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-4">
                              ยังไม่มีอาคาร
                              <Link
                                href={`/locations/buildings/new?siteId=${site.id}`}
                                className="text-blue-600 hover:underline ml-1"
                              >
                                เพิ่มใหม่
                              </Link>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {site.buildings.map((building) => (
                                <div key={building.id} className="bg-app-card rounded p-2 sm:p-3 border border-app min-w-0">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 mb-2">
                                    <h4 className="font-semibold text-app-heading text-sm sm:text-base break-words min-w-0 pr-1">
                                      🏛️ {building.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full sm:w-auto sm:justify-end">
                                      {user.role === 'ADMIN' && (
                                        <>
                                          <Link
                                            href={`/locations/buildings/${building.id}/edit`}
                                            className={linkMuted}
                                          >
                                            แก้ไข
                                          </Link>
                                          <DeleteBuildingButton buildingId={building.id} buildingName={building.name} />
                                        </>
                                      )}
                                      <Link
                                        href={`/locations/floors/new?buildingId=${building.id}`}
                                        className={linkMuted}
                                      >
                                        + เพิ่มชั้น
                                      </Link>
                                    </div>
                                  </div>

                                  {/* Floors */}
                                  {building.floors.length === 0 ? (
                                    <div className="text-xs text-gray-500 pl-4">
                                      ยังไม่มีชั้น
                                    </div>
                                  ) : (
                                    <div className="space-y-2 pl-2 sm:pl-4">
                                      {building.floors.map((floor) => (
                                        <div key={floor.id} className="border-l-2 border-app pl-2 sm:pl-3 min-w-0">
                                          <div className="flex flex-col gap-1 min-w-0">
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                                <h5 className="font-medium text-app-body text-sm break-words">
                                                  🏢 {floor.name}
                                                </h5>
                                                {user.role === 'ADMIN' && (
                                                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 shrink-0">
                                                    <Link
                                                      href={`/locations/floors/${floor.id}/edit`}
                                                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                                                    >
                                                      แก้ไข
                                                    </Link>
                                                    <DeleteFloorButton floorId={floor.id} floorName={floor.name} />
                                                  </span>
                                                )}
                                              </div>
                                              {/* Rooms */}
                                              {floor.rooms.length === 0 ? (
                                                <div className="text-xs text-gray-500">
                                                  ยังไม่มีห้อง
                                                  <Link
                                                    href={`/locations/rooms/new?floorId=${floor.id}`}
                                                    className="text-blue-600 hover:underline ml-1"
                                                  >
                                                    เพิ่มใหม่
                                                  </Link>
                                                </div>
                                              ) : (
                                                <div className="space-y-2">
                                                  {floor.rooms.map((room) => (
                                                    <div
                                                      key={room.id}
                                                      className="text-xs text-app-muted flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 py-1.5 border-b border-app/40 last:border-0"
                                                    >
                                                      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className="break-words">
                                                          🚪 {room.name} ({room._count.assets} แอร์)
                                                        </span>
                                                        {user.role === 'ADMIN' && (
                                                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 shrink-0">
                                                            <Link
                                                              href={`/locations/rooms/${room.id}/edit`}
                                                              className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                                                            >
                                                              แก้ไข
                                                            </Link>
                                                            <DeleteRoomButton roomId={room.id} roomName={room.name} />
                                                          </span>
                                                        )}
                                                      </div>
                                                      <Link
                                                        href={`/locations/rooms/new?floorId=${floor.id}`}
                                                        className="text-blue-600 hover:underline shrink-0 text-xs sm:self-center"
                                                      >
                                                        + เพิ่มห้อง
                                                      </Link>
                                                    </div>
                                                  ))}
                                                  <Link
                                                    href={`/locations/rooms/new?floorId=${floor.id}`}
                                                    className="text-xs text-blue-600 hover:underline"
                                                  >
                                                    + เพิ่มห้องใหม่
                                                  </Link>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

