'use client'

interface Props {
  rows?: number
  columns?: number
}

export default function SkeletonLoader({ rows = 5, columns = 4 }: Props) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 rounded flex-1"
              style={{ width: `${100 / columns}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

