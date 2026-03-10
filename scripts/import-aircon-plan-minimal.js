const fs = require('node:fs')
const path = require('node:path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function parseArgs(argv) {
  const args = { file: null, siteId: null, siteName: null, dryRun: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (!args.file && !a.startsWith('--')) {
      args.file = a
      continue
    }
    if (a === '--site') {
      args.siteId = argv[i + 1] || null
      i++
      continue
    }
    if (a === '--site-name') {
      args.siteName = argv[i + 1] || null
      i++
      continue
    }
    if (a === '--dry-run') {
      args.dryRun = true
      continue
    }
  }
  return args
}

function splitSqlValues(valuesChunk) {
  // Split by commas not inside single quotes.
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < valuesChunk.length; i++) {
    const ch = valuesChunk[i]
    if (ch === "'") {
      // handle escaped '' inside strings
      const next = valuesChunk[i + 1]
      if (inQuotes && next === "'") {
        cur += "'"
        i++
        continue
      }
      inQuotes = !inQuotes
      cur += ch
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function sqlLiteralToValue(lit) {
  const t = lit.trim()
  if (!t || t.toUpperCase() === 'NULL') return null
  if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).replace(/''/g, "'")
  return t
}

function normalizeBuildingName(raw) {
  const v = raw.trim()
  if (!v) return null
  // Common input: 'A'
  if (/^[A-Za-z]$/.test(v)) return `อาคาร ${v.toUpperCase()}`
  if (v.startsWith('อาคาร')) return v
  // Sometimes: "อาคาร A ชั้น B" (header-like) -> keep as-is but usually should be skipped upstream
  return v
}

function normalizeFloorName(raw) {
  const v = raw.trim()
  if (!v) return null
  // Input often like "2.0"
  const n = Number(v)
  if (!Number.isNaN(n) && Number.isFinite(n)) {
    // show as integer if possible
    const intLike = Math.abs(n - Math.round(n)) < 1e-9
    return `ชั้น ${intLike ? String(Math.round(n)) : v}`
  }
  if (v.startsWith('ชั้น')) return v
  return `ชั้น ${v}`
}

function normalizeRoomName(raw) {
  let v = raw.trim()
  if (!v) return null
  v = v.replace(/\s+/g, ' ')
  // remove trailing dots (common in source)
  v = v.replace(/[.]+$/g, '')
  return v
}

function deriveClientNameFromSiteName(siteName) {
  const s = (siteName || '').trim()
  if (!s) return null
  // e.g. "รพ.พญาไท อาคาร A" -> "รพ.พญาไท"
  const idx = s.indexOf(' อาคาร')
  if (idx > 0) return s.slice(0, idx).trim()
  return s
}

async function resolveOrCreateTargetSite({ siteId, siteName }) {
  if (siteId) {
    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) throw new Error(`ไม่พบ Site id=${siteId}`)
    return site
  }

  const desiredSiteName = (siteName || '').trim()
  if (desiredSiteName) {
    const existingByName = await prisma.site.findFirst({ where: { name: desiredSiteName } })
    if (existingByName) return existingByName

    // Need a clientId to create a Site
    const desiredClientName = deriveClientNameFromSiteName(desiredSiteName) || 'Default Client'
    let client = await prisma.client.findFirst({ where: { name: desiredClientName } })
    if (!client) {
      client = await prisma.client.create({ data: { name: desiredClientName } })
    }

    return prisma.site.create({ data: { name: desiredSiteName, clientId: client.id } })
  }

  const fallback = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } }).catch(async () => prisma.site.findFirst())
  if (!fallback) throw new Error('ไม่พบ Site ในฐานข้อมูล (ต้องมี Site อย่างน้อย 1 หรือระบุ --site-name)')
  return fallback
}

async function main() {
  const args = parseArgs(process.argv)
  if (!args.file) {
    console.log('Usage: node scripts/import-aircon-plan-minimal.js <path-to-sql-file> [--site <siteId>] [--site-name \"<site name>\"] [--dry-run]')
    process.exit(1)
  }

  const filePath = path.resolve(process.cwd(), args.file)
  const sql = fs.readFileSync(filePath, 'utf8')

  const site = await resolveOrCreateTargetSite({ siteId: args.siteId, siteName: args.siteName })
  console.log(`Target site: ${site.name} (${site.id})`)

  const insertLines = sql
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.toUpperCase().startsWith('INSERT INTO AIRCON_PLAN_MINIMAL'))

  const rows = []
  for (const line of insertLines) {
    const m = line.match(/VALUES\s*\((.*)\)\s*;?\s*$/i)
    if (!m) continue
    const chunks = splitSqlValues(m[1])
    if (chunks.length < 4) continue

    const buildingRaw = sqlLiteralToValue(chunks[1])
    const floorRaw = sqlLiteralToValue(chunks[2])
    const roomRaw = sqlLiteralToValue(chunks[3])

    if (!buildingRaw || !floorRaw || !roomRaw) continue

    // skip header-like garbage
    if (String(buildingRaw).includes('อาคาร') && String(buildingRaw).includes('ชั้น') && !/^[A-Za-z]$/.test(String(buildingRaw).trim())) {
      // example: 'อาคาร A ชั้น B'
      continue
    }

    const buildingName = normalizeBuildingName(String(buildingRaw))
    const floorName = normalizeFloorName(String(floorRaw))
    const roomName = normalizeRoomName(String(roomRaw))
    if (!buildingName || !floorName || !roomName) continue

    rows.push({ buildingName, floorName, roomName })
  }

  // de-dup
  const key = (r) => `${r.buildingName}||${r.floorName}||${r.roomName}`
  const uniq = new Map()
  for (const r of rows) uniq.set(key(r), r)
  const uniqueRows = [...uniq.values()]

  console.log(`Parsed ${rows.length} rows, unique ${uniqueRows.length} rooms`)
  if (args.dryRun) {
    console.log('Dry run enabled. Example rows:', uniqueRows.slice(0, 5))
    return
  }

  const buildingCache = new Map()
  const floorCache = new Map()

  for (const r of uniqueRows) {
    const bKey = r.buildingName
    let building = buildingCache.get(bKey)
    if (!building) {
      building = await prisma.building.findFirst({ where: { siteId: site.id, name: r.buildingName } })
      if (!building) {
        building = await prisma.building.create({ data: { siteId: site.id, name: r.buildingName } })
      }
      buildingCache.set(bKey, building)
    }

    const fKey = `${building.id}||${r.floorName}`
    let floor = floorCache.get(fKey)
    if (!floor) {
      floor = await prisma.floor.findFirst({ where: { buildingId: building.id, name: r.floorName } })
      if (!floor) {
        floor = await prisma.floor.create({ data: { buildingId: building.id, name: r.floorName } })
      }
      floorCache.set(fKey, floor)
    }

    const existingRoom = await prisma.room.findFirst({ where: { floorId: floor.id, name: r.roomName } })
    if (!existingRoom) {
      await prisma.room.create({ data: { floorId: floor.id, name: r.roomName } })
    }
  }

  console.log('Import completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

