'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TechnicianNavLinks() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(path)
  }

  const linkClass = (active: boolean) =>
    active
      ? "bg-[var(--app-btn-primary)] text-[var(--app-btn-primary-text)] font-semibold"
      : "text-app-body hover:text-app-heading hover:bg-app-card"

  return (
    <>
      <Link href="/" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/") && pathname === "/")}`} aria-label="Dashboard">Dashboard</Link>
      <Link href="/technician/scan" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/technician/scan"))}`} aria-label="สแกน QR Code">สแกน QR Code</Link>
      <Link href="/technician" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/technician") && !isActive("/technician/scan"))}`} aria-label="หน้างาน">หน้างาน</Link>
      <Link href="/work-orders" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/work-orders"))}`} aria-label="ประวัติงาน">ประวัติงาน</Link>
    </>
  )
}

