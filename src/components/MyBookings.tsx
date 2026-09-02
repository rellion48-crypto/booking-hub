import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Booking {
  id: number
  customer: string
  service: string
  date: string
  time: string
  address: string
  status: string
  created_at: string
}

interface MyBookingsProps {
  userEmail: string
  refreshKey: number
}

export default function MyBookings({ userEmail, refreshKey }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('email', userEmail)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('조회 실패:', error)
      } else {
        setBookings(data || [])
      }
      setLoading(false)
    }

    fetchBookings()
  }, [userEmail, refreshKey])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-500">예약이 없습니다</div>
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">고객사</p>
              <p className="text-lg font-bold">{booking.customer}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">서비스</p>
              <p className="text-lg font-bold">{booking.service}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">날짜</p>
              <p className="text-lg font-bold">{booking.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">시간</p>
              <p className="text-lg font-bold">{booking.time}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500">주소</p>
            <p className="text-gray-800">{booking.address}</p>
          </div>

          <div className="flex justify-between items-center">
            <span
              className={`px-3 py-1 rounded text-sm font-semibold ${
                booking.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {booking.status === 'confirmed' ? '확정됨' : '대기중'}
            </span>
            <p className="text-xs text-gray-400">
              등록: {new Date(booking.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
