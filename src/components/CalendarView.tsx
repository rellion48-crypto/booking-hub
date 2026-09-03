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
  email?: string
}

interface CalendarViewProps {
  refreshKey: number
  isAdmin: boolean
  userEmail?: string
}

export default function CalendarView({
  refreshKey,
  isAdmin,
  userEmail,
}: CalendarViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      let query = supabase.from('bookings').select('*')

      if (!isAdmin && userEmail) {
        query = query.eq('email', userEmail)
      }

      const { data, error } = await query.order('date', { ascending: true })

      if (error) {
        console.error('조회 실패:', error)
        setBookings([])
      } else {
        setBookings(data || [])
        if (data && data.length > 0) {
          setSelectedDate(data[0].date)
        }
      }
      setLoading(false)
    }

    fetchBookings()
  }, [refreshKey, isAdmin, userEmail])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>
  }

  // Group bookings by date
  const groupedByDate = bookings.reduce(
    (acc, booking) => {
      if (!acc[booking.date]) {
        acc[booking.date] = []
      }
      acc[booking.date].push(booking)
      return acc
    },
    {} as Record<string, Booking[]>
  )

  const sortedDates = Object.keys(groupedByDate).sort()
  const displayBookings = selectedDate ? groupedByDate[selectedDate] || [] : []

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isAdmin ? '전체 예약' : '내 예약'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Date List */}
        <div className="lg:col-span-1">
          <h3 className="font-bold text-gray-700 mb-3">날짜 선택</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {sortedDates.length === 0 ? (
              <p className="text-sm text-gray-500">예약이 없습니다</p>
            ) : (
              sortedDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full text-left p-3 rounded transition-colors ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{date}</div>
                  <div className="text-xs">
                    {groupedByDate[date].length}개 예약
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Bookings for Selected Date */}
        <div className="lg:col-span-3">
          {selectedDate && (
            <>
              <h3 className="font-bold text-gray-700 mb-3">
                {selectedDate} 예약 ({displayBookings.length}개)
              </h3>
              <div className="space-y-3">
                {displayBookings.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    이 날짜의 예약이 없습니다
                  </p>
                ) : (
                  displayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">고객사</p>
                          <p className="font-semibold text-gray-800">
                            {booking.customer}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">서비스</p>
                          <p className="font-semibold text-gray-800">
                            {booking.service}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">시간</p>
                          <p className="font-semibold text-gray-800">
                            {booking.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">상태</p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {booking.status === 'confirmed'
                              ? '확정됨'
                              : '대기중'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">주소</p>
                        <a
                          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                            booking.address
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {booking.address}
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
