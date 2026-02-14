'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createRepairRequest } from '@/app/actions/work-orders'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface RequestRepairButtonProps {
    assetId: string
    userId: string
    jobStatus: string
    assetName: string
    assetLocation: string
    assetCode: string
    sourceJobItemId?: string
}

export default function RequestRepairButton({
    assetId,
    userId,
    jobStatus,
    assetName,
    assetLocation,
    assetCode,
    sourceJobItemId
}: RequestRepairButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('NORMAL')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description.trim()) return

        setIsSubmitting(true)
        try {
            // Prepend priority to description since we don't have a priority field in DB yet
            const fullDescription = `[Priority: ${priority}] ${description}`
            const result = await createRepairRequest(assetId, fullDescription, userId, sourceJobItemId)
            if (result.success) {
                toast.success(`ออกใบแจ้งซ่อมเรียบร้อยแล้ว (เลขที่: ${result.workOrderNumber})`, {
                    duration: 5000,
                    icon: '✅',
                })
                setIsOpen(false)
                setDescription('')
                setPriority('NORMAL')
                router.refresh()
            } else {
                toast.error('เกิดข้อผิดพลาด: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            toast.error('เกิดข้อผิดพลาดในการสร้างใบแจ้งซ่อม')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-orange-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

                <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </span>
                            แจ้งซ่อม / พบปัญหา (Issue Found)
                        </h3>
                        <p className="text-gray-500 mt-1 max-w-xl">
                            หากพบความผิดปกติของอุปกรณ์ หรือต้องการแจ้งซ่อมเพิ่มเติม สามารถเปิดใบงานซ่อม (CM) ได้ที่นี่
                        </p>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:bg-orange-700 hover:shadow-orange-300 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        เปิดใบแจ้งซ่อม
                    </button>
                </div>
            </div>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
                        {/* Formal Header */}
                        <div className="bg-gray-50 border-b px-8 py-5 flex justify-between items-start shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                    <span className="bg-orange-600 text-white p-1 rounded">CM</span>
                                    ใบคำร้องแจ้งซ่อม (Maintenance Request)
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อการดำเนินการที่รวดเร็ว</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
                            {/* Asset Info Section */}
                            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <h4 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide border-b border-blue-200 pb-2">
                                    ข้อมูลทรัพย์สิน (Asset Information)
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500 text-xs">รหัสทรัพย์สิน (Asset Code)</span>
                                        <span className="font-mono font-medium text-gray-900">{assetCode}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs">ชื่อรายการ (Asset Name)</span>
                                        <span className="font-medium text-gray-900">{assetName}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-gray-500 text-xs">สถานที่ติดตั้ง (Location)</span>
                                        <span className="font-medium text-gray-900">{assetLocation}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Request Details */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        ระดับความเร่งด่วน (Priority) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value="NORMAL"
                                                checked={priority === 'NORMAL'}
                                                onChange={(e) => setPriority(e.target.value)}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">ทั่วไป (Normal)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value="HIGH"
                                                checked={priority === 'HIGH'}
                                                onChange={(e) => setPriority(e.target.value)}
                                                className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 font-medium text-orange-700">เร่งด่วน (High)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value="CRITICAL"
                                                checked={priority === 'CRITICAL'}
                                                onChange={(e) => setPriority(e.target.value)}
                                                className="w-4 h-4 text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-700 font-bold text-red-700">ฉุกเฉิน (Critical)</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        รายละเอียดปัญหา / อาการที่พบ (Description) <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none min-h-[150px] text-sm"
                                        placeholder="ระบุรายละเอียดอาการเสีย สาเหตุเบื้องต้น (ถ้าทราบ) และความเสียหายที่เกิดขึ้น..."
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">กรุณาระบุรายละเอียดให้มากที่สุดเพื่อประโยชน์ในการเตรียมอะไหล่และเครื่องมือ</p>
                                </div>
                            </div>
                        </form>

                        {/* Footer Actions */}
                        <div className="bg-gray-50 px-8 py-4 border-t flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white hover:shadow-sm transition-all text-sm"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 font-semibold shadow-md shadow-blue-200 disabled:opacity-70 flex items-center gap-2 text-sm transition-all"
                            >
                                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการแจ้งซ่อม'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
