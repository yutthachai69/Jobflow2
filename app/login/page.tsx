import Link from "next/link";
import Image from "next/image";
import LoginForm from "./LoginForm";
import SetupDatabaseButton from "./SetupDatabaseButton";
import type { Metadata } from "next";
import SnowfallEffect from "@/app/components/SnowfallEffect";

export const metadata: Metadata = {
  // title: "เข้าสู่ระบบ - Flomac Service",
  // description: "เข้าสู่ระบบ Flomac Service - ระบบบริหารจัดการงานบริการแอร์",
  title: "เข้าสู่ระบบ - LMT air service",
  description: "เข้าสู่ระบบ LMT air service - ระบบบริหารจัดการงานบริการแอร์",
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  searchParams: Promise<{ error?: string; message?: string; retryAfter?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const { error, message, retryAfter } = params;
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-sans" style={{ backgroundColor: 'var(--app-bg)' }}>

      {/* ❄️ Snowfall Effect */}
      <SnowfallEffect />

      {/* Animated gradient layer */}
      <div
        className="absolute inset-0 opacity-[0.3] animate-bg-gradient pointer-events-none"
        style={{
          background: "linear-gradient(120deg, var(--app-section) 0%, var(--app-card) 25%, var(--app-section) 50%, var(--app-card) 75%, var(--app-section) 100%)",
        }}
      />
      {/* Background orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>
      <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse-slow delay-700" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow delay-1000" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="max-w-md w-full">

          {/* Header Section (เหลือแค่ Logo + ชื่อบริษัท) */}
          <div className="motion-enter text-center mb-10 opacity-0 animate-fade-in-up flex flex-col items-center">
            <Link href="/welcome" className="inline-block mb-6 transition-transform hover:scale-105 duration-300 relative group">
              <div className="absolute inset-0 blur-3xl rounded-full scale-90 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: 'var(--app-btn-primary-glow)' }}></div>
              <Image
                src="/L.M.T.png"
                alt="LMT air service Logo"
                width={600}
                height={250}
                className="h-40 md:h-56 w-auto object-contain mx-auto relative z-10 drop-shadow-2xl filter"
                priority
                unoptimized
              />
            </Link>

            {/* แก้ไขตรงนี้: เอา -mt ออก และเพิ่มระยะห่างแทน */}
            <div className="relative z-18 mt-4 md:mt-6">
              <h2 className="text-xl md:text-2xl font-black tracking-wide uppercase mb-3" style={{ color: 'var(--app-text-heading)' }}>
                LMT air service
              </h2>
              <div className="h-1 w-20 rounded-full mx-auto shadow-sm" style={{ background: 'var(--app-btn-primary)' }}></div>
            </div>
          </div>

          {/* Login Form Container */}
          <div className="motion-enter opacity-0 animate-card-enter delay-150 backdrop-blur-md rounded-2xl shadow-xl p-8 relative overflow-hidden" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-border)', borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 rounded-full opacity-30" style={{ backgroundColor: 'var(--app-btn-primary)' }}></div>

            {/* ✅ ย้ายหัวข้อเข้ามาข้างในนี้แล้ว */}
            <div className="text-center mb-6 relative z-10">
              <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--app-text-heading)' }}>
                เข้าสู่ระบบ
              </h1>
              <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                ระบบบริหารจัดการงานบริการเครื่องปรับอากาศ
              </p>
            </div>

            {/* Error Messages */}
            {error === 'locked' && message && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl relative z-10">
                <p className="text-sm text-red-600 font-medium">บัญชีถูกล็อก</p>
                <p className="text-sm text-red-600 mt-1">{decodeURIComponent(message)}</p>
              </div>
            )}
            {error === 'rate_limit' && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl relative z-10">
                <p className="text-sm text-yellow-800 font-medium">พยายามเข้าสู่ระบบมากเกินไป</p>
                <p className="text-sm text-yellow-700 mt-1">
                  กรุณารอ {retryAfter ? `${Math.ceil(parseInt(retryAfter) / 60)} นาที` : '15 นาที'} ก่อนลองใหม่
                </p>
              </div>
            )}
            {error === 'invalid' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl relative z-10">
                <p className="text-sm text-red-600">ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</p>
              </div>
            )}
            {error === 'missing' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl relative z-10">
                <p className="text-sm text-red-600">กรุณากรอกชื่อผู้ใช้และรหัสผ่าน</p>
              </div>
            )}
            {error === 'database' && <div className="relative z-10"><SetupDatabaseButton /></div>}
            {error === 'server' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl relative z-10">
                <p className="text-sm text-red-600 font-medium">⚠️ เกิดข้อผิดพลาดของเซิร์ฟเวอร์</p>
                <p className="text-sm text-red-600 mt-1">
                  {message ? decodeURIComponent(message) : 'กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ'}
                </p>
                <p className="text-xs text-red-500 mt-2">
                  💡 ตรวจสอบว่า database server รันอยู่และสามารถเข้าถึงได้
                </p>
              </div>
            )}

            <div className="relative z-10">
              <LoginForm />
            </div>

            <div className="mt-6 pt-6 relative z-10" style={{ borderTopColor: 'var(--app-border)', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
              <p className="text-sm text-center" style={{ color: 'var(--app-text-body)' }}>
                ไม่มีบัญชี?{" "}
                <span style={{ color: 'var(--app-text-muted)' }}>
                  กรุณาติดต่อ Admin เพื่อสร้างบัญชี
                </span>
              </p>
            </div>

            <div className="mt-4 text-center relative z-10">
              <Link
                href="/welcome"
                className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg px-2 py-1 -m-1 hover:opacity-80"
                style={{ color: 'var(--app-btn-primary)' }}
              >
                <span>←</span>
                <span>กลับหน้าแรก</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 backdrop-blur-sm" style={{ borderTopColor: 'var(--app-border)', borderTopWidth: '1px', borderTopStyle: 'solid', backgroundColor: 'var(--app-section)' }}>
        <div className="w-full max-w-full px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm" style={{ color: 'var(--app-text-muted)' }}>

          {/* Copyright ฝั่งซ้าย */}
          <div className="order-2 md:order-1 text-center md:text-left">
            © {currentYear} LMT air service. All rights reserved.
          </div>

          {/* ส่วนติดต่อแอดมิน ฝั่งขวา */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 order-1 md:order-2">

            {/* Facebook - เปิดหน้าโปรไฟล์ใหม่ */}
            <a
              href="https://www.facebook.com/yutthachai.kummeephak.2025/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-blue-500"
            >
              <span className="font-medium">Facebook</span>
            </a>

            {/* Email - กดแล้วเด้งไปหน้าส่งเมล์ */}
            <a
              href="mailto:firsaza4455@gmail.com"
              className="flex items-center gap-2 transition-colors hover:text-red-400"
            >
              <span className="font-medium">firsaza4455@gmail.com</span>
            </a>

            {/* Phone - กดแล้วโทรออกได้ทันที (บนมือถือ) */}
            <a
              href="tel:0828310466"
              className="flex items-center gap-2 transition-colors hover:text-green-500"
            >
              <span className="font-medium text-app-heading">082-831-0466</span>
            </a>

          </div>
        </div>
      </footer>

    </div>
  );
}