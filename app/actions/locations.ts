'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeString } from "@/lib/validation"
import { requireAdmin } from "@/lib/auth-helpers"
import { logSecurityEvent } from "@/lib/security"
import { handleServerActionError } from "@/lib/error-handler"
import { getCurrentUser } from "@/lib/auth"

// ==========================================
// Client Actions
// ==========================================

export async function createClient(formData: FormData) {
  try {
    const user = await requireAdmin()

    const name = sanitizeString(formData.get('name') as string)
    const contactInfo = sanitizeString(formData.get('contactInfo') as string)

    if (!name) {
      throw new Error('Client name is required')
    }

    await prisma.client.create({
      data: {
        name,
        contactInfo: contactInfo || null,
      },
    })

    logSecurityEvent('CLIENT_CREATED', {
      createdBy: user.id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function updateClient(formData: FormData) {
  try {
    const user = await requireAdmin()

    const clientId = sanitizeString(formData.get('clientId') as string)
    const name = sanitizeString(formData.get('name') as string)
    const contactInfo = sanitizeString(formData.get('contactInfo') as string)

    if (!clientId) {
      throw new Error('Client ID is required')
    }
    if (!name) {
      throw new Error('Client name is required')
    }

    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    })
    if (!existingClient) {
      throw new Error('Client not found')
    }

    await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        contactInfo: contactInfo || null,
      },
    })

    logSecurityEvent('CLIENT_UPDATED', {
      updatedBy: user.id,
      clientId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function deleteClient(clientId: string) {
  try {
    const user = await requireAdmin()

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        sites: true,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    if (client.sites.length > 0) {
      throw new Error('Cannot delete client with sites')
    }

    await prisma.client.delete({
      where: { id: clientId },
    })

    logSecurityEvent('CLIENT_DELETED', {
      deletedBy: user.id,
      clientId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

// ==========================================
// Site Actions
// ==========================================

export async function createSite(formData: FormData) {
  try {
    const user = await requireAdmin()

    const clientId = sanitizeString(formData.get('clientId') as string)
    const name = sanitizeString(formData.get('name') as string)
    const address = sanitizeString(formData.get('address') as string)
    const latitudeStr = formData.get('latitude') as string
    const longitudeStr = formData.get('longitude') as string
    const latitude = latitudeStr ? parseFloat(latitudeStr) : null
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null

    if (!clientId) {
      throw new Error('Client ID is required')
    }
    if (!name) {
      throw new Error('Site name is required')
    }

    await prisma.site.create({
      data: {
        clientId,
        name,
        address: address || null,
        latitude,
        longitude,
      },
    })

    logSecurityEvent('SITE_CREATED', {
      createdBy: user.id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function updateSite(formData: FormData) {
  try {
    const user = await requireAdmin()

    const siteId = sanitizeString(formData.get('siteId') as string)
    const clientId = sanitizeString(formData.get('clientId') as string)
    const name = sanitizeString(formData.get('name') as string)
    const address = sanitizeString(formData.get('address') as string)
    const latitudeStr = formData.get('latitude') as string
    const longitudeStr = formData.get('longitude') as string
    const latitude = latitudeStr ? parseFloat(latitudeStr) : null
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null

    if (!siteId) {
      throw new Error('Site ID is required')
    }
    if (!clientId) {
      throw new Error('Client ID is required')
    }
    if (!name) {
      throw new Error('Site name is required')
    }

    const existingSite = await prisma.site.findUnique({
      where: { id: siteId },
    })
    if (!existingSite) {
      throw new Error('Site not found')
    }

    await prisma.site.update({
      where: { id: siteId },
      data: {
        clientId,
        name,
        address: address || null,
        latitude,
        longitude,
      },
    })

    logSecurityEvent('SITE_UPDATED', {
      updatedBy: user.id,
      siteId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function deleteSite(siteId: string) {
  try {
    const user = await requireAdmin()

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        buildings: true,
        users: true,
        workOrders: true,
      },
    })

    if (!site) {
      throw new Error('Site not found')
    }

    if (site.buildings.length > 0) {
      throw new Error('Cannot delete site with buildings')
    }

    if (site.users.length > 0) {
      throw new Error('Cannot delete site with assigned users')
    }

    if (site.workOrders.length > 0) {
      throw new Error('Cannot delete site with work orders')
    }

    await prisma.site.delete({
      where: { id: siteId },
    })

    logSecurityEvent('SITE_DELETED', {
      deletedBy: user.id,
      siteId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

// ==========================================
// Building Actions
// ==========================================

export async function createBuilding(formData: FormData) {
  try {
    const user = await requireAdmin()

    const siteId = sanitizeString(formData.get('siteId') as string)
    const name = sanitizeString(formData.get('name') as string)

    if (!siteId) {
      throw new Error('Site ID is required')
    }
    if (!name) {
      throw new Error('Building name is required')
    }

    await prisma.building.create({
      data: {
        siteId,
        name,
      },
    })

    logSecurityEvent('BUILDING_CREATED', {
      createdBy: user.id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function updateBuilding(formData: FormData) {
  try {
    const user = await requireAdmin()

    const buildingId = sanitizeString(formData.get('buildingId') as string)
    const siteId = sanitizeString(formData.get('siteId') as string)
    const name = sanitizeString(formData.get('name') as string)

    if (!buildingId) {
      throw new Error('Building ID is required')
    }
    if (!siteId) {
      throw new Error('Site ID is required')
    }
    if (!name) {
      throw new Error('Building name is required')
    }

    const existingBuilding = await prisma.building.findUnique({
      where: { id: buildingId },
    })
    if (!existingBuilding) {
      throw new Error('Building not found')
    }

    await prisma.building.update({
      where: { id: buildingId },
      data: {
        siteId,
        name,
      },
    })

    logSecurityEvent('BUILDING_UPDATED', {
      updatedBy: user.id,
      buildingId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function deleteBuilding(buildingId: string) {
  try {
    const user = await requireAdmin()

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        floors: true,
      },
    })

    if (!building) {
      throw new Error('Building not found')
    }

    if (building.floors.length > 0) {
      throw new Error('Cannot delete building with floors')
    }

    await prisma.building.delete({
      where: { id: buildingId },
    })

    logSecurityEvent('BUILDING_DELETED', {
      deletedBy: user.id,
      buildingId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

// ==========================================
// Floor Actions
// ==========================================

export async function createFloor(formData: FormData) {
  try {
    const user = await requireAdmin()

    const buildingId = sanitizeString(formData.get('buildingId') as string)
    const name = sanitizeString(formData.get('name') as string)

    if (!buildingId) {
      throw new Error('Building ID is required')
    }
    if (!name) {
      throw new Error('Floor name is required')
    }

    await prisma.floor.create({
      data: {
        buildingId,
        name,
      },
    })

    logSecurityEvent('FLOOR_CREATED', {
      createdBy: user.id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function updateFloor(formData: FormData) {
  try {
    const user = await requireAdmin()

    const floorId = sanitizeString(formData.get('floorId') as string)
    const buildingId = sanitizeString(formData.get('buildingId') as string)
    const name = sanitizeString(formData.get('name') as string)

    if (!floorId) {
      throw new Error('Floor ID is required')
    }
    if (!buildingId) {
      throw new Error('Building ID is required')
    }
    if (!name) {
      throw new Error('Floor name is required')
    }

    const existingFloor = await prisma.floor.findUnique({
      where: { id: floorId },
    })
    if (!existingFloor) {
      throw new Error('Floor not found')
    }

    await prisma.floor.update({
      where: { id: floorId },
      data: {
        buildingId,
        name,
      },
    })

    logSecurityEvent('FLOOR_UPDATED', {
      updatedBy: user.id,
      floorId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function deleteFloor(floorId: string) {
  try {
    const user = await requireAdmin()

    const floor = await prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        rooms: true,
      },
    })

    if (!floor) {
      throw new Error('Floor not found')
    }

    if (floor.rooms.length > 0) {
      throw new Error('Cannot delete floor with rooms')
    }

    await prisma.floor.delete({
      where: { id: floorId },
    })

    logSecurityEvent('FLOOR_DELETED', {
      deletedBy: user.id,
      floorId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

// ==========================================
// Room Actions
// ==========================================

export async function createRoom(formData: FormData) {
  try {
    const user = await requireAdmin()

    const floorId = sanitizeString(formData.get('floorId') as string)
    const name = sanitizeString(formData.get('name') as string)

    if (!floorId) {
      throw new Error('Floor ID is required')
    }
    if (!name) {
      throw new Error('Room name is required')
    }

    await prisma.room.create({
      data: {
        floorId,
        name,
      },
    })

    logSecurityEvent('ROOM_CREATED', {
      createdBy: user.id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function updateRoom(formData: FormData) {
  try {
    const user = await requireAdmin()

    const roomId = sanitizeString(formData.get('roomId') as string)
    const floorId = sanitizeString(formData.get('floorId') as string)
    const name = sanitizeString(formData.get('name') as string)

    if (!roomId) {
      throw new Error('Room ID is required')
    }
    if (!floorId) {
      throw new Error('Floor ID is required')
    }
    if (!name) {
      throw new Error('Room name is required')
    }

    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    })
    if (!existingRoom) {
      throw new Error('Room not found')
    }

    await prisma.room.update({
      where: { id: roomId },
      data: {
        floorId,
        name,
      },
    })

    logSecurityEvent('ROOM_UPDATED', {
      updatedBy: user.id,
      roomId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}

export async function deleteRoom(roomId: string) {
  try {
    const user = await requireAdmin()

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        assets: true,
      },
    })

    if (!room) {
      throw new Error('Room not found')
    }

    if (room.assets.length > 0) {
      throw new Error('Cannot delete room with assets')
    }

    await prisma.room.delete({
      where: { id: roomId },
    })

    logSecurityEvent('ROOM_DELETED', {
      deletedBy: user.id,
      roomId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/locations')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/locations')
}
