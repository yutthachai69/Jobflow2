'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface MapPickerProps {
    latitude?: number | null
    longitude?: number | null
    onChange: (lat: number, lng: number) => void
    height?: string
}

const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 }
const DEFAULT_ZOOM = 10

export default function MapPicker({ latitude, longitude, onChange, height = '300px' }: MapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [displayLat, setDisplayLat] = useState<number | null>(latitude || null)
    const [displayLng, setDisplayLng] = useState<number | null>(longitude || null)

    // Load Google Maps script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
            setTimeout(() => setError('Google Maps API Key ไม่ได้ตั้งค่า'), 0)
            return
        }

        if (window.google?.maps) {
            setIsLoaded(true)
            return
        }

        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
        if (existingScript) {
            existingScript.addEventListener('load', () => setIsLoaded(true))
            return
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geocoding`
        script.async = true
        script.defer = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () => setError('ไม่สามารถโหลด Google Maps ได้')
        document.head.appendChild(script)
    }, [])

    const placeMarker = useCallback((position: google.maps.LatLng | google.maps.LatLngLiteral, map: google.maps.Map) => {
        const lat = typeof position.lat === 'function' ? position.lat() : position.lat
        const lng = typeof position.lng === 'function' ? position.lng() : position.lng

        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.map = null
        }

        // Create pin element
        const pinElement = document.createElement('div')
        pinElement.innerHTML = `
      <div style="
        font-size: 32px;
        cursor: grab;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        transition: transform 0.2s;
      ">📍</div>
    `

        const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            content: pinElement,
            gmpDraggable: true,
            title: 'ลากเพื่อย้ายตำแหน่ง',
        })

        marker.addListener('dragend', () => {
            const pos = marker.position
            if (pos) {
                const newLat = typeof pos.lat === 'number' ? pos.lat : (pos as any).lat()
                const newLng = typeof pos.lng === 'number' ? pos.lng : (pos as any).lng()
                setDisplayLat(newLat)
                setDisplayLng(newLng)
                onChange(newLat, newLng)
            }
        })

        markerRef.current = marker
        setDisplayLat(lat)
        setDisplayLng(lng)
        onChange(lat, lng)
    }, [onChange])

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

        const center = latitude && longitude
            ? { lat: latitude, lng: longitude }
            : DEFAULT_CENTER

        const map = new google.maps.Map(mapRef.current, {
            center,
            zoom: latitude && longitude ? 15 : DEFAULT_ZOOM,
            mapId: 'jobflow-picker',
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        })

        mapInstanceRef.current = map

        // Place initial marker if lat/lng exists
        if (latitude && longitude) {
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    placeMarker({ lat: latitude, lng: longitude }, mapInstanceRef.current)
                }
            }, 0)
        }

        // Click to place marker
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
                placeMarker(e.latLng, map)
                map.panTo(e.latLng)
            }
        })
    }, [isLoaded, latitude, longitude, placeMarker])

    // Search for location
    const handleSearch = async () => {
        if (!searchQuery.trim() || !window.google?.maps) return

        const geocoder = new google.maps.Geocoder()
        try {
            const result = await geocoder.geocode({ address: searchQuery })
            if (result.results.length > 0) {
                const location = result.results[0].geometry.location
                mapInstanceRef.current?.panTo(location)
                mapInstanceRef.current?.setZoom(16)
                if (mapInstanceRef.current) {
                    placeMarker(location, mapInstanceRef.current)
                }
            }
        } catch {
            // Geocoding failed silently
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSearch()
        }
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-600 text-sm">⚠️ {error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Search bar */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ค้นหาสถานที่... เช่น สุขุมวิท 21"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-gray-900 placeholder:text-gray-400"
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                    🔍 ค้นหา
                </button>
            </div>

            {/* Map */}
            <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
                {!isLoaded && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-gray-500 text-sm">กำลังโหลดแผนที่...</span>
                        </div>
                    </div>
                )}
                <div ref={mapRef} className="w-full h-full" />
            </div>

            {/* Coordinates display */}
            {displayLat && displayLng && (
                <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <span>📍 พิกัด:</span>
                    <span className="font-mono">{displayLat.toFixed(6)}, {displayLng.toFixed(6)}</span>
                </div>
            )}

            {/* Help text */}
            <p className="text-xs text-gray-400">
                💡 กดบนแผนที่เพื่อเลือกตำแหน่ง หรือค้นหาชื่อสถานที่ด้านบน (ลากหมุดเพื่อปรับตำแหน่งได้)
            </p>
        </div>
    )
}
