import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })
}

// ผูก client กับ global — Turbopack/HMR / `new PrismaClient()` ในไฟล์อื่นจะทำให้ pool เต็ม (P2024)
// ถ้ายัง timeout: ลองต่อท้าย DATABASE_URL ด้วย &pool_timeout=30 หรือลด connection_limit ตามเอกสาร Prisma
function getOrCreatePrisma(): PrismaClient {
  const existing = globalForPrisma.prisma
  if (existing) return existing
  const client = createPrismaClient()
  globalForPrisma.prisma = client
  return client
}

export const prisma = getOrCreatePrisma()