import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { judge } from '../lib/judge'

interface BookingFormProps {
  onSuccess: () => void
  userEmail: string
}

const SLOTS = ['오전', '오후-1', '오후-2'] as const
type SlotType = typeof SLOTS[number]

export default function BookingForm({ onSuccess, userEmail }: BookingFormProps) {
  const [customer, setCustomer] = useState('')
  const [kind, setKind] = useState('')
  const [form, setForm] = useState('')
  const [memo, setMemo] = useState('')
  const [address, setAddress] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<{ slot: SlotType; priority: number }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const judgment = judge({ customer, kind, form, memo, address, date, slots })

  const toggleSlot = (slot: SlotType) => {
    setSlots((prev) => {
      const exists = prev.find((s) => s.slot === slot)
      if (exists) {
        return prev.filter((s) => s.slot !== slot)
      } else {
        const newSlots = [...prev, { slot, priority: prev.length + 1 }]
        return newSlots.sort((a, b) => a.priority - b.priority)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (judgment.route === 'ask') {
      setError(`필수 항목을 입력해주세요: ${judgment.message}`)
      return
    }

    setLoading(true)
    const slotsWanted = slots.map((s) => s.slot).join(',')

    const { data: { session } } = await supabase.auth.getSession()

    const { error: insertError } = await supabase.from('bookings').insert({
      customer,
      kind,
      form,
      memo,
      address,
      date,
      time: '',
      slots_wanted: slotsWanted,
      decision: 'pending',
      status: 'pending',
      service: memo,
      email: userEmail,
      via: 'form',
    })

    if (insertError) {
      setError('예약 추가 실패: ' + insertError.message)
      setLoading(false)
    } else {
      try {
        const refreshToken = session?.provider_token
        if (refreshToken && session?.access_token) {
          console.log('🚀 Edge Function 호출 중...')
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-to-calendar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              refreshToken,
              customer,
              service: memo,
              date,
              time: '',
              address,
            }),
          })
        }
      } catch (err) {
        console.error('구글 캘린더 연동 에러:', err)
      }

      setCustomer('')
      setKind('')
      setForm('')
      setMemo('')
      setAddress('')
      setDate('')
      setSlots([])
      setLoading(false)
      onSuccess()
    }
  }

  return (
    <div className="space-y-6 mb-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">새 예약 추가</h2>
          <div
            className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${judgment.badgeColor}`}
          >
            {judgment.route === 'ask' ? '빈 칸' : '준비됨'}
          </div>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">고객사</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">종류</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">선택하세요</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="지방">지방</option>
                <option value="내부">내부</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">형태</label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">선택하세요</option>
                <option value="외근">외근</option>
                <option value="온라인">온라인</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">메모</label>
            <input
              type="text"
              placeholder="미팅, 기획 회의 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {form === '외근' && (
            <div>
              <label className="block text-sm font-semibold mb-1">위치</label>
              <input
                type="text"
                placeholder="위치를 입력하세요"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">희망 슬롯 (체크 순서가 우선순위)</label>
            <div className="space-y-2">
              {SLOTS.map((slot) => {
                const priority = slots.find((s) => s.slot === slot)?.priority
                return (
                  <label key={slot} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priority !== undefined}
                      onChange={() => toggleSlot(slot)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1">{slot}</span>
                    {priority !== undefined && (
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        {priority}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || judgment.route === 'ask'}
          className="w-full mt-6 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '추가 중...' : '예약하기'}
        </button>
      </form>
    </div>
  )
}
