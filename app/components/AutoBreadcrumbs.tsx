'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

// Route mapping สำหรับสร้าง breadcrumb อัตโนมัติ
const routeLabels: Record<string, string> = {
  '/': 'หน้าแรก',
  '/work-orders': 'ใบสั่งงาน',
  '/work-orders/new': 'สร้างใบสั่งงาน',
  '/assets': 'ทรัพย์สินและอุปกรณ์',
  '/assets/new': 'เพิ่มทรัพย์สิน',
  '/users': 'ผู้ใช้งาน',
  '/users/new': 'เพิ่มผู้ใช้งาน',
  '/locations': 'สถานที่',
  '/locations/clients': 'ลูกค้า',
  '/locations/clients/new': 'เพิ่มลูกค้า',
  '/locations/sites': 'สาขา',
  '/locations/sites/new': 'เพิ่มสาขา',
  '/locations/buildings': 'ตึก',
  '/locations/buildings/new': 'เพิ่มตึก',
  '/locations/floors': 'ชั้น',
  '/locations/floors/new': 'เพิ่มชั้น',
  '/locations/rooms': 'ห้อง',
  '/locations/rooms/new': 'เพิ่มห้อง',
  '/reports': 'รายงาน',
  '/reports/maintenance': 'การบำรุงรักษา',
  '/reports/repair': 'การซ่อม',
  '/technician': 'หน้างาน',
  '/technician/scan': 'สแกน QR Code',
  '/security-incidents': 'ความปลอดภัย',
  '/contact': 'ติดต่อเรา',
  '/messages': 'ข้อความ',
}

// Segment labels สำหรับแต่ละ path segment
const segmentLabels: Record<string, string> = {
  'work-orders': 'ใบสั่งงาน',
  'assets': 'ทรัพย์สินและอุปกรณ์',
  'users': 'ผู้ใช้งาน',
  'locations': 'สถานที่',
  'client': 'รายงาน',
  'pm-plan': 'แผน PM ประจำปี',
  'clients': 'ลูกค้า',
  'sites': 'สาขา',
  'buildings': 'ตึก',
  'floors': 'ชั้น',
  'rooms': 'ห้อง',
  'reports': 'รายงาน',
  'maintenance': 'การบำรุงรักษา',
  'repair': 'การซ่อม',
  'install': 'การติดตั้ง',
  'airborne-infection': 'รายงาน Clean Room & Airborne',
  'technician': 'หน้างาน',
  'scan': 'สแกน QR Code',
  'job-item': 'รายละเอียดงาน',
  'work-order': 'รายละเอียดใบสั่งงาน',
  'security-incidents': 'ความปลอดภัย',
  'contact': 'ติดต่อเรา',
  'messages': 'ข้อความ',
  'new': 'เพิ่มใหม่',
  'edit': 'แก้ไข',
}

export default function AutoBreadcrumbs() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ถ้ายังไม่ mount (อยู่ฝั่ง server) หรือเป็นหน้าไม่มี breadcrumb, คืนค่า placeholder (หรือ null) เปล่าๆ ออกไปก่อน
  if (!mounted) return null

  // ไม่แสดง breadcrumb บนหน้า welcome/login
  if (pathname === '/welcome' || pathname === '/login') {
    return null
  }

  // ไม่แสดง AutoBreadcrumbs บนหน้าที่จัดการ breadcrumb เอง (Duplicate Issue)
  // - Asset Detail: /assets/[id] (ยกเว้น /assets/new)
  // - Work Order Detail: /work-orders/[id] (ยกเว้น /work-orders/new)
  if (/^\/(assets|work-orders)\/(?!new$)[^/]+$/.test(pathname)) {
    return null
  }

  // แผน PM แอดมิน: แต่ละหน้ามี <Breadcrumbs /> ภาษาไทยอยู่แล้ว — ไม่ให้ซ้ำกับเส้นทาง admin / pm-planning / …
  if (pathname.startsWith('/admin/pm-planning')) {
    return null
  }

  // สร้าง breadcrumb items จาก pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = []

    // เริ่มต้นด้วย หน้าแรก เสมอ
    items.push({ label: routeLabels['/'] || 'หน้าแรก', href: '/' })

    // ถ้าเป็นหน้า root ให้ return แค่ หน้าแรก
    if (pathname === '/') {
      return items
    }

    const pathSegments = pathname.split('/').filter(Boolean)
    let currentPath = ''

    // รายงานแบบ /reports/[reportType]/[id] ไม่แสดง segment ประเภทรายงาน (แสดงแค่ หน้าแรก / รายงาน / รายละเอียด)
    const isReportDetailPage = pathSegments[0] === 'reports' && pathSegments.length === 3 && /^[a-zA-Z0-9-]{20,}$/.test(pathSegments[2])

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      currentPath += `/${segment}`

      // ตรวจสอบว่าเป็น dynamic route (ID) หรือไม่ (รองรับ UUID และ CUID - 20+ chars, alphanumeric)
      const isDynamicId = /^[a-zA-Z0-9-]{20,}$/.test(segment)
      const isLast = i === pathSegments.length - 1

      // ข้าม segment ประเภทรายงาน (airborne-infection, install, ฯลฯ) เมื่ออยู่หน้ารายละเอียดรายงาน
      if (isReportDetailPage && i === 1) continue

      if (isDynamicId) {
        // สำหรับ dynamic routes (เช่น [id]) ให้ใช้ parent route label
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
        // หน้ารายละเอียดรายงาน: parent ที่แสดงคือ /reports ไม่ใช่ /reports/airborne-infection
        const effectiveParentPath = isReportDetailPage ? '/reports' : parentPath
        const parentLabel = routeLabels[effectiveParentPath] || segmentLabels[pathSegments[i - 1]] || 'รายละเอียด'

        // เพิ่ม parent route ถ้ายังไม่มี
        if (i > 0 && !items.some(item => item.href === effectiveParentPath)) {
          items.push({ label: parentLabel, href: effectiveParentPath })
        }

        // ถ้า parent มีคำว่า "รายละเอียด" อยู่แล้ว (เช่น รายละเอียดงาน, รายละเอียดใบสั่งงาน) ไม่เพิ่ม "รายละเอียด" ซ้ำ
        const parentAlreadyHasDetail = /รายละเอียด/.test(parentLabel)
        if (!parentAlreadyHasDetail) {
          if (!isLast) {
            const nextSegment = pathSegments[i + 1]
            if (nextSegment === 'edit') {
              items.push({ label: 'แก้ไข', href: undefined })
            } else {
              items.push({ label: 'รายละเอียด', href: undefined })
            }
          } else {
            items.push({ label: 'รายละเอียด', href: undefined })
          }
        }
      } else {
        // สำหรับ static routes
        const label = routeLabels[currentPath] || segmentLabels[segment] || segment

        // ตรวจสอบว่ามี parent route หรือไม่ (เช่น /reports/maintenance -> /reports)
        if (i > 0) {
          const parentPath = `/${pathSegments[i - 1]}`
          const parentLabel = routeLabels[parentPath]

          // เพิ่ม parent route ถ้ายังไม่มีและเป็น child route
          if (parentLabel && !items.some(item => item.href === parentPath)) {
            // ตรวจสอบว่าเป็น child route จริงๆ (เช่น /reports/maintenance)
            if (routeLabels[currentPath] && parentPath !== '/') {
              items.push({ label: parentLabel, href: parentPath })
            }
          }
        }

        items.push({
          label: label,
          href: isLast ? undefined : currentPath
        })
      }
    }

    return items
  }

  const items = generateBreadcrumbs()

  // ถ้ามีแค่ Dashboard ให้ไม่แสดง
  if (items.length <= 1) {
    return null
  }

  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm flex-wrap">
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
