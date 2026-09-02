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
}

export default function BookingTable({ refreshKey, onStatusChange, isAdmin = true }: { refreshKey: number; onStatusChange?: () => void; isAdmin?: boolean }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer, service, date, time, address, status')

      if (error) {
        console.error('조회 실패:', error)
      } else {
        setBookings(data || [])
      }
      setLoading(false)
    }

    fetchBookings()
  }, [refreshKey])

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending'
    console.log(`상태 변경 시도: ID ${id}, ${currentStatus} → ${newStatus}`)

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)
      .select()

    if (error) {
      console.error('상태 업데이트 실패:', error)
    } else {
      console.log('상태 업데이트 성공:', data)
      setBookings(bookings.map((b) =>
        b.id === id ? { ...b, status: newStatus } : b
      ))
      onStatusChange?.()
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-500">예약이 없습니다</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">고객사</th>
            <th className="border border-gray-300 px-4 py-2 text-left">서비스</th>
            <th className="border border-gray-300 px-4 py-2 text-left">날짜</th>
            <th className="border border-gray-300 px-4 py-2 text-left">시간</th>
            <th className="border border-gray-300 px-4 py-2 text-left">주소</th>
            <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{booking.customer}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.service}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.date}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.time}</td>
              <td className="border border-gray-300 px-4 py-2">
                {booking.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {booking.address}
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {isAdmin ? (
                  <button
                    onClick={() => handleStatusToggle(booking.id, booking.status)}
                    className={`px-2 py-1 rounded text-sm cursor-pointer font-semibold ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    {booking.status}
                  </button>
                ) : (
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
