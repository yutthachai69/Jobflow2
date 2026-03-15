"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function getClientPMPlan(year: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== "CLIENT") throw new Error("Unauthorized")

  const siteId = user.siteId
  if (!siteId) throw new Error("Client has no site")

  // ใช้ select เฉพาะฟิลด์ที่ใช้ — ไม่รวม dueDate เพื่อรองรับ production ที่อาจยังไม่มีคอลัมน์นี้
  const schedules = await prisma.pMSchedule.findMany({
    where: {
      targetYear: year,
      contract: { siteId },
    },
    select: {
      targetMonth: true,
      asset: { select: { assetType: true } },
      jobItem: { select: { status: true } },
    },
  })

  const summary = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const inMonth = schedules.filter((s) => s.targetMonth === month)

    const ac = inMonth.filter((s) => s.asset.assetType === "AIR_CONDITIONER")
    const exhaust = inMonth.filter((s) => s.asset.assetType === "EXHAUST")

    const done = inMonth.filter((s) => s.jobItem && s.jobItem.status === "DONE").length
    const inProgress = inMonth.filter(
      (s) => s.jobItem && s.jobItem.status !== "DONE",
    ).length
    const pending = inMonth.filter((s) => !s.jobItem).length

    return {
      month,
      total: inMonth.length,
      acCount: ac.length,
      exhaustCount: exhaust.length,
      done,
      inProgress,
      pending,
    }
  })

  return { summary, siteId }
}

