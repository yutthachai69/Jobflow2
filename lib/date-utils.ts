/**
 * date-utils.ts
 *
 * Utility functions for displaying dates correctly regardless of whether the code
 * runs on the server (UTC timezone) or the client browser (UTC+7 Thailand).
 *
 * Problem: Prisma returns DateTime fields as UTC Date objects.
 * - On the server (Vercel/Node): new Date(d).toLocaleDateString() uses UTC → correct
 * - On the browser (Thailand, UTC+7): new Date(d).toLocaleDateString() uses UTC+7 → off by 1 day
 *
 * Solution: Always read date parts using getUTC* methods so the result is consistent
 * on both server and client.
 */

const TH_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

const TH_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/** Convert Gregorian year to Buddhist Era (พ.ศ.) */
function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + 543
}

/**
 * Format a UTC-stored date safely (same result on server and browser).
 *
 * Examples:
 *   formatThaiDate(date, 'long')  → "9 เมษายน 2569"
 *   formatThaiDate(date, 'short') → "9 เม.ย. 2569"
 *   formatThaiDate(date, 'numeric') → "9/4/2569"
 */
export function formatThaiDate(
  date: Date | string | null | undefined,
  format: 'long' | 'short' | 'numeric' = 'long',
): string {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '-'

  const day = d.getUTCDate()
  const monthIdx = d.getUTCMonth()          // 0-based
  const year = toBuddhistYear(d.getUTCFullYear())

  if (format === 'long') {
    return `${day} ${TH_MONTHS_LONG[monthIdx]} ${year}`
  }
  if (format === 'short') {
    return `${day} ${TH_MONTHS_SHORT[monthIdx]} ${year}`
  }
  // numeric: d/M/YYYY (Thai convention)
  return `${day}/${monthIdx + 1}/${year}`
}

/**
 * Format a UTC-stored date with time (e.g. for work order detail pages).
 * Example: "9 เมษายน 2569 เวลา 14:30 น."
 * Note: time is shown in UTC to match the stored value. If you need local time,
 * pass { localTime: true }.
 */
export function formatThaiDateTime(
  date: Date | string | null | undefined,
  options: { localTime?: boolean } = {},
): string {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '-'

  const dateStr = formatThaiDate(d, 'long')

  const h = options.localTime ? d.getHours() : d.getUTCHours()
  const m = options.localTime ? d.getMinutes() : d.getUTCMinutes()
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')

  return `${dateStr} เวลา ${hh}:${mm} น.`
}
