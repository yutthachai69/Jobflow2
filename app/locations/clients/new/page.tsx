import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewClientForm from "./NewClientForm";

export default async function NewClientPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/locations');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="w-full max-w-full">
        <Link
          href="/locations"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับ</span>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">🏢</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
              เพิ่มลูกค้าใหม่ (พร้อมสถานที่ อาคาร ชั้น ห้อง)
            </h1>
          </div>
          <p className="text-gray-600 ml-15">กรอกข้อมูลในการ์ดเดียว แล้วกดบันทึกครั้งเดียว</p>
        </div>

        <NewClientForm />
      </div>
    </div>
  );
}
