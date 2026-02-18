'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/app/components/MapPicker'), {
    ssr: false,
    loading: () => (
        <div className="bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center" style={{ height: '300px' }}>
            <span className="text-gray-400 text-sm">กำลังโหลดแผนที่...</span>
        </div>
    ),
})

interface Props {
    latitude?: number | null
    longitude?: number | null
}

export default function SiteMapPicker({ latitude, longitude }: Props) {
    const [lat, setLat] = useState<number | null>(latitude || null)
    const [lng, setLng] = useState<number | null>(longitude || null)

    return (
        <>
            <input type="hidden" name="latitude" value={lat?.toString() || ''} />
            <input type="hidden" name="longitude" value={lng?.toString() || ''} />
            <MapPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(newLat, newLng) => {
                    setLat(newLat)
                    setLng(newLng)
                }}
                height="300px"
            />
        </>
    )
}
