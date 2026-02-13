'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ChecklistForm from '../../ChecklistForm'
import { getChecklistTemplate } from '@/app/actions/checklist'
import { useParams } from 'next/navigation'

export default function EditChecklistPage() {
    const params = useParams()
    const [template, setTemplate] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchTemplate(params.id as string)
        }
    }, [params.id])

    async function fetchTemplate(id: string) {
        const result = await getChecklistTemplate(id)
        if (result.success) {
            setTemplate(result.data)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!template) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50 flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">ไม่พบข้อมูล</h1>
                <p className="text-gray-500">ไม่พบแบบฟอร์มที่คุณต้องการแก้ไข</p>
                <Link href="/admin/checklists" className="text-blue-600 hover:underline">กลับหน้ารายการ</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/checklists"
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">แก้ไขแบบฟอร์มตรวจสอบ</h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                <ChecklistForm mode="edit" initialData={template} />
            </div>
        </div>
    )
}
