import { prisma } from "@/lib/prisma";
import CleanRoomReportDemoClient from "./CleanRoomReportDemoClient";
import { notFound } from "next/navigation";

export default async function CleanRoomDemoPage() {
    // Find the most recent DONE PM JobItem to use as a base structure 
    // for rendering the PDF template correctly
    const jobItem = await prisma.jobItem.findFirst({
        where: {
            status: "DONE",
            workOrder: {
                jobType: "PM"
            }
        },
        orderBy: {
            id: "desc"
        },
        include: {
            asset: {
                include: {
                    room: true,
                },
            },
            workOrder: {
                include: {
                    site: {
                        include: {
                            client: true,
                        },
                    },
                },
            },
            technician: true,
        },
    });

    if (!jobItem) {
        return (
            <div className="p-8 text-center bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">ยังไม่มีข้อมูลสำหรับ Demo</h2>
                    <p className="text-gray-600 mb-6">
                        ระบบไม่พบรายการงานประเภท PM ที่เสร็จสมบูรณ์ (DONE) โครงร่างเอกสารจึงยังไม่สามารถแสดงผลได้
                    </p>
                    <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                        กลับหน้าแรก
                    </a>
                </div>
            </div>
        );
    }

    // We pass it to a client component to mix in localStorage data on the client side
    return <CleanRoomReportDemoClient jobItem={jobItem} />;
}

