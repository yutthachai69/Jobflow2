'use client'

import React, { useEffect, useState } from 'react'
import CleanRoomReport from '@/app/components/reports/CleanRoomReport'

export default function CleanRoomReportDemoClient({ jobItem }: { jobItem: any }) {
    const [demoJobItem, setDemoJobItem] = useState(jobItem)

    useEffect(() => {
        const stored = localStorage.getItem('clean_room_demo_data')
        if (stored) {
            setDemoJobItem({
                ...jobItem,
                checklist: stored
            })
        }
    }, [jobItem])

    return (
        <div>
            <div className="bg-blue-50 border-b border-blue-200 p-4 text-center">
                <p className="text-blue-800 font-medium flex items-center justify-center gap-2">
                    <span className="text-xl">⚠️</span>
                    นี่คือหน้าพรีวิวตัวอย่างข้อมูลจากแบบฟอร์ม
                    <a href="/reports/clean-room-demo/form" className="text-blue-600 underline font-semibold ml-2 hover:text-blue-900">
                        (กลับไปแก้ไขฟอร์ม)
                    </a>
                </p>
            </div>
            <CleanRoomReport jobItem={demoJobItem} />
        </div>
    )
}
