const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      where: { jobType: 'PM', status: { not: 'CANCELLED' } },
      include: {
        jobItems: {
          include: {
            photos: true
          }
        }
      }
    })

    const groups = {}
    for (const wo of workOrders) {
      const date = new Date(wo.scheduledDate)
      const monthKey = `${wo.siteId}_${date.getFullYear()}_${date.getMonth()}`
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(wo)
    }

    let mergedCount = 0
    let deletedCount = 0

    for (const [key, items] of Object.entries(groups)) {
      if (items.length <= 1) continue

      console.log(`\nMerging group: ${key} (${items.length} work orders)`)

      // Sort items: COMPLETED first, then oldest created
      const sorted = items.sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return 1
        return a.createdAt - b.createdAt
      })

      const master = sorted[0]
      const redundants = sorted.slice(1)

      for (const redundant of redundants) {
        console.log(`  Merging Redundant WO ${redundant.workOrderNumber || redundant.id} (${redundant.status}) into Master ${master.workOrderNumber || master.id}`)

        for (const sourceItem of redundant.jobItems) {
          // Check if master already has this asset
          const existingItem = master.jobItems.find(i => i.assetId === sourceItem.assetId)

          if (existingItem) {
            console.log(`    Asset ${sourceItem.assetId} already in master. Merging item data...`)
            
            // Move photos to existing item
            if (sourceItem.photos.length > 0) {
              await prisma.jobPhoto.updateMany({
                where: { jobItemId: sourceItem.id },
                data: { jobItemId: existingItem.id }
              })
              console.log(`      Moved ${sourceItem.photos.length} photos.`)
            }

            // Sync notes if master is empty
            if (sourceItem.techNote && !existingItem.techNote) {
              await prisma.jobItem.update({
                where: { id: existingItem.id },
                data: { techNote: sourceItem.techNote }
              })
            }

            // Delete the duplicate job item
            await prisma.jobItem.delete({ where: { id: sourceItem.id } })
          } else {
            // Just move the item to the master WO
            await prisma.jobItem.update({
              where: { id: sourceItem.id },
              data: { workOrderId: master.id }
            })
            console.log(`    Moved Item ${sourceItem.id} to master.`)
          }
        }

        // Delete the redundant WO
        await prisma.workOrder.delete({ where: { id: redundant.id } })
        deletedCount++
      }
      mergedCount++
    }

    console.log(`\nCleanup complete. Merged ${mergedCount} groups, deleted ${deletedCount} redundant work orders.`)
  } catch (err) {
    console.error('Error during cleanup:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
