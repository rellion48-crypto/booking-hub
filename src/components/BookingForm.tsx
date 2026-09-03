import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface BookingFormProps {
  onSuccess: () => void
  userEmail: string
}

// Global function for map popup buttons
declare global {
  interface Window {
    selectAddressMarker: (address: string) => void
  }
}

export default function BookingForm({ onSuccess, userEmail }: BookingFormProps) {
  const [customer, setCustomer] = useState('')
  const [service, setService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [address, setAddress] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showMap, setShowMap] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.978])

  const handleSearchAddress = async () => {
    if (!searchInput.trim()) {
      setError('검색어를 입력해주세요')
      return
    }

    try {
      setError('')
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&limit=10`
      )
      const results = await response.json()

      if (results.length === 0) {
        setError('검색 결과가 없습니다')
        setSearchResults([])
      } else {
        setSearchResults(results)
        setShowMap(true)
        // Move map to first result
        const firstResult = results[0]
        setMapCenter([parseFloat(firstResult.lat), parseFloat(firstResult.lon)])
      }
    } catch (err) {
      setError('검색 중 오류가 발생했습니다')
      console.error('Search error:', err)
    }
  }

  // Register global function for map popup buttons
  useEffect(() => {
    (window as any).selectAddressMarker = (addressStr: string) => {
      setAddress(addressStr)
      setSearchResults([])
      setShowMap(false)
      setSearchInput('')
    }

    return () => {
      (window as any).selectAddressMarker = undefined
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!customer || !service || !date || !time || !address) {
      setError('모든 필드를 입력해주세요')
      return
    }

    setLoading(true)
    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        customer,
        service,
        date,
        time,
        address,
        status: 'pending',
        via: 'form',
        email: userEmail,
      })

    if (insertError) {
      setError('예약 추가 실패: ' + insertError.message)
      setLoading(false)
    } else {
      // Add to Google Calendar
      console.log('🔍 예약 저장 성공, 구글 캘린더 연동 시작...')
      try {
        const session = await supabase.auth.getSession()
        const refreshToken = localStorage.getItem('google_refresh_token')
        console.log('📌 Refresh Token:', refreshToken ? '있음' : '없음')

        if (refreshToken) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-to-calendar`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.data.session?.access_token || ''}`,
              },
              body: JSON.stringify({
                refreshToken,
                customer,
                service,
                date,
                time,
                address,
              }),
            }
          )

          if (response.ok) {
            console.log('✅ 구글 캘린더에 이벤트 추가됨')
          } else {
            const errorData = await response.json()
            console.error('❌ 구글 캘린더 추가 실패:', errorData)
          }
        }
      } catch (err) {
        console.error('구글 캘린더 연동 에러:', err)
      }

      setCustomer('')
      setService('')
      setDate('')
      setTime('')
      setAddress('')
      setLoading(false)
      onSuccess()
    }
  }

  // Leaflet Map rendering
  useEffect(() => {
    if (!showMap || !mapRef.current) return

    const timer = setTimeout(() => {
      if (!mapRef.current) return

      // Initialize map if not already done
      if (!mapInstanceRef.current) {
        try {
          mapInstanceRef.current = L.map(mapRef.current).setView(mapCenter, 13)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(mapInstanceRef.current)
        } catch (err) {
          console.error('Map initialization error:', err)
          return
        }
      }

      // Move to new center
      mapInstanceRef.current.setView(mapCenter, 13)

      // Clear previous markers
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current?.removeLayer(layer)
        }
      })

      // Invalidate map size
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }

      // Add markers for search results
      const defaultIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBmaWxsPSIjMzM4OEZGIiBkPSJNMTIuNSAwQzUuNTk3IDAgMCA1LjU5NyAwIDEyLjVjMCA3LjEwMyAxMi41IDI4LjkwNyAxMi41IDI4LjkwN3MxMi41LTIxLjgwNCAxMi41LTI4LjkwN0MyNSA1LjU5NyAxOS40MDMgMCAxMi41IDB6bTAgMTcuNWMtMi43NTcgMC01LTIuMjQzLTUtNXMyLjI0My01IDUtNSA1IDIuMjQzIDUgNS0yLjI0MyA1LTUgNXoiLz48L3N2Zz4=',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })

      searchResults.forEach((result) => {
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)
        L.marker([lat, lon], { icon: defaultIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(
            `<div style="font-size: 12px; max-width: 200px;">
              <strong>${result.name || result.display_name.split(',')[0]}</strong><br/>
              ${result.display_name}<br/>
              <button style="margin-top: 8px; padding: 4px 8px; background: #3388ff; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.selectAddressMarker('${result.display_name.replace(/'/g, "\\'")}')">
                선택
              </button>
            </div>`
          )
          .openPopup()
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [showMap, mapCenter, searchResults])

  return (
    <div className="space-y-6 mb-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">새 예약 추가</h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="고객사"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="서비스"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="주소 검색 (예: 강남역, 서울시 강남구)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={handleSearchAddress}
              className="bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700"
            >
              검색
            </button>
          </div>
          {address && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              선택됨: {address}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '추가 중...' : '예약하기'}
        </button>
      </form>

      {showMap && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">위치 선택</h3>
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '400px',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          />
          <p className="text-sm text-gray-600 mt-4">지도의 마커를 클릭하고 "선택" 버튼을 누르세요</p>
        </div>
      )}
    </div>
  )
}
