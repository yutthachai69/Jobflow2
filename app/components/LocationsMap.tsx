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
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-app-heading">🗺️ แผนที่สถานที่ทั้งหมด</span>
                <span className="text-sm text-app-muted">({markers.length} สถานที่)</span>
            </div>
            <GoogleMap markers={markers} height="400px" onMarkerClick={handleMarkerClick} />
        </div>
    )
}
