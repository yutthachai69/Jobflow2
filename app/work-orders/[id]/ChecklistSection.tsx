'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getChecklistTemplates } from '@/app/actions/checklist'
import { updateJobItemChecklist } from '@/app/actions/work-orders'

interface ChecklistItem {
    id: string
    text: string
    isChecked: boolean
    note?: string
}

interface ChecklistSectionProps {
    jobItemId: string
    initialData: string | null // JSON string of items
    isEditable: boolean
    jobType: string
}

export default function ChecklistSection({ jobItemId, initialData, isEditable, jobType }: ChecklistSectionProps) {
    const router = useRouter()
    const [items, setItems] = useState<ChecklistItem[]>([])
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])

    useEffect(() => {
        if (initialData) {
            try {
                const parsed = JSON.parse(initialData)
                setItems(parsed)
            } catch (e) {
                console.error('Failed to parse checklist data', e)
                setItems([])
            }
        } else {
            // If no data, maybe auto-load a template?
            // For now, let's just fetch templates so user can select one
            fetchTemplates()
        }
    }, [initialData])

    async function fetchTemplates() {
        const result = await getChecklistTemplates()
        if (result.success && result.data) {
            setTemplates(result.data)
        }
    }

    const handleApplyTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId)
        if (!template) return

        if (items.length > 0 && !confirm('การเลือกแบบฟอร์มใหม่จะล้างข้อมูลเดิม คุณแน่ใจหรือไม่?')) {
            return
        }

        try {
            const templateItems: string[] = JSON.parse(template.items)
            const newChecklistItems = templateItems.map((text, index) => ({
                id: `item-${Date.now()}-${index}`,
                text,
                isChecked: false,
                note: ''
            }))
            setItems(newChecklistItems)
        } catch (e) {
            console.error('Failed to parse template items', e)
        }
    }

    const handleToggle = (index: number) => {
        if (!isEditable) return
        const newItems = [...items]
        newItems[index].isChecked = !newItems[index].isChecked
        setItems(newItems)
    }

    const handleNoteChange = (index: number, note: string) => {
        if (!isEditable) return
        const newItems = [...items]
        newItems[index].note = note
        setItems(newItems)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateJobItemChecklist(jobItemId, JSON.stringify(items))
            if (result.success) {
                alert('บันทึกเรียบร้อย')
                router.refresh()
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('เกิดข้อผิดพลาดในการบันทึก')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    รายการตรวจสอบ (Checklist)
                </h3>
                {isEditable && items.length > 0 && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกผล'}
                    </button>
                )}
            </div>

            <div className="p-6">
                {items.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 mt-2">ยังไม่มีรายการตรวจสอบ</p>
                        </div>

                        {isEditable && templates.length > 0 && (
                            <div className="max-w-md mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2">เลือกแบบฟอร์มตรวจสอบ</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    onChange={(e) => handleApplyTemplate(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- เลือกแบบฟอร์ม --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {isEditable && templates.length === 0 && (
                            <p className="text-sm text-gray-400">ไม่พบแบบฟอร์ม (ต้องสร้างในระบบ Admin ก่อน)</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Header Row */}
                        <div className="hidden md:flex text-sm font-semibold text-gray-500 border-b pb-2">
                            <div className="w-12 text-center">สถานะ</div>
                            <div className="flex-1 px-4">รายการ</div>
                            <div className="w-1/3">หมายเหตุ</div>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className={`flex flex-col md:flex-row gap-3 p-3 rounded-xl transition-colors ${item.isChecked ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            checked={item.isChecked}
                                            onChange={() => handleToggle(index)}
                                            disabled={!isEditable}
                                            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${item.isChecked ? 'text-green-800' : 'text-gray-800'}`}>
                                            {item.text}
                                        </p>
                                        {/* Mobile Note Input */}
                                        <div className="md:hidden mt-2">
                                            <input
                                                type="text"
                                                value={item.note || ''}
                                                onChange={(e) => handleNoteChange(index, e.target.value)}
                                                disabled={!isEditable}
                                                placeholder="หมายเหตุ (ถ้ามี)"
                                                className="w-full text-sm border-b border-gray-200 bg-transparent py-1 focus:border-blue-500 outline-none placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Note Input */}
                                <div className="hidden md:block w-1/3">
                                    <input
                                        type="text"
                                        value={item.note || ''}
                                        onChange={(e) => handleNoteChange(index, e.target.value)}
                                        disabled={!isEditable}
                                        placeholder="หมายเหตุ (ถ้ามี)"
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
