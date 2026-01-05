'use client'

interface Props {
  rows?: number
  columns?: number
}

export default function TableSkeleton({ rows = 5, columns = 5 }: Props) {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 uppercase font-medium border-b">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

