'use client'

import { useState } from 'react'
import { processApproval } from '@/app/actions/approval' // We will create this next
import { useRouter } from 'next/navigation'

export default function ApprovalActions({ workOrderId, token }: { workOrderId: string, token: string }) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [showRejectInput, setShowRejectInput] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const router = useRouter()

    const handleApprove = async () => {
        if (!confirm('ยืนยันการอนุมัติงานซ่อมนี้? (Confirm Approval)')) return

        setIsProcessing(true)
        try {
            const result = await processApproval(token, 'APPROVE')
            if (result.success) {
                // Success UI handled by page refresh (server component will render success state)
                router.refresh()
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.error)
                setIsProcessing(false)
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
            setIsProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ')
            return
        }

        if (!confirm('ยืนยันการปฏิเสธงานซ่อมนี้?')) return

        setIsProcessing(true)
        try {
            const result = await processApproval(token, 'REJECT', rejectReason)
            if (result.success) {
                router.refresh()
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.error)
                setIsProcessing(false)
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-4">
            {!showRejectInput ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reject Button Triggers Input View */}
                    <button
                        onClick={() => setShowRejectInput(true)}
                        disabled={isProcessing}
                        className="px-6 py-4 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                    >
                        ไม่อนุมัติ (Reject)
                    </button>

                    {/* Approve Button Directly Actions */}
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="px-6 py-4 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all disabled:opacity-50 transform hover:-translate-y-1"
                    >
                        {isProcessing ? 'กำลังประมวลผล...' : '✅ อนุมัติซ่อม (Approve)'}
                    </button>
                </div>
            ) : (
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 animate-[fadeIn_0.2s_ease-out]">
                    <h3 className="text-red-800 font-bold mb-3">ระบุเหตุผลที่ไม่อนุมัติ (Reason for Rejection)</h3>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full border border-red-200 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
                        placeholder="เช่น ยังไม่มีงบประมาณ, รอพิจารณาใหม่..."
                        rows={3}
                    />
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowRejectInput(false)}
                            disabled={isProcessing}
                            className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={isProcessing}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 shadow-md shadow-red-200"
                        >
                            ยืนยันไม่อนุมัติ
                        </button>
                    </div>
                </div>
            )}

            <p className="text-center text-gray-400 text-xs text-balance">
                เมื่อกดอนุมัติแล้ว ระบบจะแจ้งเตือนไปยังช่างเพื่อเริ่มดำเนินการทันที
            </p>
        </div>
    )
}
