import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SurveyForm from './SurveyForm'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'

interface Props {
  params: Promise<{ workOrderId: string }>
}

export default async function SurveyPage({ params }: Props) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'CLIENT') {
    redirect('/login')
  }

  const { workOrderId } = await params

  // ดึง work order และตรวจสอบว่าเป็นของ CLIENT นี้หรือไม่
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      site: {
        include: {
          users: {
            where: { id: user.userId },
          },
        },
      },
      jobItems: {
        where: {
          status: 'DONE',
        },
        include: {
          asset: true,
        },
      },
      feedbacks: {
        where: {
          clientId: user.userId,
        },
      },
    },
  })

  if (!workOrder) {
    redirect('/')
  }

  // ตรวจสอบว่า CLIENT นี้เป็นเจ้าของ site หรือไม่
  if (workOrder.site.users.length === 0) {
    redirect('/')
  }

  // ตรวจสอบว่ามีงานที่เสร็จแล้วหรือไม่
  if (workOrder.jobItems.length === 0) {
    redirect('/')
  }

  // ตรวจสอบว่ามี feedback แล้วหรือยัง
  const hasFeedback = workOrder.feedbacks.length > 0

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-app-card rounded-lg shadow-lg border border-app p-6 md:p-8">
          <h1 className="text-2xl font-bold text-app-heading mb-2">
            📋 แบบสำรวจความพึงพอใจ
          </h1>
          <p className="text-app-muted mb-6">
            งานเลขที่ {getWorkOrderDisplayNumber(workOrder)} เสร็จสมบูรณ์แล้ว กรุณาให้คะแนนความพึงพอใจ
          </p>

          {hasFeedback ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-green-800 dark:text-green-200">
                ✅ คุณได้ส่งแบบสำรวจความพึงพอใจแล้ว ขอบคุณสำหรับความคิดเห็น
              </p>
            </div>
          ) : (
            <SurveyForm workOrderId={workOrderId} />
          )}
        </div>
      </div>
    </div>
  )
}
