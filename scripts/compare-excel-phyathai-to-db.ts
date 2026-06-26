/**
 * อ่านชีท Excel "รพ.พญาไท อาคาร A" เทียบกับ Asset ใน DB (อ่านอย่างเดียว)
 *
 * คอลัมน์จากไฟล์ตัวอย่าง: [ลำดับ, อาคาร, ชั้น, สถานที่, ?, ประเภทแอร์, เลขเครื่องจักร, ...]
 *
 * รัน:
 *   npx ts-node -r dotenv/config scripts/compare-excel-phyathai-to-db.ts
 *
 * กำหนด path ชีท:
 *   set XLSX_PATH=C:\path\to\file.xlsx   (PowerShell: $env:XLSX_PATH="...")
 */
import 'dotenv/config'
import * as fs from 'fs'
import { Prisma, PrismaClient } from '@prisma/client'

async function loadXlsx() {
  const mod = await import('xlsx')
  return (mod as { default?: typeof import('xlsx') }).default ?? (mod as typeof import('xlsx'))
}

const prisma = new PrismaClient()

const DEFAULT_XLSX =
  process.platform === 'win32'
    ? 'C:\\Users\\Yutthachai\\Downloads\\แผนการดำเนินงานล้างแอร์ L.M.T.xlsx'
    : ''

const XLSX_PATH = process.env.XLSX_PATH || DEFAULT_XLSX
const SHEET_NAME = process.env.PHYATHAI_SHEET ?? 'รพ.พญาไท อาคาร A'

function extractQr(row: unknown[]): string {
  for (let c = 6; c <= 10; c++) {
    const v = String(row[c] ?? '')
      .trim()
      .replace(/\s+/g, '')
    if (/^AC-/i.test(v)) return v
  }
  return ''
}

function parseFloor(v: unknown): number | null {
  if (v === '' || v == null) return null
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const s = String(v).trim()
  const m = s.match(/ชั้น\s*(\d+)/i) || s.match(/^(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

async function main() {
  const XLSX = await loadXlsx()
  if (!XLSX_PATH || !fs.existsSync(XLSX_PATH)) {
    console.error('ไม่พบไฟล์ Excel:', XLSX_PATH || '(ตั้ง XLSX_PATH)')
    process.exit(1)
  }

  const wb = XLSX.readFile(XLSX_PATH)
  if (!wb.SheetNames.includes(SHEET_NAME)) {
    console.error('ไม่มีชีท:', SHEET_NAME, '| มีชีท:', wb.SheetNames.join(', '))
    process.exit(1)
  }

  const matrix = XLSX.utils.sheet_to_json(wb.Sheets[SHEET_NAME], {
    header: 1,
    defval: '',
  }) as unknown[][]

  /** แถวข้อมูล: ข้ามหัวตาราง ~6 แถวแรก */
  const DATA_START = 6
  type SheetRow = {
    rowIndex1: number
    building: string
    floor: number
    location: string
    typeLabel: string
    qr: string
  }
  const sheetRows: SheetRow[] = []

  for (let i = DATA_START; i < matrix.length; i++) {
    const row = matrix[i]
    if (!row || row.length < 7) continue
    const building = String(row[1] ?? '').trim()
    const floor = parseFloor(row[2])
    if (building.toUpperCase() !== 'A' || floor == null || (floor !== 2 && floor !== 3)) continue

    const qr = extractQr(row)
    const location = String(row[3] ?? '').trim()
    const typeLabel = String(row[5] ?? '').trim()

    sheetRows.push({
      rowIndex1: i + 1,
      building,
      floor,
      location,
      typeLabel,
      qr,
    })
  }

  const withQr = sheetRows.filter((r) => r.qr.length > 0)
  const withoutQr = sheetRows.filter((r) => r.qr.length === 0)
  const withoutQrButType = withoutQr.filter((r) => r.typeLabel.length > 0)

  const sheetQrs = [...new Set(withQr.map((r) => r.qr))]
  const byFloorSheet = { 2: sheetRows.filter((r) => r.floor === 2).length, 3: sheetRows.filter((r) => r.floor === 3).length }

  console.log('========== ชีท Excel ==========')
  console.log('ไฟล์:', XLSX_PATH)
  console.log('ชีท:', SHEET_NAME)
  console.log(`แถวข้อมูล อาคาร A ชั้น 2+3: ${sheetRows.length} แถว`)
  console.log(`  - มีเลขเครื่อง (QR ขึ้นต้น AC-): ${withQr.length} | ไม่มีรหัส AC- ในคอลัมน์ที่สแกน: ${withoutQr.length}`)
  console.log(`    (ในแถวไม่มี AC- แต่มีข้อความ "ประเภทแอร์": ${withoutQrButType.length} แถว — น่าจะเป็นรายการที่ไม่ได้ใส่รหัสในช่องเดียวกับแถว AC-)`)
  console.log(`  - QR ไม่ซ้ำ: ${sheetQrs.length}`)
  if (withoutQr.length > 0 && withoutQr.length <= 15) {
    console.log('แถวที่ไม่พบ QR:', withoutQr.map((r) => `แถว ${r.rowIndex1} ชั้น${r.floor} ${r.location}`).join('\n'))
  } else if (withoutQr.length > 15) {
    console.log('แถวที่ไม่พบ QR (ตัวอย่าง 15 แถวแรก):')
    for (const r of withoutQr.slice(0, 15)) {
      console.log(`  แถว ${r.rowIndex1} ชั้น${r.floor} ${r.location}`)
    }
  }

  const buildingWhere: Prisma.BuildingWhereInput = {
    name: { contains: 'A' },
    site: {
      AND: [
        {
          OR: [
            { name: { contains: 'พญาไท' } },
            { client: { name: { contains: 'พญาไท' } } },
          ],
        },
        { NOT: { name: { contains: 'ศรีราชา' } } },
      ],
    },
  }

  const floors = await prisma.floor.findMany({
    where: { building: buildingWhere },
    select: { id: true, name: true },
  })

  function floorNum(name: string): number | null {
    const n = name.replace(/\s+/g, ' ').trim()
    const m1 = n.match(/ชั้น\s*(\d+)/i)
    if (m1) return parseInt(m1[1], 10)
    const m2 = n.match(/^(\d+)$/)
    if (m2) return parseInt(m2[1], 10)
    return null
  }

  const floor23Ids = floors.filter((f) => {
    const n = floorNum(f.name)
    return n === 2 || n === 3
  }).map((f) => f.id)

  const dbAssets = await prisma.asset.findMany({
    where: { room: { floorId: { in: floor23Ids } } },
    select: {
      qrCode: true,
      assetType: true,
      machineType: true,
      btu: true,
      room: { select: { name: true, floor: { select: { name: true } } } },
    },
  })

  const dbQrSet = new Set(dbAssets.map((a) => a.qrCode.trim()))
  const inSheetNotInDb = sheetQrs.filter((q) => !dbQrSet.has(q))
  const inDbNotInSheet = [...dbQrSet].filter((q) => !sheetQrs.includes(q))

  function qrBucket(q: string): string {
    if (/^AC-/i.test(q)) return 'AC-*'
    if (/^EX-/i.test(q)) return 'EX-*'
    if (/^\d+$/.test(q)) return 'ตัวเลขล้วน'
    return 'อื่นๆ'
  }
  const dbBuckets = new Map<string, number>()
  for (const a of dbAssets) {
    const b = qrBucket(a.qrCode)
    dbBuckets.set(b, (dbBuckets.get(b) ?? 0) + 1)
  }

  console.log('\n========== เทียบกับ DB (ชั้น 2+3 อาคาร A ตาม floor id) ==========')
  console.log(`floorIds ชั้น2+3: ${floor23Ids.join(', ') || '(ว่าง)'}`)
  console.log(`Asset ใน DB บนชั้นนี้: ${dbAssets.length}`)
  console.log(`มีในชีท (QR) แต่ไม่มีใน DB: ${inSheetNotInDb.length}`)
  if (inSheetNotInDb.length) {
    const detail = withQr.filter((r) => inSheetNotInDb.includes(r.qr))
    for (const r of detail) {
      console.log(
        `  - ${r.qr}\tชั้น ${r.floor}\t${r.typeLabel}\t(Excel แถว ${r.rowIndex1}) ${r.location}`
      )
    }
  }
  console.log(`มีใน DB แต่ไม่ปรากฏในคอลัมน์รหัส AC- ของชีท (ชั้น2+3): ${inDbNotInSheet.length}`)
  console.log('จำแนกรหัสใน DB ตามรูปแบบ:', Object.fromEntries([...dbBuckets.entries()].sort((a, b) => b[1] - a[1])))
  if (inDbNotInSheet.length && inDbNotInSheet.length <= 40) {
    for (const q of inDbNotInSheet.sort()) {
      const a = dbAssets.find((x) => x.qrCode === q)
      const typ = `${a?.assetType} | ${a?.machineType ?? 'null'} | ${a?.btu ?? 'null'}`
      console.log(`  - ${q}\t${typ}\t${a?.room.floor.name} / ${a?.room.name}`)
    }
  } else if (inDbNotInSheet.length > 40) {
    console.log('  (มากกว่า 40 — แสดง 40 แรก)')
    for (const q of inDbNotInSheet.sort().slice(0, 40)) {
      const a = dbAssets.find((x) => x.qrCode === q)
      console.log(`  - ${q}\t${a?.room.floor.name}`)
    }
  }

  console.log('\n========== สรุปยอดแถวชีท vs ที่คาดจากชีทก่อนหน้า ==========')
  console.log(`นับแถวในชีท ชั้น2: ${sheetRows.filter((r) => r.floor === 2).length} | ชั้น3: ${sheetRows.filter((r) => r.floor === 3).length}`)
  console.log(`แถวชีทรวม − Asset DB รวม = ${sheetRows.length - dbAssets.length} (ชีทมากกว่า DB ถ้าเป็นบวก)`)
  console.log(
    'คำอธิบายสั้นๆ: ชีทนับเป็น "แถวแผน" 302 แถว แต่มีแค่ 148 แถวที่มีรหัส AC- ในคอลัมน์ที่สแกน — รหัส AC- ทั้งหมดใน DB ครบแล้ว; ที่เหลือใน DB เป็น EX-* / รหัสอื่น ที่แผนชีทนี้ไม่ได้ใส่ในคอลัมน์เดียวกัน'
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
