'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getChecklistTemplates, deleteChecklistTemplate } from '@/app/actions/checklist'
import toast from 'react-hot-toast'
import { useConfirm } from '@/app/components/ConfirmModal'

interface ChecklistTemplate {
    id: string
    title: string
    description: string | null
    items: string
    createdAt: Date
    updatedAt: Date
}

export default function AdminChecklistsPage() {
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const { confirm, ConfirmDialog } = useConfirm()

    useEffect(() => {
        fetchTemplates()
    }, [])

    async function fetchTemplates() {
        setLoading(true)
        const result = await getChecklistTemplates()
        if (result.success && result.data) {
            setTemplates(result.data)
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        const confirmed = await confirm({
            title: 'ลบแบบฟอร์ม',
            message: 'คุณต้องการลบแบบฟอร์มนี้ใช่หรือไม่?',
            confirmText: 'ลบเลย',
            cancelText: 'ยกเลิก',
            variant: 'danger',
        })
        if (!confirmed) return

        const result = await deleteChecklistTemplate(id)
        if (result.success) {
            toast.success('ลบแบบฟอร์มเรียบร้อยแล้ว')
            fetchTemplates()
        } else {
            toast.error('เกิดข้อผิดพลาดในการลบแบบฟอร์ม')
        }
    }

    return (
        <>
            <ConfirmDialog />
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">แบบฟอร์มการตรวจสอบ</h2>
                        <p className="text-sm text-gray-500">จัดการรายการตรวจสอบสำหรับงานประเภทต่างๆ</p>
                    </div>
                    <Link
                        href="/admin/checklists/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        สร้างแบบฟอร์มใหม่
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">ยังไม่มีแบบฟอร์ม</h3>
                        <p className="text-gray-500 mb-6">สร้างแบบฟอร์มแรกเพื่อเริ่มใช้งานระบบ Checklist</p>
                        <Link
                            href="/admin/checklists/new"
                            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
                        >
                            สร้างแบบฟอร์มใหม่ &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {templates.map((template) => {
                            const itemCount = tryParseJSON(template.items)?.length || 0;

                            return (
                                <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link
                                                href={`/admin/checklists/${template.id}/edit`}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-800 text-lg mb-1 truncate" title={template.title}>
                                        {template.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                                        {template.description || 'ไม่มีรายละเอียด'}
                                    </p>

                                    <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-50">
                                        <span className="text-gray-500">
                                            {itemCount} รายการตรวจสอบ
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            {new Date(template.updatedAt).toLocaleDateString('th-TH', {
                                                year: '2-digit',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

function tryParseJSON(jsonString: string) {
    try {
        return JSON.parse(jsonString)
    } catch (e) {
        return []
    }
}
