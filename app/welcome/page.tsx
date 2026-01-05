import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ยินดีต้อนรับ - AirService Enterprise",
  description: "ระบบบริหารจัดการงานบริการแอร์ระดับองค์กร - ครบครัน ทันสมัย และใช้งานง่าย",
  openGraph: {
    title: "ยินดีต้อนรับ - AirService Enterprise",
    description: "ระบบบริหารจัดการงานบริการแอร์ระดับองค์กร - ครบครัน ทันสมัย และใช้งานง่าย",
    type: "website",
  },
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative flex flex-col">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center w-full">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              AirService Enterprise
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              ระบบบริหารจัดการงานบริการแอร์ระดับองค์กร
              <br />
              <span className="text-base text-gray-500">ครบครัน ทันสมัย และใช้งานง่าย</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/login"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:scale-105 font-semibold text-lg transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">เข้าสู่ระบบ</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/"
                className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white hover:shadow-lg hover:scale-105 font-semibold text-lg border border-gray-200 transition-all duration-300"
              >
                ดู Dashboard Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 space-y-2 py-8 mt-auto">
        <p className="text-sm">© 2024 AirService Enterprise. All rights reserved.</p>
        <p className="text-xs">
          ระบบจัดการงานบริการแอร์สำหรับองค์กร
        </p>
      </div>
    </div>
  );
}
