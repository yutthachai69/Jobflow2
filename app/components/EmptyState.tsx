'use client'

import Link from 'next/link'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
}: EmptyStateProps) {
  const btnClass = "mt-4 inline-flex items-center px-4 py-2 btn-app-primary rounded-lg hover:shadow-md transition-all font-medium"
  const actionButton = actionLabel && (
    actionHref ? (
      <Link href={actionHref} className={btnClass}>{actionLabel}</Link>
    ) : actionOnClick ? (
      <button onClick={actionOnClick} className={btnClass}>{actionLabel}</button>
    ) : null
  )

  return (
    <div className="bg-app-card rounded-lg shadow-lg border border-app p-8 md:p-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-app-section">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-app-heading mb-2">{title}</h3>
      <p className="text-app-muted text-sm md:text-base max-w-md mx-auto">{description}</p>
      {actionButton}
    </div>
  )
}



