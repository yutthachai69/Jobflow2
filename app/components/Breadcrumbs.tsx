'use client'

import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-app-muted" aria-hidden="true">
                  /
                </span>
              )}
              {isLast ? (
                <span className="text-app-heading font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-app-body hover:text-app-heading transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-app-body">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}



