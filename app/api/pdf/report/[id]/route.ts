import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPmWashTypeLabelThai } from '@/lib/pm-wash-label'
import { buildExhaustFanReportHtml, EXHAUST_REPORT_CSS } from '@/lib/exhaust-fan-report-html'
import { buildAirborneReportHtml, AIRBORNE_REPORT_CSS } from '@/lib/airborne-report-html'

export const maxDuration = 60 // Vercel: max 60s for PDF generation

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const jobItem = await prisma.jobItem.findUnique({
      where: { id },
      include: {
        asset: { include: { room: true } },
        workOrder: { include: { site: { include: { client: true } } } },
        pmSchedule: { select: { pmType: true } },
      },
    })

    if (!jobItem) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // CLIENT: ดูได้เฉพาะงานของ site ตัวเอง
    if (user.role === 'CLIENT') {
      const u = await prisma.user.findUnique({ where: { id: user.userId }, select: { siteId: true } })
      if (!u?.siteId || u.siteId !== jobItem.workOrder.siteId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Determine form type (same logic as technician page + job report page)
    let formType = 'AIRBORNE_INFECTION'
    if (jobItem.checklist) {
      try {
        const parsed = JSON.parse(jobItem.checklist) as { formType?: string }
        if (parsed?.formType) {
          formType = parsed.formType === 'CLEAN_ROOM' ? 'AIRBORNE_INFECTION' : parsed.formType
        }
      } catch { /* keep default */ }
    }
    if (
      formType === 'AIRBORNE_INFECTION' &&
      (jobItem.asset.assetType === 'EXHAUST_DUCT' || jobItem.asset.assetType === 'EXHAUST_FAN' || /^(EX|ExD|ExF)-/.test(jobItem.asset.qrCode))
    ) {
      formType = 'EXHAUST_FAN'
    }

    const pmWashLabel = getPmWashTypeLabelThai(jobItem.workOrder.jobType, jobItem)

    const css = formType === 'EXHAUST_FAN' ? EXHAUST_REPORT_CSS : AIRBORNE_REPORT_CSS
    const formHtml =
      formType === 'EXHAUST_FAN'
        ? buildExhaustFanReportHtml(jobItem, jobItem.workOrder, { pmWashLabel })
        : buildAirborneReportHtml(jobItem, jobItem.workOrder, { pmWashLabel })

    const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${css}
</style>
</head>
<body>${formHtml}</body>
</html>`

    const { launchBrowser } = await import('@/lib/pdf-browser')
    const browser = await launchBrowser()

    try {
      const page = await browser.newPage()
      await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' })
      await page.emulateMediaType('print')

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }, // @page CSS handles margin
      })

      await page.close()

      const assetCode = jobItem.asset.qrCode.replace(/[^a-zA-Z0-9-_]/g, '_')
      const dateStr = new Date(jobItem.workOrder.scheduledDate).toISOString().split('T')[0]
      const filename = `Report_${assetCode}_${dateStr}.pdf`

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('[api/pdf/report] error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
