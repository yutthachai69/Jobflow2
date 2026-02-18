'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getChecklistTemplates } from '@/app/actions/checklist'
import { updateJobItemChecklist } from '@/app/actions/work-orders'
import { useConfirm } from '@/app/components/ConfirmModal'

type CheckResult = 'PASS' | 'FAIL' | null

interface ChecklistItem {
    id: string
    text: string
    result: CheckResult
    note?: string
    // backward compat
    isChecked?: boolean
}

interface ChecklistSectionProps {
    jobItemId: string
    initialData: string | null
    isEditable: boolean
    jobType: string
}

export default function ChecklistSection({ jobItemId, initialData, isEditable, jobType }: ChecklistSectionProps) {
    const router = useRouter()
    const { confirm, ConfirmDialog } = useConfirm()
    const [items, setItems] = useState<ChecklistItem[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [saveError, setSaveError] = useState('')
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        if (initialData) {
            try {
                const parsed = JSON.parse(initialData)
                // Migrate old format (isChecked) → new format (result)
                const migrated = parsed.map((item: any) => ({
                    ...item,
                    result: item.result ?? (item.isChecked ? 'PASS' : null),
                }))
                setItems(migrated)
            } catch (e) {
                console.error('Failed to parse checklist data', e)
                setItems([])
            }
        } else {
            fetchTemplates()
        }
    }, [initialData])

    async function fetchTemplates() {
        const result = await getChecklistTemplates()
        if (result.success && result.data) {
            setTemplates(result.data)
        }
    }

    const handleApplyTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId)
        if (!template) return

        if (items.length > 0) {
            const confirmed = await confirm({
                title: 'เปลี่ยนแบบฟอร์ม',
                message: 'การเลือกแบบฟอร์มใหม่จะล้างข้อมูลเดิม คุณแน่ใจหรือไม่?',
                confirmText: 'ใช่ ล้างข้อมูล',
                cancelText: 'ยกเลิก',
                variant: 'warning',
            })
            if (!confirmed) return
        }

        try {
            const templateItems: string[] = JSON.parse(template.items)
            const newChecklistItems: ChecklistItem[] = templateItems.map((text, index) => ({
                id: `item-${Date.now()}-${index}`,
                text,
                result: null,
                note: ''
            }))
            setItems(newChecklistItems)
        } catch (e) {
            console.error('Failed to parse template items', e)
        }
    }

    const handleSetResult = (index: number, result: CheckResult) => {
        if (!isEditable) return
        const newItems = [...items]
        newItems[index].result = result
        // ถ้าเปลี่ยนเป็นผ่าน ให้ล้าง note
        if (result === 'PASS') {
            newItems[index].note = ''
        }
        setItems(newItems)
    }

    const handleNoteChange = (index: number, note: string) => {
        if (!isEditable) return
        const newItems = [...items]
        newItems[index].note = note
        setItems(newItems)
    }

    const handleSave = async () => {
        // ตรวจสอบว่า item ที่ไม่ผ่านต้องมีหมายเหตุ
        const failWithoutNote = items.find(item => item.result === 'FAIL' && (!item.note || item.note.trim() === ''))
        if (failWithoutNote) {
            setSaveError(`กรุณาใส่หมายเหตุสำหรับรายการที่ไม่ผ่าน: "${failWithoutNote.text}"`)
            return
        }

        // ตรวจสอบว่าทุกรายการถูกตรวจแล้ว
        const unchecked = items.find(item => item.result === null)
        if (unchecked) {
            setSaveError(`กรุณาตรวจสอบทุกรายการก่อนบันทึก: "${unchecked.text}"`)
            return
        }

        setSaveError('')
        setIsSaving(true)
        try {
            const result = await updateJobItemChecklist(jobItemId, JSON.stringify(items))
            if (result.success) {
                showToast('success', 'บันทึกผลตรวจสอบเรียบร้อยแล้ว ✓')
                router.refresh()
            } else {
                showToast('error', 'เกิดข้อผิดพลาด: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            showToast('error', 'เกิดข้อผิดพลาดในการบันทึก')
        } finally {
            setIsSaving(false)
        }
    }

    // สรุปผลตรวจ
    const passCount = items.filter(i => i.result === 'PASS').length
    const failCount = items.filter(i => i.result === 'FAIL').length
    const pendingCount = items.filter(i => i.result === null).length

    return (
        <>
            <ConfirmDialog />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Toast Notification */}
                {toast && (
                    <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-[slideIn_0.3s_ease] ${toast.type === 'success'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                        }`}>
                        <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
                        <span>{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
                    </div>
                )}
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
                        <div className="space-y-3">
                            {/* Summary Bar */}
                            <div className="flex items-center gap-4 text-sm mb-4 p-3 bg-gray-50 rounded-xl">
                                <span className="font-semibold text-gray-700">สรุป:</span>
                                <span className="flex items-center gap-1 text-green-700">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                    ผ่าน {passCount}
                                </span>
                                <span className="flex items-center gap-1 text-red-700">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                                    ไม่ผ่าน {failCount}
                                </span>
                                <span className="flex items-center gap-1 text-gray-500">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
                                    รอตรวจ {pendingCount}
                                </span>
                            </div>

                            {/* Error Message */}
                            {saveError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    ⚠️ {saveError}
                                </div>
                            )}

                            {/* Checklist Items */}
                            {items.map((item, index) => {
                                const bgClass = item.result === 'PASS'
                                    ? 'bg-green-50 border-green-200'
                                    : item.result === 'FAIL'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-gray-50 border-gray-200'

                                return (
                                    <div key={index} className={`rounded-xl border p-4 transition-all ${bgClass}`}>
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Item Text */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-sm font-mono text-gray-400 w-6 text-right flex-shrink-0">{index + 1}.</span>
                                                <p className={`font-medium ${item.result === 'PASS' ? 'text-green-800' : item.result === 'FAIL' ? 'text-red-800' : 'text-gray-800'}`}>
                                                    {item.text}
                                                </p>
                                            </div>

                                            {/* Pass/Fail Buttons */}
                                            {isEditable ? (
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetResult(index, 'PASS')}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${item.result === 'PASS'
                                                            ? 'bg-green-600 text-white shadow-md'
                                                            : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
                                                            }`}
                                                    >
                                                        ✓ ผ่าน
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetResult(index, 'FAIL')}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${item.result === 'FAIL'
                                                            ? 'bg-red-600 text-white shadow-md'
                                                            : 'bg-white text-red-700 border border-red-300 hover:bg-red-50'
                                                            }`}
                                                    >
                                                        ✗ ไม่ผ่าน
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${item.result === 'PASS' ? 'bg-green-100 text-green-700'
                                                    : item.result === 'FAIL' ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {item.result === 'PASS' ? '✓ ผ่าน' : item.result === 'FAIL' ? '✗ ไม่ผ่าน' : 'รอตรวจ'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Note — แสดงเมื่อไม่ผ่าน หรือมี note อยู่แล้ว */}
                                        {(item.result === 'FAIL' || (item.note && item.note.trim())) && (
                                            <div className="mt-3 ml-9">
                                                {isEditable ? (
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={item.note || ''}
                                                            onChange={(e) => handleNoteChange(index, e.target.value)}
                                                            placeholder="ระบุสาเหตุที่ไม่ผ่าน *"
                                                            className={`w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 outline-none transition-all bg-white ${item.result === 'FAIL' && (!item.note || !item.note.trim())
                                                                ? 'border-red-400 focus:ring-red-300 placeholder:text-red-400'
                                                                : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400'
                                                                }`}
                                                        />
                                                        {item.result === 'FAIL' && (!item.note || !item.note.trim()) && (
                                                            <p className="text-xs text-red-500 mt-1">* กรุณาระบุหมายเหตุ</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    item.note && (
                                                        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                                                            📝 {item.note}
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
