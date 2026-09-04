import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
// import { decide } from '../lib/decide'

interface Booking {
  id: number
  customer: string
  kind: string
  form: string
  memo: string
  date: string
  address: string
  slots_wanted: string
  decision: string
  reason?: string
  options?: string
  candidate?: string
  slot_assigned?: string
  trace?: string
}

const decisionBadgeColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  confirmed_auto: 'bg-green-100 text-green-800',
  confirmed_human: 'border-2 border-green-500 bg-white text-green-800',
  review: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  asking: 'bg-blue-100 text-blue-800',
}

export default function BookingTable({
  refreshKey,
  onStatusChange,
  isAdmin = true,
}: {
  refreshKey: number
  onStatusChange?: () => void
  isAdmin?: boolean
}) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, customer, kind, form, memo, date, address, slots_wanted, decision, reason, options, candidate, slot_assigned, trace'
        )

      if (error) {
        console.error('조회 실패:', error)
      } else {
        const allBookings = data || []
        const undecided = allBookings.filter((b: any) =>
          ['pending', 'review', 'rejected', 'asking'].includes(b.decision)
        )
        setBookings(undecided)
      }
      setLoading(false)
    }

    fetchBookings()
  }, [refreshKey])

  const handleConfirm = async (id: number, candidate: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ decision: 'confirmed_human', slot_assigned: candidate })
      .eq('id', id)

    if (error) {
      console.error('확정 실패:', error)
    } else {
      setBookings(bookings.filter((b) => b.id !== id))
      onStatusChange?.()
    }
  }

  const handleReviewChoice = async (bookingId: number, otherBookingId: number, chosenCustomer: string) => {
    const [chosen, other] = bookings.reduce<[Booking | null, Booking | null]>(
      ([c, o], b) => {
        if (b.customer === chosenCustomer) return [b, o]
        if (b.id === otherBookingId) return [c, b]
        return [c, o]
      },
      [null, null]
    )

    if (!chosen || !other) return

    const allBookings = await supabase.from('bookings').select('*')
    if (allBookings.error) {
      console.error('조회 실패:', allBookings.error)
      return
    }

    // TODO: decide 함수 통합 후 활성화
    const chosenDecision = { decision: 'confirmed_human', reason: '', trace: [] }
    const otherDecision = { decision: 'pending', reason: '', trace: [] }

    await Promise.all([
      supabase
        .from('bookings')
        .update({
          decision: 'confirmed_human',
          slot_assigned: chosenDecision.candidate,
          reason: chosenDecision.reason,
          trace: chosenDecision.trace.join('\n'),
        })
        .eq('id', chosen.id),
      supabase
        .from('bookings')
        .update({
          decision: otherDecision.decision,
          reason: otherDecision.reason,
          options: otherDecision.options || '',
          candidate: otherDecision.candidate || '',
          trace: otherDecision.trace.join('\n'),
        })
        .eq('id', other.id),
    ])

    setBookings(bookings.filter((b) => b.id !== chosen.id && b.id !== other.id))
    onStatusChange?.()
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-500">미확정 예약이 없습니다</div>
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const isExpanded = expandedId === booking.id
        const trace = booking.trace ? booking.trace.split('\n') : []
        const options = booking.options ? booking.options.split(',') : []

        return (
          <div key={booking.id} className="border border-gray-300 rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{booking.customer}</h3>
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${decisionBadgeColor[booking.decision]}`}>
                    {booking.decision}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{booking.reason}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>종류: {booking.kind} | 형태: {booking.form} | 날짜: {booking.date}</p>
                  <p>메모: {booking.memo}</p>
                  <p>희망 슬롯: {booking.slots_wanted}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {booking.decision === 'pending' && booking.candidate && (
                  <button
                    onClick={() => handleConfirm(booking.id, booking.candidate!)}
                    className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                  >
                    확정
                  </button>
                )}

                {booking.decision === 'review' && options.length === 2 && (
                  <div className="space-y-2">
                    {options.map((customer) => (
                      <button
                        key={customer}
                        onClick={() =>
                          handleReviewChoice(
                            booking.id,
                            bookings.find(
                              (b) =>
                                b.decision === 'review' && b.id !== booking.id && options.includes(b.customer)
                            )?.id || 0,
                            customer.trim()
                          )
                        }
                        className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 w-full"
                      >
                        {customer.trim()} 확정
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  {isExpanded ? '과정 숨김' : '과정 보기'}
                </button>
              </div>
            </div>

            {isExpanded && trace.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                <ol className="text-sm text-gray-700 space-y-1">
                  {trace.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
