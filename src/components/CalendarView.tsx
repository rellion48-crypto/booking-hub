import { useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { supabase } from '../lib/supabase'

const locales = { ko }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

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

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: Booking
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
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      let query = supabase.from('bookings').select('*')

      // Non-admin users only see their own bookings
      if (!isAdmin && userEmail) {
        query = query.eq('email', userEmail)
      }

      const { data, error } = await query.order('date', { ascending: true })

      if (error) {
        console.error('조회 실패:', error)
        setEvents([])
      } else {
        // Convert bookings to calendar events
        const calendarEvents: CalendarEvent[] = (data || []).map(
          (booking: Booking) => {
            const [hours, minutes] = booking.time.split(':').map(Number)
            const start = new Date(booking.date)
            start.setHours(hours, minutes, 0)

            const end = new Date(start)
            end.setHours(end.getHours() + 1)

            return {
              id: booking.id,
              title: `${booking.service} - ${booking.customer}`,
              start,
              end,
              resource: booking,
            }
          }
        )
        setEvents(calendarEvents)
      }
      setLoading(false)
    }

    fetchBookings()
  }, [refreshKey, isAdmin, userEmail])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>
  }

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6' // blue
    if (event.resource.status === 'confirmed') {
      backgroundColor = '#10b981' // green
    } else if (event.resource.status === 'pending') {
      backgroundColor = '#f59e0b' // amber
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">
        {isAdmin ? '전체 예약 캘린더' : '내 예약 캘린더'}
      </h2>

      <div style={{ height: 700 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          popup
          views={['month', 'week', 'day']}
          defaultView="month"
          onSelectEvent={(event) => {
            const booking = event.resource
            alert(
              `예약 정보\n고객사: ${booking.customer}\n서비스: ${booking.service}\n날짜: ${booking.date}\n시간: ${booking.time}\n주소: ${booking.address}\n상태: ${booking.status === 'confirmed' ? '확정됨' : '대기중'}`
            )
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">확정됨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-sm text-gray-600">대기중</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">기타</span>
        </div>
      </div>
    </div>
  )
}
