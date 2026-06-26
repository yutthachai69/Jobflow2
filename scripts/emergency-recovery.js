const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const trappedItems = await prisma.jobItem.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        workOrder: { status: 'COMPLETED' }
      },
      include: {
        workOrder: true
      }
    })

    console.log(`Found ${trappedItems.length} trapped active items.`)

    if (trappedItems.length === 0) {
      console.log('No trapped items found. Nothing to do.')
      return
    }

    const groups = {}
    for (const item of trappedItems) {
      const dateStr = item.startTime ? item.startTime.toISOString().split('T')[0] : item.workOrder.scheduledDate.toISOString().split('T')[0]
      const key = `${item.workOrder.siteId}_${dateStr}`
      if (!groups[key]) groups[key] = { siteId: item.workOrder.siteId, date: new Date(dateStr), items: [] }
      groups[key].items.push(item)
    }

    for (const [key, data] of Object.entries(groups)) {
      console.log(`Restoring group ${key} (${data.items.length} items)...`)
      
      const year = data.date.getFullYear().toString().slice(-2)
      const monthSelect = (data.date.getMonth() + 1).toString().padStart(2, '0')
      const prefix = `${year}${monthSelect}`
      const timestamp = Date.now().toString().slice(-4)
      const woNumber = `${prefix}99${timestamp}` // Temporary unique number

      const newWO = await prisma.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          jobType: 'PM',
          status: 'OPEN',
          siteId: data.siteId,
          scheduledDate: data.date
        }
      })

      for (const item of data.items) {
        await prisma.jobItem.update({
          where: { id: item.id },
          data: { workOrderId: newWO.id }
        })
      }
      console.log(`  Created WO ${woNumber} (ID: ${newWO.id})`)
    }

    console.log('Recovery complete.')
  } catch (err) {
    console.error('Recovery failed:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
