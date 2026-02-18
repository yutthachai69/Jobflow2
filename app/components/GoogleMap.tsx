'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Marker {
    id: string
    lat: number
    lng: number
    title: string
    address?: string | null
}

interface GoogleMapProps {
    markers: Marker[]
    height?: string
    onMarkerClick?: (id: string) => void
}

// Default center: Bangkok, Thailand
const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 }
const DEFAULT_ZOOM = 6

export default function GoogleMap({ markers, height = '400px', onMarkerClick }: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load Google Maps script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
            setError('Google Maps API Key ไม่ได้ตั้งค่า')
            return
        }

        // Check if already loaded
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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`
        script.async = true
        script.defer = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () => setError('ไม่สามารถโหลด Google Maps ได้')
        document.head.appendChild(script)
    }, [])

    // Initialize map
    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google?.maps || mapInstanceRef.current) return

        const map = new google.maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            mapId: 'jobflow-map',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }],
                },
            ],
        })

        mapInstanceRef.current = map
    }, [])

    // Add markers
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current) {
            if (isLoaded) initMap()
            return
        }

        const map = mapInstanceRef.current

        // Clear existing markers
        markersRef.current.forEach(m => m.map = null)
        markersRef.current = []

        const validMarkers = markers.filter(m => m.lat && m.lng)
        if (validMarkers.length === 0) return

        const bounds = new google.maps.LatLngBounds()

        validMarkers.forEach(markerData => {
            const position = { lat: markerData.lat, lng: markerData.lng }

            // Create custom pin element
            const pinElement = document.createElement('div')
            pinElement.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(59,130,246,0.4);
          white-space: nowrap;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          📍 ${markerData.title}
        </div>
      `

            const marker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position,
                content: pinElement,
                title: markerData.title,
            })

            // Info window
            const infoWindow = new google.maps.InfoWindow({
                content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px;">${markerData.title}</h3>
            ${markerData.address ? `<p style="font-size: 12px; color: #666; margin: 0;">${markerData.address}</p>` : ''}
          </div>
        `,
            })

            marker.addListener('click', () => {
                infoWindow.open({ anchor: marker, map })
                if (onMarkerClick) onMarkerClick(markerData.id)
            })

            markersRef.current.push(marker)
            bounds.extend(position)
        })

        // Fit bounds to show all markers
        if (validMarkers.length === 1) {
            map.setCenter({ lat: validMarkers[0].lat, lng: validMarkers[0].lng })
            map.setZoom(15)
        } else {
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
        }
    }, [isLoaded, markers, initMap, onMarkerClick])

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center" style={{ height }}>
                <p className="text-red-600 font-medium">⚠️ {error}</p>
            </div>
        )
    }

    return (
        <div className="relative rounded-xl overflow-hidden shadow-lg border border-app" style={{ height }}>
            {!isLoaded && (
                <div className="absolute inset-0 bg-app-section flex items-center justify-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-app-muted font-medium">กำลังโหลดแผนที่...</span>
                    </div>
                </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
        </div>
    )
}
