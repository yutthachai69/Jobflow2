'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export default function Pagination({ currentPage, totalPages, totalItems, itemsPerPage }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    router.push(`?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-sm text-app-muted">
        แสดง {startItem} - {endItem} จาก {totalItems} รายการ
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-app rounded-lg hover:bg-app-card disabled:opacity-50 disabled:cursor-not-allowed text-app-body bg-app-section"
        >
          ก่อนหน้า
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
            .map((page, index, array) => {
              const prevPage = array[index - 1]
              const showEllipsis = prevPage && page - prevPage > 1
              return (
                <div key={page} className="flex items-center gap-1">
                  {showEllipsis && <span className="px-2 text-app-muted">...</span>}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-lg transition-colors ${
                      currentPage === page
                        ? 'btn-app-primary border-[var(--app-btn-primary)]'
                        : 'border-app hover:bg-app-card text-app-body bg-app-section'
                    }`}
                    aria-label={`ไปหน้า ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                </div>
              )
            })}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-app rounded-lg hover:bg-app-card disabled:opacity-50 disabled:cursor-not-allowed text-app-body bg-app-section"
          aria-label="ไปหน้าถัดไป"
        >
          ถัดไป
        </button>
      </div>
    </div>
  )
}

