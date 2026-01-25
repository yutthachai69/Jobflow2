'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function ViewTransitionHandler() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Enable View Transitions API if supported
    if (typeof document === 'undefined' || !('startViewTransition' in document)) {
      return
    }

    // Handle all link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      
      if (!anchor) return
      
      // Skip if:
      // - External links
      // - Links with target="_blank"
      // - Links with download attribute
      // - Hash links
      // - mailto/tel links
      if (
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        anchor.href.startsWith('#') ||
        anchor.href.startsWith('mailto:') ||
        anchor.href.startsWith('tel:') ||
        (anchor.href.startsWith('http') && !anchor.href.startsWith(window.location.origin))
      ) {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || href === pathname) return

      // Prevent default navigation
      e.preventDefault()

      // Use View Transition API
      const transition = (document as any).startViewTransition(() => {
        router.push(href)
      })

      // Fallback if transition fails
      transition.finished.catch(() => {
        router.push(href)
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [pathname, router])

  return null
}
