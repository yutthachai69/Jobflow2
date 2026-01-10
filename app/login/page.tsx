import Link from "next/link";
import LoginForm from "./LoginForm";
import SetupDatabaseButton from "./SetupDatabaseButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ - AirService Enterprise",
  description: "เข้าสู่ระบบ AirService Enterprise - ระบบบริหารจัดการงานบริการแอร์",
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
            AirService Enterprise
          </h1>
          <p className="text-gray-500">เข้าสู่ระบบ</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Messages from URL */}
          {error === 'locked' && message && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">บัญชีถูกล็อก</p>
              <p className="text-sm text-red-600 mt-1">{decodeURIComponent(message)}</p>
            </div>
          )}
          {error === 'rate_limit' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 font-medium">พยายามเข้าสู่ระบบมากเกินไป</p>
              <p className="text-sm text-yellow-700 mt-1">
                กรุณารอ {retryAfter ? `${Math.ceil(parseInt(retryAfter) / 60)} นาที` : '15 นาที'} ก่อนลองใหม่
              </p>
            </div>
          )}
          {error === 'invalid' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</p>
            </div>
          )}
          {error === 'missing' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">กรุณากรอกชื่อผู้ใช้และรหัสผ่าน</p>
            </div>
          )}
          {error === 'database' && <SetupDatabaseButton />}
          {error === 'server' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">⚠️ เกิดข้อผิดพลาดของเซิร์ฟเวอร์</p>
              <p className="text-sm text-red-600 mt-1">กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
            </div>
          )}
          
          <LoginForm />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              ไม่มีบัญชี?{" "}
              <span className="text-gray-400">
                กรุณาติดต่อ Admin เพื่อสร้างบัญชี
              </span>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/welcome"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:gap-3 transition-all duration-200"
            >
              <span>←</span>
              <span>กลับหน้าแรก</span>
            </Link>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧪</span>
            <p className="text-sm font-semibold text-blue-900">
              บัญชีทดสอบ
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-800 bg-white/40 rounded-lg px-3 py-2">
              <span className="font-semibold min-w-16">Admin:</span>
              <span className="text-gray-700">admin / admin123</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800 bg-white/40 rounded-lg px-3 py-2">
              <span className="font-semibold min-w-16">ช่าง:</span>
              <span className="text-gray-700">tech1 / password123</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800 bg-white/40 rounded-lg px-3 py-2">
              <span className="font-semibold min-w-16">ลูกค้า:</span>
              <span className="text-gray-700">client1 / client123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
