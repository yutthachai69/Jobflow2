import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ApprovalActions from './ApprovalActions' // Client component for buttons

export default async function CustomerApprovalPage({ params }: { params: { token: string } }) {
    // 1. Validate Token
    const workOrder = await prisma.workOrder.findUnique({
        where: { approvalToken: params.token },
        include: {
            asset: {
                include: {
                    site: true,
                    room: { include: { floor: { include: { building: true } } } }
                }
            },
            jobItems: {
                include: {
                    photos: true // Include photos to show to customer
                }
            },
            site: true
        }
    })

    // 2. Handle Invalid/Used Token
    if (!workOrder) {
        return notFound()
    }

    // 3. Format Strings
    const assetLocation = `${workOrder.asset.room.name} (${workOrder.asset.room.floor.building.name})`
    const isPending = workOrder.status === 'WAITING_APPROVAL'

    // Determine status color/text
    let statusBadge
    if (workOrder.status === 'APPROVED') {
        statusBadge = <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">อนุมัติแล้ว (Approved)</span>
    } else if (workOrder.status === 'REJECTED') {
        statusBadge = <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">ไม่อนุมัติ (Rejected)</span>
    } else if (workOrder.status === 'WAITING_APPROVAL') {
        statusBadge = <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold animate-pulse">รออนุมัติ (Waiting Approval)</span>
    } else {
        statusBadge = <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{workOrder.status}</span>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-[#2c3e50] text-white p-6 tex-center md:text-left md:flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">ใบขออนุมัติงานซ่อม (Repair Request)</h1>
                        <p className="text-gray-300 text-sm mt-1">เลขที่: {workOrder.workOrderNumber || 'N/A'}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        {statusBadge}
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">

                    {/* Asset Details */}
                    <section className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <h2 className="text-blue-800 font-bold mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            ข้อมูลทรัพย์สิน (Asset)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs uppercase">รหัสทรัพย์สิน</p>
                                <p className="font-semibold text-gray-900">{workOrder.asset.qrCode}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase">ชื่อรายการ</p>
                                <p className="font-semibold text-gray-900">{workOrder.asset.brand} - {workOrder.asset.model}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-gray-500 text-xs uppercase">สถานที่ติดตั้ง</p>
                                <p className="font-semibold text-gray-900">{assetLocation}</p>
                                <p className="text-gray-500 mt-1 text-xs">{workOrder.site.name}</p>
                            </div>
                        </div>
                    </section>

                    {/* Issue Description */}
                    <section>
                        <h2 className="text-gray-800 font-bold mb-4 border-b pb-2">รายละเอียดปัญหา (Issue Description)</h2>
                        <div className="text-gray-700 bg-gray-50 p-4 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
                            {workOrder.jobItems[0]?.techNote || workOrder.jobItems[0]?.checklist || '- ไม่มีรายละเอียด -'}
                        </div>

                        {/* Photos Carousel/Grid */}
                        {workOrder.jobItems[0]?.photos?.length > 0 && (
                            <div className="mt-4">
                                <p className="text-gray-500 text-xs mb-2">รูปภาพประกอบ (Photos)</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {workOrder.jobItems[0].photos.map(photo => (
                                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border">
                                            <Image
                                                src={photo.url}
                                                alt="Defect Photo"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Approval Actions Area */}
                    {isPending ? (
                        <div className="pt-6 border-t">
                            <ApprovalActions workOrderId={workOrder.id} token={params.token} />
                        </div>
                    ) : (
                        <div className="pt-6 border-t text-center p-8 bg-gray-50 rounded-xl">
                            <div className="text-5xl mb-4">
                                {workOrder.status === 'APPROVED' ? '✅' : '❌'}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {workOrder.status === 'APPROVED' ? 'อนุมัติเรียบร้อยแล้ว' : 'ไม่อนุมัติ / ปฏิเสธงานซ่อม'}
                            </h3>
                            <p className="text-gray-500 mt-2">
                                ดำเนินการเมื่อ: {workOrder.approvedAt?.toLocaleString('th-TH') || workOrder.rejectedAt?.toLocaleString('th-TH')}
                            </p>
                            {workOrder.rejectionReason && (
                                <p className="text-red-500 mt-4 bg-red-50 p-3 rounded text-sm">
                                    เหตุผล: {workOrder.rejectionReason}
                                </p>
                            )}
                        </div>
                    )}

                </div>
            </div>

            <footer className="text-center text-gray-400 text-xs mt-8">
                Powered by LMT Air Service
            </footer>
        </div>
    )
}
