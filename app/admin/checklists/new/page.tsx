'use client'

import React from 'react'
import Link from 'next/link'
import ChecklistForm from '../ChecklistForm'

export default function NewChecklistPage() {
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
                <h1 className="text-2xl font-bold text-gray-800">สร้างแบบฟอร์มตรวจสอบใหม่</h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                <ChecklistForm mode="create" />
            </div>
        </div>
    )
}
