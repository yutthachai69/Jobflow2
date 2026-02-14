
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'
import toast, { Toaster } from 'react-hot-toast'

// Declare global liff object
declare global {
    interface Window {
        liff: any
    }
}

export default function ConnectLinePage() {
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
    const [profile, setProfile] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState('')

    const initLiff = async () => {
        try {
            const liffId = process.env.NEXT_PUBLIC_LIFF_ID
            if (!liffId) {
                throw new Error('LIFF ID not configured')
            }

            await window.liff.init({ liffId })

            if (!window.liff.isLoggedIn()) {
                window.liff.login()
                return
            }

            const userProfile = await window.liff.getProfile()
            setProfile(userProfile)

            // Call API to save lineUserId
            const res = await fetch('/api/user/connect-line', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lineUserId: userProfile.userId })
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('connected')
                toast.success('เชื่อมต่อ LINE เรียบร้อย!')
            } else {
                throw new Error(data.error || 'Failed to connect')
            }

        } catch (err: any) {
            console.error('LIFF Error:', err)
            setStatus('error')
            setErrorMsg(err.message)
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Script
                src="https://static.line-scdn.net/liff/edge/2/sdk.js"
                onLoad={() => initLiff()}
            />
            <Toaster />

            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto mb-2">
                    <Image
                        src="/line.png"
                        alt="LINE"
                        width={96}
                        height={96}
                        className="object-contain drop-shadow-md"
                        priority
                    />
                </div>

                <h1 className="text-2xl font-bold text-gray-900">เชื่อมต่อกับ JobFlow</h1>

                {status === 'loading' && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#06C755]"></div>
                        <p className="text-gray-500">กำลังเชื่อมต่อ...</p>
                    </div>
                )}

                {status === 'connected' && profile && (
                    <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[#06C755]">
                            {profile.pictureUrl && (
                                <Image
                                    src={profile.pictureUrl}
                                    alt={profile.displayName}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">สวัสดีคุณ</p>
                            <p className="text-xl font-bold text-gray-900">{profile.displayName}</p>
                        </div>
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium">
                            ✅ บันทึกข้อมูลสำเร็จ
                        </div>
                        <p className="text-xs text-gray-400">คุณสามารถปิดหน้านี้ได้เลย</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                        <p className="font-bold mb-1">เกิดข้อผิดพลาด</p>
                        <p className="text-sm">{errorMsg}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm hover:bg-red-50 transition-colors"
                        >
                            ลองใหม่
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
