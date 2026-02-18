'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
}

const variantConfig = {
    danger: {
        icon: '⚠️',
        confirmBg: 'bg-red-600 hover:bg-red-700',
        headerBg: 'bg-red-50',
        iconBg: 'bg-red-100',
    },
    warning: {
        icon: '⚡',
        confirmBg: 'bg-orange-600 hover:bg-orange-700',
        headerBg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
    },
    info: {
        icon: '💡',
        confirmBg: 'bg-blue-600 hover:bg-blue-700',
        headerBg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
    },
}

export default function ConfirmModal({
    isOpen,
    onConfirm,
    onCancel,
    title = 'ยืนยันการดำเนินการ',
    message,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    variant = 'warning',
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false)
    const config = variantConfig[variant]

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${config.headerBg} px-6 py-5 flex items-center gap-3`}>
                    <div className={`${config.iconBg} w-10 h-10 rounded-full flex items-center justify-center text-lg`}>
                        {config.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                </div>
                <div className="px-6 py-5">
                    <p className="text-gray-600 whitespace-pre-line">{message}</p>
                </div>
                <div className="px-6 pb-5 flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-xl text-white font-medium ${config.confirmBg} transition-colors shadow-lg`}
                        type="button"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

// Custom hook for confirm dialogs
export function useConfirm() {
    const [state, setState] = useState<{
        isOpen: boolean
        title: string
        message: string
        confirmText: string
        cancelText: string
        variant: 'danger' | 'warning' | 'info'
        resolve: ((value: boolean) => void) | null
    }>({
        isOpen: false,
        title: 'ยืนยันการดำเนินการ',
        message: '',
        confirmText: 'ยืนยัน',
        cancelText: 'ยกเลิก',
        variant: 'warning',
        resolve: null,
    })

    const confirm = useCallback(
        (options: {
            title?: string
            message: string
            confirmText?: string
            cancelText?: string
            variant?: 'danger' | 'warning' | 'info'
        }): Promise<boolean> => {
            return new Promise((resolve) => {
                setState({
                    isOpen: true,
                    title: options.title || 'ยืนยันการดำเนินการ',
                    message: options.message,
                    confirmText: options.confirmText || 'ยืนยัน',
                    cancelText: options.cancelText || 'ยกเลิก',
                    variant: options.variant || 'warning',
                    resolve,
                })
            })
        },
        []
    )

    const handleConfirm = useCallback(() => {
        state.resolve?.(true)
        setState((prev) => ({ ...prev, isOpen: false, resolve: null }))
    }, [state.resolve])

    const handleCancel = useCallback(() => {
        state.resolve?.(false)
        setState((prev) => ({ ...prev, isOpen: false, resolve: null }))
    }, [state.resolve])

    const ConfirmDialog = useCallback(
        () => (
            <ConfirmModal
                isOpen={state.isOpen}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                title={state.title}
                message={state.message}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
                variant={state.variant}
            />
        ),
        [state.isOpen, state.title, state.message, state.confirmText, state.cancelText, state.variant, handleConfirm, handleCancel]
    )

    return { confirm, ConfirmDialog }
}
