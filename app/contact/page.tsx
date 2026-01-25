import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ContactForm from './ContactForm'
import AdminContactInfo from './AdminContactInfo'

export default async function ContactPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // =========================================================
  // 1. ส่วนของ ADMIN (หน้าแก้ไขข้อมูล)
  // =========================================================
  if (user.role === 'ADMIN') {
    // ดึงข้อมูลการติดต่อ (ถ้าไม่มีให้สร้าง)
    let contactInfo = await prisma.contactInfo.findFirst()

    if (!contactInfo) {
      contactInfo = await prisma.contactInfo.create({
        data: {
          email: 'support@airservice.com',
          phone: '02-XXX-XXXX',
          hours: 'จันทร์-ศุกร์ 08:00-17:00 น.',
        },
      })
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md transition-all duration-300 group mb-8"
          >
            <svg 
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium text-sm">กลับหน้าหลัก</span>
          </Link>

          {/* Header Section */}
          <div className="mb-10 pb-6 border-b border-slate-100/80">
            <div className="flex items-center gap-5">
              
              {/* Icon Container with Glow Effect */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-105 transition-all duration-300">
                  <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              {/* Text Section */}
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                  จัดการข้อมูลการติดต่อ
                </h1>
                <p className="text-slate-500 text-base font-light">
                  แก้ไขข้อมูลช่องทางการติดต่อที่แสดงให้ลูกค้าเห็นในหน้าเว็บ
                </p>
              </div>
            </div>
          </div>

          {/* Admin Contact Info Form */}
          <AdminContactInfo contactInfo={contactInfo} />
        </div>
      </div>
    )
  }

  // =========================================================
  // 2. ส่วนของ CLIENT/TECHNICIAN (หน้าฟอร์มส่งข้อความ)
  // =========================================================
  
  // ดึงข้อมูลการติดต่อ
  const contactInfo = await prisma.contactInfo.findFirst()

  // ดึงข้อมูล user จาก database
  const userFromDb = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      site: {
        include: {
          client: true
        }
      }
    }
  })

  // ดึงชื่อผู้ใช้ (fullName หรือ username)
  const userName = userFromDb?.fullName || userFromDb?.username || 'ผู้ใช้'

  // ดึงข้อมูลสถานที่ (ถ้าเป็น CLIENT)
  const userSite = userFromDb?.site
    ? {
      name: userFromDb.site.name,
      clientName: userFromDb.site.client.name,
    }
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Button (ปรับดีไซน์ใหม่) */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md transition-all duration-300 group mb-8"
        >
          <svg 
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium text-sm">กลับหน้าหลัก</span>
        </Link>

        {/* Header Section (ปรับดีไซน์ใหม่) */}
        <div className="mb-10 pb-6 border-b border-blue-100/50">
          <div className="flex items-center gap-5">
            
            {/* Icon Container (เปลี่ยนเป็นไอคอน Chat/Contact) */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {/* Icon รูปแชท/ข้อความ */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>

            {/* Text Section */}
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                ติดต่อเรา
              </h1>
              <p className="text-slate-500 text-base font-light">
                แจ้งปัญหา สอบถามข้อมูล หรือขอความช่วยเหลือจากทีมงาน
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/50">
          <ContactForm userName={userName} userSite={userSite} contactInfo={contactInfo} />
        </div>
      </div>
    </div>
  )
}