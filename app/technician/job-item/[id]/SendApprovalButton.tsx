'use client'

import { useState } from 'react'
import { sendForApproval } from '@/app/actions/approval'
import { useRouter } from 'next/navigation'

interface SendApprovalButtonProps {
    workOrderId: string
    status: string
    approvalToken?: string | null
}

export default function SendApprovalButton({ workOrderId, status, approvalToken }: SendApprovalButtonProps) {
    const [isSending, setIsSending] = useState(false)
    const router = useRouter()

    const handleSend = async () => {
        if (!confirm('ต้องการสร้างลิงก์อนุมัติและส่งแจ้งเตือนไปยัง LINE Admin หรือไม่?')) return

        setIsSending(true)
        try {
            const result = await sendForApproval(workOrderId)
            if (result.success) {
                alert('สร้างรายการและส่งแจ้งเตือนเรียบร้อยแล้ว!')
                router.refresh()
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
        } finally {
            setIsSending(false)
        }
    }

    const copyLink = () => {
        if (!approvalToken) return
        const url = `${window.location.origin}/approve/${approvalToken}`
        navigator.clipboard.writeText(url)
        alert('คัดลอกลิงก์แล้ว: ' + url)
    }

    // If already approved, show badge
    if (status === 'APPROVED') {
        return (
            <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-green-800">อนุมัติแล้ว (Approved)</h3>
                        <p className="text-sm text-green-600">ลูกค้าอนุมัติงานซ่อมนี้แล้ว</p>
                    </div>
                </div>
            </div>
        )
    }

    // If waiting for approval
    if (status === 'WAITING_APPROVAL') {
        return (
            <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-orange-800">รอการอนุมัติ (Waiting)</h3>
                            <p className="text-sm text-orange-600">ส่งเรื่องแล้ว รอลูกค้าตอบกลับ</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-2">
                    <button
                        onClick={copyLink}
                        className="flex-1 bg-white border border-orange-200 text-orange-700 font-medium py-2 rounded-lg text-sm hover:bg-orange-50 flex items-center justify-center gap-2"
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                    </button>
                    <a
                        href={`https://line.me/R/msg/text/?${encodeURIComponent(`รบกวนตรวจสอบและอนุมัติงานซ่อมครับ: ${typeof window !== 'undefined' ? window.location.origin : ''}/approve/${approvalToken}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#06C755] text-white font-medium py-2 rounded-lg text-sm hover:bg-[#05b34c] flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 10.1c.1-.5-.3-1.1-.8-1.1-.2 0-.4.1-.5.2-.6 1-1.5 1.7-2.6 2.1-1.3.5-2.8.8-4.3.8-3.3 0-6.1-2.9-6.1-6.1 0-1.5.3-3 1-4.2.3-.6.2-1.4-.4-1.7-.6-.3-1.2 0-1.5.5C4.7 3.5 3 6.6 3 10c0 5.5 4.5 10 10 10 3.4 0 6.5-1.7 8.4-4.4.3-.3.6-.9 1-1.2.2-.2.2-.5 0-.7-.1-.2-.3-.3-.4-.3z" opacity="0" />
                            <path d="M21.6 4.9c.2-.5 0-1.1-.5-1.3-.5-.2-1.1 0-1.3.5-.9 1.8-2.5 3.1-4.4 3.8-1.9.7-4 1-6.1.4C5.1 7 1.8 10.3 1.8 14.5c0 4.1 3.5 7.5 7.8 8l.9.1c3.2.4 6.5-.8 8.7-3.2 2.1-2.4 3.1-5.6 2.4-8.8zM19.3 16c-1.8 2-4.5 3.2-7.4 2.8-.2 0-.3 0-.5-.1-3.1-.4-5.6-2.8-5.6-5.8 0-3 2.5-5.5 5.2-6.2 1.6.4 3.2.2 4.7-.4 1.4-.5 2.6-1.5 3.3-2.8.7 2.4-.1 5.1-1.6 7.4-.3.4-.6.8-1 1.1 1.3 1.2 2.3 2.7 2.9 4z" />
                        </svg>
                        Line
                    </a>
                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="flex-1 bg-orange-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
                        type="button"
                    >
                        {isSending ? 'Sending...' : 'Resend'}
                    </button>
                </div>
            </div>
        )
    }

    // Default: Send Button
    return (
        <div className="w-full">
            <button
                onClick={handleSend}
                disabled={isSending}
                className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white p-4 rounded-xl shadow-lg shadow-green-100 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                type="button"
            >
                {isSending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22 10.1c.1-.5-.3-1.1-.8-1.1-.2 0-.4.1-.5.2-.6 1-1.5 1.7-2.6 2.1-1.3.5-2.8.8-4.3.8-3.3 0-6.1-2.9-6.1-6.1 0-1.5.3-3 1-4.2.3-.6.2-1.4-.4-1.7-.6-.3-1.2 0-1.5.5C4.7 3.5 3 6.6 3 10c0 5.5 4.5 10 10 10 3.4 0 6.5-1.7 8.4-4.4.3-.3.6-.9 1-1.2.2-.2.2-.5 0-.7-.1-.2-.3-.3-.4-.3z" opacity="0" />
                        <path d="M21.6 4.9c.2-.5 0-1.1-.5-1.3-.5-.2-1.1 0-1.3.5-.9 1.8-2.5 3.1-4.4 3.8-1.9.7-4 1-6.1.4C5.1 7 1.8 10.3 1.8 14.5c0 4.1 3.5 7.5 7.8 8l.9.1c3.2.4 6.5-.8 8.7-3.2 2.1-2.4 3.1-5.6 2.4-8.8zM19.3 16c-1.8 2-4.5 3.2-7.4 2.8-.2 0-.3 0-.5-.1-3.1-.4-5.6-2.8-5.6-5.8 0-3 2.5-5.5 5.2-6.2 1.6.4 3.2.2 4.7-.4 1.4-.5 2.6-1.5 3.3-2.8.7 2.4-.1 5.1-1.6 7.4-.3.4-.6.8-1 1.1 1.3 1.2 2.3 2.7 2.9 4z" />
                    </svg>
                )}
                <span className="font-bold text-lg">{isSending ? 'กำลังดำเนินการ...' : 'ขออนุมัติงานซ่อม (LINE)'}</span>
            </button>
            <p className="text-center text-gray-400 text-xs mt-2">
                ระบบจะสร้างลิงก์สำหรับลูกค้าและส่งแจ้งเตือนไปยังกลุ่ม LINE Admin
            </p>
        </div>
    )
}
