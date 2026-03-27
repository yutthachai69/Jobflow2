"use server"

import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logSecurityEvent } from "@/lib/security"
import type { PMType } from "@prisma/client"

export type PmImportValidatedRow = {
  qrCode: string
  assetId: string
  targetYear: number
  targetMonth: number
  roundIndex: number
  pmType: PMType
  dueDate: Date | null
}

/** ส่งจาก client หลัง JSON — dueDate เป็น ISO string */
export type PmImportCommitRow = Omit<PmImportValidatedRow, "dueDate"> & {
  dueDate?: string | Date | null
}

export type PmImportErrorRow = { excelRow: number; message: string }

function requireAdmin() {
  return getCurrentUser().then((u) => {
    if (!u || u.role !== "ADMIN") throw new Error("Unauthorized")
    return u
  })
}

/** สร้างหรือคืน PMContract สำหรับ site + ปี (ใช้ก่อน import) */
export async function ensurePMContractForImport(siteId: string, year: number) {
  await requireAdmin()
  const existing = await prisma.pMContract.findMany({
    where: { siteId, year },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  if (existing.length > 1) {
    throw new Error(
      "พบสัญญา PM มากกว่า 1 ฉบับในสถานที่และปีนี้ — ลบหรือรวมสัญญาก่อน import"
    )
  }
  if (existing.length === 1) {
    return { contractId: existing[0].id, created: false }
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site) throw new Error("ไม่พบสถานที่")

  const contract = await prisma.pMContract.create({
    data: {
      name: `แผนบำรุงรักษา ${site.name} ประจำปี ${year}`,
      year,
      siteId,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59, 999),
    },
  })
  return { contractId: contract.id, created: true }
}

function normalizeHeader(cell: unknown): string {
  return String(cell ?? "")
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, "")
}

function colKey(h: string): string | null {
  const m: Record<string, string> = {
    qrcode: "qrCode",
    รหัสทรัพย์สิน: "qrCode",
    targetyear: "targetYear",
    ปี: "targetYear",
    targetmonth: "targetMonth",
    เดือน: "targetMonth",
    roundindex: "roundIndex",
    รอบ: "roundIndex",
    pmtype: "pmType",
    ประเภท: "pmType",
    duedate: "dueDate",
    กำหนด: "dueDate",
    วันครบกำหนด: "dueDate",
  }
  return m[h] ?? null
}

function parsePmType(raw: unknown): PMType | null {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
  if (s === "MAJOR" || s === "ล้างใหญ่" || s === "MAJ") return "MAJOR"
  if (s === "MINOR" || s === "ล้างย่อย" || s === "MIN") return "MINOR"
  return null
}

function parseExcelDate(v: unknown): Date | null {
  if (v == null || v === "") return null
  if (typeof v === "number" && !Number.isNaN(v)) {
    const parsed = XLSX.SSF.parse_date_code(v)
    if (parsed)
      return new Date(parsed.y, parsed.m - 1, parsed.d, 12, 0, 0, 0)
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v
  if (typeof v === "string") {
    const t = Date.parse(v)
    if (!Number.isNaN(t)) return new Date(t)
  }
  return null
}

function intCell(v: unknown, min: number, max: number): number | null {
  const n =
    typeof v === "number"
      ? Math.round(v)
      : parseInt(String(v ?? "").trim(), 10)
  if (Number.isNaN(n) || n < min || n > max) return null
  return n
}

/**
 * อ่านไฟล์ Excel (.xlsx) เป็น base64 — validate ตาม site + ปีที่เลือก
 * คอลัมน์: qrCode, targetYear, targetMonth, roundIndex, pmType, dueDate (ไม่บังคับ)
 */
export async function validatePmImportExcel(
  fileBase64: string,
  siteId: string,
  year: number
): Promise<{
  ok: boolean
  rows: PmImportValidatedRow[]
  errors: PmImportErrorRow[]
  warnings: string[]
}> {
  await requireAdmin()

  const warnings: string[] = []
  const errors: PmImportErrorRow[] = []
  const rows: PmImportValidatedRow[] = []

  let buffer: Buffer
  try {
    buffer = Buffer.from(fileBase64, "base64")
  } catch {
    return {
      ok: false,
      rows: [],
      errors: [{ excelRow: 0, message: "ไฟล์ไม่ถูกต้อง (อ่าน base64 ไม่ได้)" }],
      warnings: [],
    }
  }

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: "buffer" })
  } catch {
    return {
      ok: false,
      rows: [],
      errors: [{ excelRow: 0, message: "อ่านไฟล์ Excel ไม่ได้" }],
      warnings: [],
    }
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet)
    return {
      ok: false,
      rows: [],
      errors: [{ excelRow: 0, message: "ไม่มีชีตในไฟล์" }],
      warnings: [],
    }

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  })

  if (data.length === 0)
    return {
      ok: false,
      rows: [],
      errors: [{ excelRow: 0, message: "ไม่มีข้อมูลในไฟล์" }],
      warnings: [],
    }

  const first = data[0]
  const headerMap = new Map<string, string>()
  for (const key of Object.keys(first)) {
    const nk = normalizeHeader(key)
    const logical = colKey(nk)
    if (logical) headerMap.set(logical, key)
  }

  const need = ["qrCode", "targetMonth", "roundIndex", "pmType"] as const
  for (const k of need) {
    if (!headerMap.has(k)) {
      return {
        ok: false,
        rows: [],
        errors: [
          {
            excelRow: 1,
            message: `ไม่พบคอลัมน์ที่จำเป็น (ต้องมี: qrCode, targetMonth, roundIndex, pmType — targetYear/dueDate ไม่บังคับ)`,
          },
        ],
        warnings: [],
      }
    }
  }

  const assetsInSite = await prisma.asset.findMany({
    where: {
      status: "ACTIVE",
      room: { floor: { building: { siteId } } },
    },
    select: { id: true, qrCode: true },
  })
  const byQr = new Map(assetsInSite.map((a) => [a.qrCode.trim(), a]))

  const dup = new Set<string>()

  for (let i = 0; i < data.length; i++) {
    const excelRow = i + 2
    const r = data[i]
    const qrRaw = String(r[headerMap.get("qrCode")!] ?? "").trim()
    if (!qrRaw) {
      errors.push({ excelRow, message: "qrCode ว่าง" })
      continue
    }

    const asset = byQr.get(qrRaw)
    if (!asset) {
      errors.push({
        excelRow,
        message: `ไม่พบทรัพย์สิน "${qrRaw}" ในสถานที่นี้ หรือไม่ ACTIVE`,
      })
      continue
    }

    const tyRaw = headerMap.get("targetYear")
    const targetYear = tyRaw
      ? intCell(r[tyRaw], 2000, 2100) ?? year
      : year
    if (targetYear !== year) {
      errors.push({
        excelRow,
        message: `targetYear ${targetYear} ไม่ตรงกับปีที่เลือก (${year})`,
      })
      continue
    }

    const tm = intCell(r[headerMap.get("targetMonth")!], 1, 12)
    if (tm == null) {
      errors.push({ excelRow, message: "targetMonth ต้องเป็น 1–12" })
      continue
    }

    const ri = intCell(r[headerMap.get("roundIndex")!], 1, 20)
    if (ri == null) {
      errors.push({ excelRow, message: "roundIndex ต้องเป็นตัวเลข (แนะนำ 1–6)" })
      continue
    }

    const pmType = parsePmType(r[headerMap.get("pmType")!])
    if (!pmType) {
      errors.push({
        excelRow,
        message: "pmType ต้องเป็น MAJOR/MINOR หรือ ล้างใหญ่/ล้างย่อย",
      })
      continue
    }

    let dueDate: Date | null = null
    const ddKey = headerMap.get("dueDate")
    if (ddKey) dueDate = parseExcelDate(r[ddKey])

    const dk = `${asset.id}-${targetYear}-${tm}-${ri}`
    if (dup.has(dk)) {
      errors.push({
        excelRow,
        message: "แถวซ้ำ (เครื่องเดียวกัน ปี/เดือน/รอบเดียวกัน)",
      })
      continue
    }
    dup.add(dk)

    rows.push({
      qrCode: qrRaw,
      assetId: asset.id,
      targetYear,
      targetMonth: tm,
      roundIndex: ri,
      pmType,
      dueDate,
    })
  }

  const existingContract = await prisma.pMContract.findFirst({
    where: { siteId, year },
    select: { id: true },
  })
  if (existingContract) {
    const withJob = await prisma.pMSchedule.count({
      where: {
        contractId: existingContract.id,
        jobItem: { isNot: null },
      },
    })
    if (withJob > 0) {
      warnings.push(
        `สัญญาปี ${year} มี ${withJob} รอบที่ผูกใบงานแล้ว — รอบเหล่านั้นจะไม่ถูกลบ; import จะลบเฉพาะรอบที่ยังไม่มีใบงาน`
      )
    }
  }

  return {
    ok: errors.length === 0 && rows.length > 0,
    rows,
    errors,
    warnings,
  }
}

/** บันทึกแผนหลัง validate — ลบ PMSchedule ที่ยังไม่มี jobItem ของสัญญานี้ แล้ว createMany */
export async function commitPmImport(
  siteId: string,
  year: number,
  rows: PmImportCommitRow[]
) {
  const user = await requireAdmin()
  if (rows.length === 0) throw new Error("ไม่มีแถวที่จะบันทึก")

  const normalized: PmImportValidatedRow[] = rows.map((r) => ({
    qrCode: r.qrCode,
    assetId: r.assetId,
    targetYear: r.targetYear,
    targetMonth: r.targetMonth,
    roundIndex: r.roundIndex,
    pmType: r.pmType,
    dueDate:
      r.dueDate == null || r.dueDate === ""
        ? null
        : typeof r.dueDate === "string"
          ? new Date(r.dueDate)
          : r.dueDate instanceof Date
            ? r.dueDate
            : null,
  }))

  const { contractId } = await ensurePMContractForImport(siteId, year)

  const contract = await prisma.pMContract.findFirst({
    where: { id: contractId, siteId, year },
  })
  if (!contract) throw new Error("ไม่พบสัญญา PM")

  const CHUNK = 800
  await prisma.$transaction(async (tx) => {
    await tx.pMSchedule.deleteMany({
      where: {
        contractId: contract.id,
        jobItem: null,
      },
    })

    for (let i = 0; i < normalized.length; i += CHUNK) {
      const chunk = normalized.slice(i, i + CHUNK)
      await tx.pMSchedule.createMany({
        data: chunk.map((r) => ({
          contractId: contract.id,
          assetId: r.assetId,
          pmType: r.pmType,
          roundIndex: r.roundIndex,
          targetMonth: r.targetMonth,
          targetYear: r.targetYear,
          dueDate: r.dueDate,
          status: "PLANNED",
        })),
      })
    }
  })

  logSecurityEvent("PM_IMPORT_COMMITTED", {
    userId: user.userId,
    username: user.username,
    description: `PM Excel import site=${siteId} year=${year} rows=${normalized.length}`,
  })

  revalidatePath("/client/pm-plan")
  revalidatePath("/admin/pm-planning")
  revalidatePath("/admin/pm-import")
  return { success: true, count: normalized.length }
}
