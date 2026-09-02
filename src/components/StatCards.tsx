import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface BookingData {
  date: string
  status: string
}

export default function StatCards({ refreshKey }: { refreshKey: number }) {
  const [todayCount, setTodayCount] = useState(0)
  const [confirmRate, setConfirmRate] = useState(0)
  const [weekCount, setWeekCount] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('date, status')

      if (error) {
        console.error('StatCards 조회 실패:', error)
        return
      }

      console.log('StatCards 데이터:', data)

      const bookings = (data || []) as BookingData[]

      if (bookings.length === 0) {
        console.log('데이터 없음')
        setTodayCount(0)
        setConfirmRate(0)
        setWeekCount(0)
        return
      }

      // 오늘 날짜 (로컬 시간대)
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      console.log('오늘 날짜:', todayStr)

      // 오늘 예약 수
      const today_count = bookings.filter((b) => b.date === todayStr).length
      setTodayCount(today_count)
      console.log('오늘 예약:', today_count)

      // 확정률
      const total = bookings.length
      const confirmed = bookings.filter((b) => b.status === 'confirmed').length
      const rate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0
      setConfirmRate(parseFloat(rate as string))
      console.log('확정률:', rate, `(${confirmed}/${total})`)

      // 이번 주 총 건수 (월-금)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const mondayDate = new Date(now.getFullYear(), now.getMonth(), diff)
      const fridayDate = new Date(mondayDate)
      fridayDate.setDate(fridayDate.getDate() + 4)

      const mondayStr = `${mondayDate.getFullYear()}-${String(mondayDate.getMonth() + 1).padStart(2, '0')}-${String(mondayDate.getDate()).padStart(2, '0')}`
      const fridayStr = `${fridayDate.getFullYear()}-${String(fridayDate.getMonth() + 1).padStart(2, '0')}-${String(fridayDate.getDate()).padStart(2, '0')}`

      const week_count = bookings.filter(
        (b) => b.date >= mondayStr && b.date <= fridayStr
      ).length
      setWeekCount(week_count)
      console.log('이번 주:', week_count, `(${mondayStr} ~ ${fridayStr})`)
    }

    fetchStats()
  }, [refreshKey])

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-3xl font-bold text-blue-600">{todayCount}</div>
        <div className="text-gray-500 text-sm mt-2">오늘 예약</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-3xl font-bold text-green-600">{confirmRate}%</div>
        <div className="text-gray-500 text-sm mt-2">확정률</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-3xl font-bold text-purple-600">{weekCount}</div>
        <div className="text-gray-500 text-sm mt-2">이번 주 총 건수</div>
      </div>
    </div>
  )
}
