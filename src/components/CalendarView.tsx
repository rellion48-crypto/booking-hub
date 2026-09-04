import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Booking {
  id: number
  customer: string
  kind: string
  form: string
  memo: string
  date: string
  address: string
  slot_assigned?: string
  decision: string
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
      let query = supabase.from('bookings').select(
        'id, customer, kind, form, memo, date, address, slot_assigned, decision, status, created_at, email'
      )

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

  const decisionColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    confirmed_auto: 'bg-green-100 text-green-800',
    confirmed_human: 'bg-green-100 text-green-800',
    review: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    asking: 'bg-blue-100 text-blue-800',
  }

  const decisionDisplay: Record<string, string> = {
    pending: '대기',
    confirmed_auto: '확정-자동',
    confirmed_human: '확정-수동',
    review: '검토',
    rejected: '거절',
    asking: '질문',
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900">
        {isAdmin ? '전체 예약' : '내 예약'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Date List */}
        <div className="lg:col-span-1">
          <h3 className="font-bold text-sm text-gray-900 mb-3">날짜 선택</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-3">
            {sortedDates.length === 0 ? (
              <p className="text-sm text-gray-500">예약이 없습니다</p>
            ) : (
              sortedDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full text-left p-3 rounded transition-colors text-sm ${
                    selectedDate === date
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{date}</div>
                  <div className="text-xs opacity-80">
                    {groupedByDate[date].length}개
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
              <h3 className="font-bold text-gray-900 mb-4 text-sm">
                {selectedDate} 예약 ({displayBookings.length}개)
              </h3>
              <div className="space-y-3">
                {displayBookings.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 text-sm">
                    이 날짜의 예약이 없습니다
                  </p>
                ) : (
                  displayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-300 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                    >
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">고객사</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {booking.customer}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">종류 · 형태</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {booking.kind} · {booking.form}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">메모</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {booking.memo}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">판정</p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              decisionColors[booking.decision] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {decisionDisplay[booking.decision] || booking.decision}
                          </span>
                        </div>
                      </div>

                      {booking.slot_assigned && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-600">확정 슬롯</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {booking.slot_assigned}
                          </p>
                        </div>
                      )}

                      {booking.address && (
                        <div>
                          <p className="text-xs text-gray-600">위치</p>
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(
                              booking.address
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 underline text-sm"
                          >
                            {booking.address}
                          </a>
                        </div>
                      )}
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
