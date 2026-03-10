const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('กำลังลบรูปงาน, feedback, รายการงาน, ใบสั่งงาน และทรัพย์สิน...')

  await prisma.jobPhoto.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.jobItem.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.asset.deleteMany()

  console.log('ล้างอุปกรณ์และใบงานทั้งหมดเรียบร้อยแล้ว')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
