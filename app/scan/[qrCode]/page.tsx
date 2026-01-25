import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ qrCode: string }>
}

export default async function ScanRedirectPage({ params }: Props) {
  const { qrCode } = await params
  const user = await getCurrentUser()

  // ถ้ายังไม่ login ให้ redirect ไปหน้า login พร้อม callbackUrl
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/scan/${qrCode}`)}`)
  }

  // ค้นหา Asset จาก QR Code
  const asset = await prisma.asset.findUnique({
    where: { qrCode },
    select: { id: true },
  })

  if (!asset) {
    redirect('/scan?error=not_found')
  }

  // Redirect ไปหน้า detail ของ asset
  redirect(`/assets/${asset.id}`)
}
