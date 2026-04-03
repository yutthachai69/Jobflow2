import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })
}

// ผูก client กับ globalThis ทุก environment — Turbopack/HMR ใน dev โหลดโมดูลซ้ำได้;
// ถ้าไม่ทำแบบนี้จะเกิด PrismaClient หลายตัว → connection pool เต็ม (P2024)
export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = createPrismaClient())