import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import EmptyState from '@/app/components/EmptyState'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'

export default async function SurveyPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'CLIENT') {
    redirect('/login')
  }

  // ดึง work orders ที่เสร็จแล้วและยังไม่มี feedback
  const workOrders = await prisma.workOrder.findMany({
    where: {
      site: {
        users: {
          some: {
            id: user.userId,
          },
        },
      },
      status: 'COMPLETED',
      jobItems: {
        every: {
          status: 'DONE',
        },
      },
    },
    include: {
      site: true,
      jobItems: {
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
    orderBy: {
      updatedAt: 'desc',
    },
  })

  // กรองเฉพาะ work orders ที่ยังไม่มี feedback
  const pendingSurveys = workOrders.filter((wo) => wo.feedbacks.length === 0)
  const completedSurveys = workOrders.filter((wo) => wo.feedbacks.length > 0)

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-app-heading mb-2">
            📋 แบบสำรวจความพึงพอใจ
          </h1>
          <p className="text-app-muted">
            กรุณาให้คะแนนความพึงพอใจสำหรับงานที่เสร็จสมบูรณ์แล้ว
          </p>
        </div>

        {/* Pending Surveys */}
        {pendingSurveys.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-app-heading mb-4">
              รอการให้คะแนน ({pendingSurveys.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingSurveys.map((workOrder) => {
                const assetCount = workOrder.jobItems.length
                const workOrderId = getWorkOrderDisplayNumber(workOrder)

                return (
                  <Link
                    key={workOrder.id}
                    href={`/survey/${workOrder.id}`}
                    className="bg-app-card rounded-lg border border-app p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-app-heading mb-1">
                          งานเลขที่ {workOrderId}
                        </h3>
                        <p className="text-sm text-app-muted">
                          {workOrder.site.name}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                        รอให้คะแนน
                      </span>
                    </div>
                    <div className="text-sm text-app-body">
                      <p>จำนวนทรัพย์สิน: {assetCount} รายการ</p>
                      <p className="text-app-muted mt-1">
                        เสร็จเมื่อ:{' '}
                        {new Date(workOrder.updatedAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-app-border">
                      <span className="text-sm font-medium text-[var(--app-btn-primary)]">
                        คลิกเพื่อให้คะแนน →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed Surveys */}
        {completedSurveys.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-app-heading mb-4">
              ให้คะแนนแล้ว ({completedSurveys.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedSurveys.map((workOrder) => {
                const feedback = workOrder.feedbacks[0]
                const workOrderId = getWorkOrderDisplayNumber(workOrder)

                return (
                  <div
                    key={workOrder.id}
                    className="bg-app-card rounded-lg border border-app p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-app-heading mb-1">
                          งานเลขที่ {workOrderId}
                        </h3>
                        <p className="text-sm text-app-muted">
                          {workOrder.site.name}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                        ให้คะแนนแล้ว
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xl ${
                              star <= feedback.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-app-body">
                          {feedback.rating}/5
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-app-muted mt-2 line-clamp-2">
                          {feedback.comment}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-app-muted">
                      ให้คะแนนเมื่อ:{' '}
                      {new Date(feedback.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pendingSurveys.length === 0 && completedSurveys.length === 0 && (
          <EmptyState
            icon="📋"
            title="ยังไม่มีแบบสำรวจ"
            description="เมื่อมีงานที่เสร็จสมบูรณ์แล้ว จะแสดงแบบสำรวจความพึงพอใจที่นี่"
          />
        )}
      </div>
    </div>
  )
}
