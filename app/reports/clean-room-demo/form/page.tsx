'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import CleanRoomForm from '@/app/components/forms/CleanRoomForm'
import toast from 'react-hot-toast'

export default function CleanRoomFormDemoPage() {
    const router = useRouter()

    const handleSaveMockData = async (jobItemId: string, checklistJson: string) => {
        try {
            // Save to localStorage for demo
            localStorage.setItem('clean_room_demo_data', checklistJson)
            toast.success('บันทึกข้อมูลตัวอย่างจำลองสำเร็จ!')

            // Navigate to the demo report page
            router.push('/reports/clean-room-demo')

            return { success: true }
        } catch (error) {
            console.error('Failed to save mock data', error)
            return { success: false, error: 'Failed to save mock data' }
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">ตัวอย่างแบบฟอร์ม Clean Room พารามิเตอร์</h1>
                <p className="text-gray-500 mt-2">หน้านี้คือแบบฟอร์มจำลอง (Demo) ข้อมูลที่กรอกที่นี่จะถูกนำไปแสดงผลพรีวิวในหน้าตัวอย่างรายงาน ไม่มีการบันทึกลงฐานข้อมูลจริงทางฝั่งเซิร์ฟเวอร์</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6">
                <CleanRoomForm
                    jobItemId="demo-1234"
                    initialData=""
                    onSaveAction={handleSaveMockData}
                />
            </div>
        </div>
    )
}
