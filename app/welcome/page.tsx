import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import SnowfallEffect from "@/app/components/SnowfallEffect";

export const metadata: Metadata = {
  // title: "ยินดีต้อนรับ - ระบบบริหารจัดการงานบริการเครื่องปรับอากาศ by Flomac",
  title: "ยินดีต้อนรับ - ระบบบริหารจัดการงานบริการเครื่องปรับอากาศ by LMT air service",
  description: "ระบบจัดการงานซ่อมแอร์ บำรุงรักษา และติดตั้ง สำหรับทีมช่างและลูกค้า",
  openGraph: {
    title: "LMT air service - จัดการงานแอร์ครบวงจร",
    description: "ระบบจัดการงานซ่อมแอร์ บำรุงรักษา และติดตั้ง สำหรับทีมช่างและลูกค้า",
    type: "website",
  },
};

export default function WelcomePage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden font-sans" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* ❄️ Snowfall Effect */}
      <SnowfallEffect />

      {/* Animated gradient layer */}
      <div
        className="absolute inset-0 opacity-[0.3] animate-bg-gradient pointer-events-none"
        style={{
          background: "linear-gradient(120deg, var(--app-section) 0%, var(--app-card) 25%, var(--app-section) 50%, var(--app-card) 75%, var(--app-section) 100%)",
        }}
      />
      {/* --- Background orbs --- */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>
      <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse-slow delay-700" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow delay-1000" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 z-10">
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="text-center w-full">

            {/* Hero Section */}
            <div className="mb-16 opacity-0 animate-fade-in-up flex flex-col items-center">

              {/* 1. โลโก้ขนาดใหญ่พิเศษ */}
              <Link href="/" className="inline-block mb-8 transition-transform hover:scale-105 duration-300 relative group">
                {/* Glow Effect ด้านหลังโลโก้ */}
                <div className="absolute inset-0 blur-3xl rounded-full scale-90 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: 'var(--app-btn-primary-glow)' }}></div>

                <Image
                  src="/L.M.T.png"
                  alt="LMT air service Logo"
                  width={700}
                  height={300}
                  /* ปรับปรุง: เอา -mb-4 และ -mb-6 ออก เพื่อไม่ให้โลโก้เหินลงไปทับข้อความ */
                  className="h-48 md:h-72 w-auto object-contain object-top mx-auto relative z-10 drop-shadow-2xl filter"
                  priority
                  unoptimized
                />
              </Link>

              {/* 2. ชื่อบริษัท */}
              <h2 className="text-xl md:text-2xl font-bold mb-2 tracking-wide uppercase -mt-4 md:-mt-6" style={{ color: 'var(--app-text-heading)' }}>
                LMT air service
              </h2>
              <div className="h-1 w-20 rounded-full mb-8 mx-auto shadow-sm" style={{ background: 'var(--app-btn-primary)' }}></div>

              {/* 3. ชื่อระบบ */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 tracking-tight leading-tight drop-shadow-sm" style={{ color: 'var(--app-text-heading)' }}>
                ระบบบริหารจัดการงานบริการเครื่องปรับอากาศ
              </h1>

              {/* 4. คำบรรยาย */}
              <p className="text-base md:text-lg mb-4 max-w-4xl mx-auto leading-relaxed font-medium" style={{ color: 'var(--app-text-body)' }}>
                จัดการงานซ่อม บำรุง และติดตั้งแอร์ ง่าย ครบ จบในที่เดียว
              </p>
              <p className="text-sm md:text-base max-w-3xl mx-auto font-light" style={{ color: 'var(--app-text-muted)' }}>
                เปิดใบสั่งงาน ติดตามสถานะ ดูประวัติการซ่อม ได้ทุกที่ ทุกเวลา
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
              {/* Feature 1 */}
              <div className="group opacity-0 backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden animate-card-enter delay-300" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 mx-auto shadow-lg relative z-10 transition-transform duration-300" style={{ backgroundColor: '#1a1a1a' }}>
                  <video
                    src="/task-management.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10" style={{ color: 'var(--app-text-heading)' }}>ดูแลเครื่องแอร์ทุกตัว</h3>
                <p className="leading-relaxed relative z-10" style={{ color: 'var(--app-text-body)' }}>เช็คสถานะและดูประวัติการซ่อมของเครื่องแอร์ทุกตัวได้ในที่เดียว</p>
              </div>

              {/* Feature 2 */}
              <div className="group opacity-0 backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden animate-card-enter delay-400" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 mx-auto shadow-lg relative z-10 transition-transform duration-300" style={{ backgroundColor: '#1a1a1a' }}>
                  <video
                    src="/work-list.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10" style={{ color: 'var(--app-text-heading)' }}>เปิดใบสั่งงานง่ายๆ</h3>
                <p className="leading-relaxed relative z-10" style={{ color: 'var(--app-text-body)' }}>สั่งงานซ่อม บำรุง ติดตั้ง แล้วติดตามสถานะได้ทันที</p>
              </div>

              {/* Feature 3 */}
              <div className="motion-enter group opacity-0 backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden animate-card-enter delay-500" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 mx-auto shadow-lg relative z-10 transition-transform duration-300" style={{ backgroundColor: '#1a1a1a' }}>
                  <video
                    src="/qr-code.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10" style={{ color: 'var(--app-text-heading)' }}>สแกน QR Code</h3>
                <p className="leading-relaxed relative z-10" style={{ color: 'var(--app-text-body)' }}>แค่สแกนก็เห็นข้อมูลเครื่องแอร์ พร้อมประวัติการซ่อมทั้งหมด</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="motion-enter flex justify-center opacity-0 animate-fade-in-up delay-200">
              <Link
                href="/login"
                className="group relative px-12 py-5 text-white rounded-full hover:shadow-2xl hover:scale-[1.02] font-bold text-xl transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: 'var(--app-btn-primary)',
                  boxShadow: '0 0 20px var(--app-btn-primary-glow)',
                }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <span>เข้าสู่ระบบ</span>
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-white/20"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Footer */}
      <footer className="border-t backdrop-blur-sm z-10" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-section)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start space-x-6 md:order-2">
              <span className="transition-colors cursor-pointer text-sm hover:opacity-80" style={{ color: 'var(--app-text-muted)' }}>
                Privacy Policy
              </span>
              <span className="transition-colors cursor-pointer text-sm hover:opacity-80" style={{ color: 'var(--app-text-muted)' }}>
                Terms of Service
              </span>
              <span className="transition-colors cursor-pointer text-sm hover:opacity-80" style={{ color: 'var(--app-text-muted)' }}>
                Contact Support
              </span>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center md:text-left text-sm" style={{ color: 'var(--app-text-muted)' }}>
                {/* © {currentYear} Flomac Co., Ltd. All rights reserved. */}
                © {currentYear} LMT air service. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}