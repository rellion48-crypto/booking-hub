import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface BookingFormProps {
  onSuccess: () => void
}

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [customer, setCustomer] = useState('')
  const [service, setService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      })

    if (insertError) {
      setError('예약 추가 실패: ' + insertError.message)
      setLoading(false)
    } else {
      setCustomer('')
      setService('')
      setDate('')
      setTime('')
      setAddress('')
      setLoading(false)
      onSuccess()
    }
  }

  // Google Maps Embed URL
  const mapEmbedUrl = address
    ? `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(address)}`
    : ''

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

        <input
          type="text"
          name="address"
          placeholder="주소 (예: 강남역, 서울시 강남구)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '추가 중...' : '예약하기'}
        </button>
      </form>

      {address && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">위치 미리보기</h3>
          <iframe
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: '8px' }}
            loading="lazy"
            src={mapEmbedUrl}
          />
        </div>
      )}
    </div>
  )
}
