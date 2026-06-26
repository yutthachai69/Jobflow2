'use client'

import { useState } from 'react'
import Link from 'next/link'
import DeleteClientButton from './DeleteClientButton'
import DeleteSiteButton from './DeleteSiteButton'
import DeleteBuildingButton from './DeleteBuildingButton'
import DeleteFloorButton from './DeleteFloorButton'
import DeleteRoomButton from './DeleteRoomButton'

// ── Types ──────────────────────────────────────────────────
type Room = { id: string; name: string; _count: { assets: number } }
type Floor = { id: string; name: string; rooms: Room[] }
type Building = { id: string; name: string; floors: Floor[] }
type Site = { id: string; name: string; address?: string | null; buildings: Building[] }
type Client = { id: string; name: string; contactInfo?: string | null; _count: { sites: number }; sites: Site[] }

interface Props {
  clients: Client[]
  isAdmin: boolean
}

// ── Chevron icon ───────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ── useToggle hook ─────────────────────────────────────────
function useToggleSet(defaultOpen: string[] = []) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen))
  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const isOpen = (id: string) => open.has(id)
  return { toggle, isOpen }
}

// ── Main Component ─────────────────────────────────────────
export default function LocationsTree({ clients, isAdmin }: Props) {
  // เปิด client ทุกตัวเป็น default, ส่วน site/building/floor พับไว้
  const clientToggle   = useToggleSet(clients.map(c => c.id))
  const siteToggle     = useToggleSet()
  const buildingToggle = useToggleSet()
  const floorToggle    = useToggleSet()

  const actionBtn = 'inline-flex items-center justify-center rounded-lg font-medium text-sm whitespace-nowrap shrink-0'
  const btnPrimary = `${actionBtn} bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700`
  const btnSuccess = `${actionBtn} bg-green-600 text-white px-3 py-1.5 hover:bg-green-700`
  const linkMuted  = 'text-blue-600 hover:underline text-xs'

  if (clients.length === 0) {
    return (
      <div className="bg-app-card rounded-lg shadow p-12 text-center border border-app">
        <h2 className="text-xl font-bold text-app-heading mb-2">ยังไม่มีข้อมูลลูกค้า</h2>
        <Link href="/locations/clients/new" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mt-2">
          + เพิ่มลูกค้าใหม่
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {clients.map(client => (
        <div key={client.id} className="bg-app-card rounded-xl shadow border border-app overflow-hidden">

          {/* ── Client row ── */}
          <div className="flex items-center gap-3 px-4 py-3 bg-app-section border-b border-app">
            <button
              onClick={() => clientToggle.toggle(client.id)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <Chevron open={clientToggle.isOpen(client.id)} />
              <span className="text-lg font-bold text-app-heading truncate">{client.name}</span>
              <span className="text-xs text-app-muted shrink-0">({client._count.sites} สาขา)</span>
            </button>
            <div className="flex gap-2 shrink-0">
              {isAdmin && (
                <>
                  <Link href={`/locations/clients/${client.id}/edit`} className={btnPrimary}>แก้ไข</Link>
                  <DeleteClientButton clientId={client.id} clientName={client.name} />
                </>
              )}
              <Link href={`/locations/sites/new?clientId=${client.id}`} className={btnSuccess}>+ สาขา</Link>
            </div>
          </div>

          {/* ── Sites ── */}
          {clientToggle.isOpen(client.id) && (
            <div className="divide-y divide-app">
              {client.sites.length === 0 ? (
                <p className="text-sm text-app-muted px-6 py-4">ยังไม่มีสาขา</p>
              ) : client.sites.map(site => (
                <div key={site.id} className="bg-app-bg/30">

                  {/* Site row */}
                  <div className="flex items-center gap-3 px-6 py-2.5">
                    <button
                      onClick={() => siteToggle.toggle(site.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <Chevron open={siteToggle.isOpen(site.id)} />
                      <span className="text-sm font-semibold text-app-heading truncate">📍 {site.name}</span>
                      {site.address && (
                        <span className="text-xs text-app-muted hidden sm:inline truncate">{site.address}</span>
                      )}
                    </button>
                    <div className="flex gap-2 shrink-0">
                      {isAdmin && (
                        <>
                          <Link href={`/locations/sites/${site.id}/edit`} className={linkMuted}>แก้ไข</Link>
                          <DeleteSiteButton siteId={site.id} siteName={site.name} />
                        </>
                      )}
                      <Link href={`/locations/buildings/new?siteId=${site.id}`} className={linkMuted}>+ อาคาร</Link>
                    </div>
                  </div>

                  {/* Buildings */}
                  {siteToggle.isOpen(site.id) && (
                    <div className="pl-10 pr-4 pb-2 space-y-1">
                      {site.buildings.length === 0 ? (
                        <p className="text-xs text-app-muted py-2">ยังไม่มีอาคาร</p>
                      ) : site.buildings.map(building => (
                        <div key={building.id} className="border border-app rounded-lg bg-app-card overflow-hidden">

                          {/* Building row */}
                          <div className="flex items-center gap-2 px-3 py-2">
                            <button
                              onClick={() => buildingToggle.toggle(building.id)}
                              className="flex items-center gap-2 flex-1 min-w-0 text-left"
                            >
                              <Chevron open={buildingToggle.isOpen(building.id)} />
                              <span className="text-sm font-medium text-app-heading truncate">🏛️ {building.name}</span>
                            </button>
                            <div className="flex gap-2 shrink-0">
                              {isAdmin && (
                                <>
                                  <Link href={`/locations/buildings/${building.id}/edit`} className={linkMuted}>แก้ไข</Link>
                                  <DeleteBuildingButton buildingId={building.id} buildingName={building.name} />
                                </>
                              )}
                              <Link href={`/locations/floors/new?buildingId=${building.id}`} className={linkMuted}>+ ชั้น</Link>
                            </div>
                          </div>

                          {/* Floors */}
                          {buildingToggle.isOpen(building.id) && (
                            <div className="border-t border-app pl-6 pr-3 py-2 space-y-1 bg-app-bg/40">
                              {building.floors.length === 0 ? (
                                <p className="text-xs text-app-muted">ยังไม่มีชั้น</p>
                              ) : building.floors.map(floor => (
                                <div key={floor.id}>

                                  {/* Floor row */}
                                  <div className="flex items-center gap-2 py-1">
                                    <button
                                      onClick={() => floorToggle.toggle(floor.id)}
                                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                    >
                                      <Chevron open={floorToggle.isOpen(floor.id)} />
                                      <span className="text-xs font-medium text-app-body truncate">🏢 {floor.name}</span>
                                      <span className="text-xs text-app-muted shrink-0">({floor.rooms.length} ห้อง)</span>
                                    </button>
                                    <div className="flex gap-2 shrink-0">
                                      {isAdmin && (
                                        <>
                                          <Link href={`/locations/floors/${floor.id}/edit`} className={linkMuted}>แก้ไข</Link>
                                          <DeleteFloorButton floorId={floor.id} floorName={floor.name} />
                                        </>
                                      )}
                                      <Link href={`/locations/rooms/new?floorId=${floor.id}`} className={linkMuted}>+ ห้อง</Link>
                                    </div>
                                  </div>

                                  {/* Rooms */}
                                  {floorToggle.isOpen(floor.id) && (
                                    <div className="pl-6 space-y-1 pb-1">
                                      {floor.rooms.length === 0 ? (
                                        <p className="text-xs text-app-muted">ยังไม่มีห้อง</p>
                                      ) : floor.rooms.map(room => (
                                        <div key={room.id} className="flex items-center gap-2 py-0.5 text-xs text-app-muted">
                                          <span className="flex-1 truncate">🚪 {room.name} <span className="text-app-muted/70">({room._count.assets} asset)</span></span>
                                          {isAdmin && (
                                            <>
                                              <Link href={`/locations/rooms/${room.id}/edit`} className={linkMuted}>แก้ไข</Link>
                                              <DeleteRoomButton roomId={room.id} roomName={room.name} />
                                            </>
                                          )}
                                        </div>
                                      ))}
                                      <Link href={`/locations/rooms/new?floorId=${floor.id}`} className={`${linkMuted} block pt-0.5`}>
                                        + เพิ่มห้อง
                                      </Link>
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
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
