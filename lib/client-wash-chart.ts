/**
 * สร้างชุดข้อมูลกราฟการล้าง (ล้างใหญ่ / ล้างย่อย) จาก map รายวัน + ช่วงวันที่ + มิติการรวม
 */

export type ChartGranularity = 'day' | 'week' | 'month' | 'year'

export interface WashChartBucketPoint {
  name: string
  targetWash: number
  actual: number
}

/** จำนวนล้างย่อยแยกแอร์ / Exhaust ต่อวัน (รวมใน map รายวัน) */
export interface WashDayCounts {
  majorWash: number
  minorWashAir: number
  minorWashExhaust: number
}

/** จุดกราฟล้างย่อย: เป้า 1 แท่ง + แอร์ + Exhaust (เทียบเป้าใช้ actualTotal = แอร์+Exhaust) */
export interface WashChartMinorBucketPoint {
  name: string
  targetWash: number
  minorAir: number
  minorExhaust: number
  /** แอร์ + Exhaust — ใช้เทียบกับเป้าหมาย */
  actualTotal: number
}

export function toLocalDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseChartDate(s: string | undefined | null): Date | null {
  if (!s || typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

export function formatChartDate(d: Date) {
  return toLocalDateKey(d)
}

function dateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDaysLocal(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function startOfWeekMondayLocal(d: Date) {
  const x = dateOnly(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function maxDate(a: Date, b: Date) {
  return dateOnly(a) >= dateOnly(b) ? dateOnly(a) : dateOnly(b)
}

function minDate(a: Date, b: Date) {
  return dateOnly(a) <= dateOnly(b) ? dateOnly(a) : dateOnly(b)
}

function daysInclusive(a: Date, b: Date): number {
  const A = dateOnly(a).getTime()
  const B = dateOnly(b).getTime()
  if (A > B) return 0
  return Math.round((B - A) / 86400000) + 1
}

function enumerateDays(from: Date, to: Date): Date[] {
  const out: Date[] = []
  let d = dateOnly(from)
  const end = dateOnly(to)
  while (d.getTime() <= end.getTime()) {
    out.push(new Date(d))
    d = addDaysLocal(d, 1)
  }
  return out
}

const MONTH_LABELS_SHORT: Record<number, string> = {
  0: 'ม.ค.',
  1: 'ก.พ.',
  2: 'มี.ค.',
  3: 'เม.ย.',
  4: 'พ.ค.',
  5: 'มิ.ย.',
  6: 'ก.ค.',
  7: 'ส.ค.',
  8: 'ก.ย.',
  9: 'ต.ค.',
  10: 'พ.ย.',
  11: 'ธ.ค.',
}

function sumMajorInRange(washByDay: Map<string, WashDayCounts>, from: Date, to: Date): number {
  let s = 0
  for (const d of enumerateDays(from, to)) {
    const c = washByDay.get(toLocalDateKey(d))
    if (c) s += c.majorWash
  }
  return s
}

function sumMinorAirInRange(washByDay: Map<string, WashDayCounts>, from: Date, to: Date): number {
  let s = 0
  for (const d of enumerateDays(from, to)) {
    const c = washByDay.get(toLocalDateKey(d))
    if (c) s += c.minorWashAir
  }
  return s
}

function sumMinorExhaustInRange(washByDay: Map<string, WashDayCounts>, from: Date, to: Date): number {
  let s = 0
  for (const d of enumerateDays(from, to)) {
    const c = washByDay.get(toLocalDateKey(d))
    if (c) s += c.minorWashExhaust
  }
  return s
}

function targetForDays(days: number, weeklyTarget: number) {
  if (days <= 0) return 0
  return (weeklyTarget * days) / 7
}

export function parseGranularity(s: string | undefined | null): ChartGranularity {
  if (s === 'week' || s === 'month' || s === 'year') return s
  return 'day'
}

/** จำกัดช่วงสูงสุด (วัน) เพื่อไม่ให้กราฟมีจุดมากเกินไป */
const MAX_RANGE_DAYS = 800

export function clampChartRange(from: Date, to: Date): { from: Date; to: Date; wasClamped: boolean } {
  const F = dateOnly(from)
  const T = dateOnly(to)
  let a = F
  let b = T
  if (a > b) {
    const t = a
    a = b
    b = t
  }
  const span = daysInclusive(a, b)
  let wasClamped = false
  if (span > MAX_RANGE_DAYS) {
    b = addDaysLocal(a, MAX_RANGE_DAYS - 1)
    wasClamped = true
  }
  return { from: a, to: b, wasClamped }
}

export function buildWashChartSeries(
  washByDay: Map<string, WashDayCounts>,
  rangeFrom: Date,
  rangeTo: Date,
  granularity: ChartGranularity,
  /** เป้าหมายล้างใหญ่: จำนวนเครื่องที่ต้องการทำต่อสัปดาห์ */
  weeklyTargetMajor: number,
  /** เป้าหมายล้างย่อย (แอร์+Exhaust รวม): จำนวนเครื่องต่อสัปดาห์ */
  weeklyTargetMinor: number
): { major: WashChartBucketPoint[]; minor: WashChartMinorBucketPoint[] } {
  const rf = dateOnly(rangeFrom)
  const rt = dateOnly(rangeTo)
  const major: WashChartBucketPoint[] = []
  const minor: WashChartMinorBucketPoint[] = []

  const pushBucket = (label: string, iFrom: Date, iTo: Date) => {
    const days = daysInclusive(iFrom, iTo)
    if (days <= 0) return
    major.push({
      name: label,
      targetWash: targetForDays(days, weeklyTargetMajor),
      actual: sumMajorInRange(washByDay, iFrom, iTo),
    })
    const air = sumMinorAirInRange(washByDay, iFrom, iTo)
    const exh = sumMinorExhaustInRange(washByDay, iFrom, iTo)
    minor.push({
      name: label,
      targetWash: targetForDays(days, weeklyTargetMinor),
      minorAir: air,
      minorExhaust: exh,
      actualTotal: air + exh,
    })
  }

  if (granularity === 'day') {
    for (const d of enumerateDays(rf, rt)) {
      const label = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
      pushBucket(label, d, d)
    }
  } else if (granularity === 'week') {
    let ws = startOfWeekMondayLocal(rf)
    const endD = rt
    while (ws.getTime() <= endD.getTime()) {
      const we = addDaysLocal(ws, 6)
      const i0 = maxDate(ws, rf)
      const i1 = minDate(we, rt)
      if (i0.getTime() <= i1.getTime()) {
        const label = `${i0.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} – ${i1.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
        pushBucket(label, i0, i1)
      }
      ws = addDaysLocal(ws, 7)
    }
  } else if (granularity === 'month') {
    let cur = new Date(rf.getFullYear(), rf.getMonth(), 1)
    const endAnchor = new Date(rt.getFullYear(), rt.getMonth(), 1)
    while (cur.getTime() <= endAnchor.getTime()) {
      const ms = new Date(cur.getFullYear(), cur.getMonth(), 1)
      const me = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const i0 = maxDate(ms, rf)
      const i1 = minDate(me, rt)
      if (i0.getTime() <= i1.getTime()) {
        const label = `${MONTH_LABELS_SHORT[cur.getMonth()]} ${cur.getFullYear() + 543}`
        pushBucket(label, i0, i1)
      }
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
  } else {
    for (let y = rf.getFullYear(); y <= rt.getFullYear(); y++) {
      const ys = new Date(y, 0, 1)
      const ye = new Date(y, 11, 31)
      const i0 = maxDate(ys, rf)
      const i1 = minDate(ye, rt)
      if (i0.getTime() <= i1.getTime()) {
        const label = `พ.ศ. ${y + 543}`
        pushBucket(label, i0, i1)
      }
    }
  }

  return { major, minor }
}
