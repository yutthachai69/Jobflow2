'use client'

import dynamic from 'next/dynamic'

interface Marker {
    id: string
    lat: number
    lng: number
    title: string
    address?: string | null
}

interface Props {
    markers: Marker[]
}

const GoogleMap = dynamic(() => import('./GoogleMap'), {
    ssr: false,
    loading: () => (
        <div className="bg-app-section rounded-xl border border-app flex items-center justify-center" style={{ height: '400px' }}>
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-app-muted font-medium">กำลังโหลดแผนที่...</span>
            </div>
        </div>
    ),
})

export default function LocationsMap({ markers }: Props) {
    const handleMarkerClick = (id: string) => {
        // Scroll to the site element
        const element = document.getElementById(`site-${id}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2')
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
            }, 3000)
        }
    }

    return (
        <div className="mb-6 sm:mb-8 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
                <span className="text-base sm:text-lg font-bold text-app-heading">🗺️ แผนที่สถานที่ทั้งหมด</span>
                <span className="text-xs sm:text-sm text-app-muted">({markers.length} สถานที่)</span>
            </div>
            <div className="w-full min-w-0 rounded-xl overflow-hidden border border-app">
                <GoogleMap
                    markers={markers}
                    height="clamp(220px, 50vh, 400px)"
                    onMarkerClick={handleMarkerClick}
                />
            </div>
        </div>
    )
}
