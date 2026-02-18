'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChecklistTemplate, updateChecklistTemplate } from '@/app/actions/checklist'
import toast from 'react-hot-toast'

interface ChecklistTemplate {
    id?: string
    title: string
    description: string | null
    items: string
}

interface ChecklistFormProps {
    initialData?: ChecklistTemplate
    mode: 'create' | 'edit'
}

export default function ChecklistForm({ initialData, mode }: ChecklistFormProps) {
    const router = useRouter()
    const [title, setTitle] = useState(initialData?.title || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [items, setItems] = useState<string[]>(() => {
        try {
            return initialData?.items ? JSON.parse(initialData.items) : ['']
        } catch {
            return ['']
        }
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAddItem = () => {
        setItems([...items, ''])
    }

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
    }

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items]
        newItems[index] = value
        setItems(newItems)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Filter out empty items
        const validItems = items.filter(item => item.trim() !== '')

        if (validItems.length === 0) {
            toast.error('กรุณาเพิ่มรายการตรวจสอบอย่างน้อย 1 รายการ', { icon: '⚠️' })
            setIsSubmitting(false)
            return
        }

        const formData = new FormData()
        formData.append('title', title)
        formData.append('description', description)
        formData.append('items', JSON.stringify(validItems))

        try {
            let result
            if (mode === 'edit' && initialData?.id) {
                result = await updateChecklistTemplate(initialData.id, formData)
            } else {
                result = await createChecklistTemplate(formData)
            }

            if (result.success) {
                router.push('/admin/checklists')
                router.refresh()
            } else {
                toast.error('เกิดข้อผิดพลาด: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            toast.error('เกิดข้อผิดพลาดในการบันทึก')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                    ข้อมูลทั่วไป
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ชื่อแบบฟอร์ม <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="เช่น บำรุงรักษาแอร์ติดผนัง (PM)"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            คำอธิบาย (ถ้ามี)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับแบบฟอร์มนี้..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-cyan-100 text-cyan-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                        รายการตรวจสอบ
                    </h3>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        เพิ่มรายการ
                    </button>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-3 group">
                            <div className="flex-none pt-3 text-gray-400 font-mono text-sm w-6 text-right">
                                {index + 1}.
                            </div>
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => handleItemChange(index, e.target.value)}
                                placeholder={`รายการที่ ${index + 1}`}
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                autoFocus={items.length > 1 && index === items.length - 1}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="flex-none p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="ลบรายการ"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                            <p className="text-gray-400">ยังไม่มีรายการตรวจสอบ</p>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="mt-2 text-blue-600 font-medium hover:underline"
                            >
                                เพิ่มรายการแรกเลย
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all md:text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            กำลังบันทึก...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            บันทึกแบบฟอร์ม
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
