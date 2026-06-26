const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const bigWOs = await prisma.workOrder.findMany({
      where: {
        jobType: 'PM',
        status: 'COMPLETED',
        jobItems: { some: {} }
      },
      include: {
        jobItems: {
          include: {
            photos: true
          }
        }
      }
    })

    console.log(`Found ${bigWOs.length} work orders to check for splitting.`)

    for (const wo of bigWOs) {
      if (wo.jobItems.length <= 1) continue

      // Group JobItems by their actual date (endTime or startTime)
      const dailyGroups = {}
      for (const ji of wo.jobItems) {
        const d = ji.endTime ?? ji.startTime ?? wo.scheduledDate
        const dateStr = d.toISOString().split('T')[0]
        if (!dailyGroups[dateStr]) dailyGroups[dateStr] = []
        dailyGroups[dateStr].push(ji)
      }

      const dates = Object.keys(dailyGroups)
      if (dates.length <= 1) continue

      console.log(`Splitting Work Order ${wo.workOrderNumber || wo.id} into ${dates.length} daily work orders.`)

      // Create new WOs for each day except the first one (we'll keep the current WO for the first group)
      const firstDate = dates[0]
      const otherDates = dates.slice(1)

      // Update current WO scheduledDate to the firstDate
      await prisma.workOrder.update({
        where: { id: wo.id },
        data: { scheduledDate: new Date(firstDate) }
      })

      const { generateWorkOrderNumber } = require('./lib/work-order-number')
      
      for (const dStr of otherDates) {
        const items = dailyGroups[dStr]
        console.log(`  Creating WO for ${dStr} (${items.length} items)...`)
        
        let woNumber;
        try {
          const year = dStr.split('-')[0].slice(-2)
          const month = dStr.split('-')[1]
          const day = dStr.split('-')[2]
          woNumber = `${year}${month}${day}${Math.floor(1000 + Math.random() * 9000)}`
        } catch (e) {
          woNumber = `RESTORE-${Date.now()}`
        }

        const newWO = await prisma.workOrder.create({
          data: {
            workOrderNumber: woNumber,
            jobType: wo.jobType,
            status: wo.status,
            siteId: wo.siteId,
            scheduledDate: new Date(dStr)
          }
        })

        for (const ji of items) {
          await prisma.jobItem.update({
            where: { id: ji.id },
            data: { workOrderId: newWO.id }
          })
        }
      }
    }

    console.log('Splitting complete.')
  } catch (err) {
    console.error('Splitting failed:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
