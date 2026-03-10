import { createClient } from "@/app/actions";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Tooltip from "@/app/components/Tooltip";

export default async function NewClientPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // เฉพาะ ADMIN เท่านั้นที่สามารถสร้าง Client ใหม่ได้
  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="w-full max-w-full">
        {/* Back Link */}
        <Link 
          href="/locations" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับ</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">🏢</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
              เพิ่มลูกค้าใหม่
            </h1>
          </div>
          <p className="text-gray-600 ml-15">สร้างข้อมูลองค์กรลูกค้าใหม่เพื่อจัดการสถานที่</p>
        </div>

        {/* Form */}
        <form action={createClient} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  ชื่อบริษัท/องค์กร <span className="text-red-500">*</span>
                  <Tooltip content="ชื่อบริษัทหรือองค์กรที่จะใช้แสดงในระบบและรายงาน">
                    <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                name="name"
                autoFocus
                aria-label="ชื่อบริษัท/องค์กร"
                aria-required="true"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น Grand Hotel Group, บริษัท ABC จำกัด"
              />
              <p className="mt-2 text-xs text-gray-500">
                💡 ชื่อที่จะใช้แสดงในระบบและรายงาน
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ข้อมูลติดต่อ
              </label>
              <textarea
                name="contactInfo"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white resize-none text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น&#10;โทร: 02-xxx-xxxx&#10;อีเมล: contact@example.com&#10;ที่อยู่: กรุงเทพฯ"
              />
              <p className="mt-2 text-xs text-gray-500">
                ข้อมูลสำหรับการติดต่อ (ไม่บังคับ)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">หลังจากสร้างลูกค้าแล้ว</p>
                  <p className="text-gray-600">คุณสามารถเพิ่มสถานที่ (Sites), อาคาร (Buildings), ชั้น (Floors) และห้อง (Rooms) ได้</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                aria-label="บันทึกข้อมูลลูกค้า"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95"
              >
                <span>บันทึก</span>
              </button>
              <Link
                href="/locations"
                aria-label="ยกเลิกและกลับไปหน้ารายการ"
                className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                ยกเลิก
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
