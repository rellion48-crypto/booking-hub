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
      console.log('✅ 예약 저장 성공')
      try {
        const { data } = await supabase.auth.getSession()
        const currentSession = data.session
        const refreshToken = currentSession?.provider_token

        console.log('📋 Session 정보:', {
          hasSession: !!currentSession,
          hasRefreshToken: !!refreshToken,
          hasAccessToken: !!currentSession?.access_token,
          provider: currentSession?.user?.app_metadata?.provider,
        })

        if (refreshToken && currentSession?.access_token) {
          console.log('📅 구글 캘린더에 이벤트 추가 중...')
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-to-calendar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentSession!.access_token}`,
            },
            body: JSON.stringify({
              refreshToken,
              customer,
              service: memo,
              date,
              time: '', // 슬롯 모델에서는 시간이 확정되지 않음
              address,
            }),
          })

          console.log('📡 Edge Function 응답:', { status: response.status })

          if (response.ok) {
            const result = await response.json()
            console.log('✅ 구글 캘린더 이벤트 추가됨:', result.eventId)
          } else {
            const error = await response.json()
            console.warn('⚠️ 구글 캘린더 추가 실패:', error)
          }
        } else {
          console.log('⏭️ Google 토큰 없음 - 캘린더 연동 건너뜀', {
            refreshToken: !!refreshToken,
            accessToken: !!currentSession?.access_token,
          })
        }
      } catch (err) {
        console.error('❌ 구글 캘린더 연동 에러:', err)
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
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">예약 정보 입력</h3>
          <div
            className={`px-3 py-1 rounded text-white text-xs font-semibold ${
              judgment.route === 'ask'
                ? 'bg-blue-500'
                : 'bg-green-500'
            }`}
          >
            {judgment.route === 'ask' ? '입력 필요' : '준비됨'}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">고객사</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="고객사명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">종류</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                <option value="">선택하세요</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="지방">지방</option>
                <option value="내부">내부</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">형태</label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                <option value="">선택하세요</option>
                <option value="외근">외근</option>
                <option value="온라인">온라인</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">메모</label>
            <input
              type="text"
              placeholder="미팅, 기획 회의 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {form === '외근' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">위치 <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="위치를 입력하세요"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">외근일 경우 필수입니다</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">희망 시간대</label>
            <p className="text-xs text-gray-600 mb-2">체크한 순서가 우선순위입니다</p>
            <div className="space-y-2">
              {SLOTS.map((slot) => {
                const priority = slots.find((s) => s.slot === slot)?.priority
                return (
                  <label key={slot} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priority !== undefined}
                      onChange={() => toggleSlot(slot)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="flex-1 text-sm text-gray-900">{slot}</span>
                    {priority !== undefined && (
                      <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {priority}순위
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || judgment.route === 'ask'}
            className="w-full py-2.5 bg-green-600 text-white font-semibold rounded text-sm hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '예약 추가 중...' : '예약하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
