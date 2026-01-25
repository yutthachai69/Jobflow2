export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import WorkOrderForm from "./WorkOrderForm";

export default async function NewWorkOrderPage() {
  const sites = await prisma.site.findMany({
    include: {
      client: true,
      buildings: {
        include: {
          floors: {
            include: {
              rooms: {
                include: {
                  assets: {
                    where: { status: 'ACTIVE' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/work-orders" 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white/70 text-gray-600 text-sm hover:bg-gray-100 hover:text-blue-600 shadow-sm mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับไปหน้ารายการ</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">📋</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              สร้างใบสั่งงานใหม่
            </h1>
          </div>
          <p className="text-gray-600 ml-15">กำหนดรายละเอียดและเลือกเครื่องที่ต้องการบำรุงรักษา</p>
        </div>

        <WorkOrderForm sites={sites} />
      </div>
    </div>
  );
}