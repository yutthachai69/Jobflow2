import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeleteClientButton from "./DeleteClientButton";
import DeleteSiteButton from "./DeleteSiteButton";
import DeleteBuildingButton from "./DeleteBuildingButton";
import DeleteFloorButton from "./DeleteFloorButton";
import DeleteRoomButton from "./DeleteRoomButton";

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">จัดการสถานที่</h1>
          <Link
            href="/locations/clients/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + เพิ่มลูกค้าใหม่
          </Link>
        </div>

        <div className="space-y-6">
          {clients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีข้อมูลลูกค้า</h2>
              <p className="text-gray-600 mb-4">เริ่มต้นโดยการเพิ่มลูกค้าใหม่</p>
              <Link
                href="/locations/clients/new"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                + เพิ่มลูกค้าใหม่
              </Link>
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg shadow">
                {/* Client Header */}
                <div className="p-6 border-b bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {client.name}
                      </h2>
                      {client.contactInfo && (
                        <p className="text-gray-600">{client.contactInfo}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {client._count.sites} สถานที่
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role === 'ADMIN' && (
                        <>
                          <Link
                            href={`/locations/clients/${client.id}/edit`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            แก้ไข
                          </Link>
                          <DeleteClientButton clientId={client.id} clientName={client.name} />
                        </>
                      )}
                      <Link
                        href={`/locations/sites/new?clientId=${client.id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        + เพิ่มสถานที่
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Sites */}
                <div className="p-6">
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
                        <div key={site.id} className="border rounded-lg p-4 bg-gray-50">
                          {/* Site Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {site.name}
                              </h3>
                              {site.address && (
                                <p className="text-sm text-gray-600">{site.address}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {user.role === 'ADMIN' && (
                                <>
                                  <Link
                                    href={`/locations/sites/${site.id}/edit`}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-medium"
                                  >
                                    แก้ไข
                                  </Link>
                                  <DeleteSiteButton siteId={site.id} siteName={site.name} />
                                </>
                              )}
                              <Link
                                href={`/locations/buildings/new?siteId=${site.id}`}
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm font-medium"
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
                                <div key={building.id} className="bg-white rounded p-3 border">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900">
                                      🏛️ {building.name}
                                    </h4>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {user.role === 'ADMIN' && (
                                        <>
                                          <Link
                                            href={`/locations/buildings/${building.id}/edit`}
                                            className="text-blue-600 hover:text-blue-800 hover:underline text-xs sm:text-sm"
                                          >
                                            แก้ไข
                                          </Link>
                                          <DeleteBuildingButton buildingId={building.id} buildingName={building.name} />
                                        </>
                                      )}
                                      <Link
                                        href={`/locations/floors/new?buildingId=${building.id}`}
                                        className="text-blue-600 hover:underline text-xs sm:text-sm"
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
                                    <div className="space-y-2 pl-4">
                                      {building.floors.map((floor) => (
                                        <div key={floor.id} className="border-l-2 border-gray-200 pl-3">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <h5 className="font-medium text-gray-800 text-sm">
                                                  🏢 {floor.name}
                                                </h5>
                                                {user.role === 'ADMIN' && (
                                                  <>
                                                    <Link
                                                      href={`/locations/floors/${floor.id}/edit`}
                                                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                                                    >
                                                      แก้ไข
                                                    </Link>
                                                    <DeleteFloorButton floorId={floor.id} floorName={floor.name} />
                                                  </>
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
                                                <div className="space-y-1">
                                                  {floor.rooms.map((room) => (
                                                    <div
                                                      key={room.id}
                                                      className="text-xs text-gray-600 flex justify-between items-center"
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        <span>
                                                          🚪 {room.name} ({room._count.assets} แอร์)
                                                        </span>
                                                        {user.role === 'ADMIN' && (
                                                          <>
                                                            <Link
                                                              href={`/locations/rooms/${room.id}/edit`}
                                                              className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                                                            >
                                                              แก้ไข
                                                            </Link>
                                                            <DeleteRoomButton roomId={room.id} roomName={room.name} />
                                                          </>
                                                        )}
                                                      </div>
                                                      <Link
                                                        href={`/locations/rooms/new?floorId=${floor.id}`}
                                                        className="text-blue-600 hover:underline ml-2"
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

