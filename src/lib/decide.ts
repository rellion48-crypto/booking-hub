import { SLOTS, NEED, requiredSlots, occupied, isAvailable } from './slots'
import type { SlotType } from './slots'

interface DecideResult {
  decision: 'asking' | 'rejected' | 'review' | 'pending' | 'confirmed_auto' | 'confirmed_human'
  reason: string
  options?: string
  candidate?: string
  trace: string[]
}

export function decide(booking: any, allBookings: any[], autoOn: boolean): DecideResult {
  const trace: string[] = []

  // 1. 필수 칸 검사
  if (!booking.kind || !booking.date || !booking.slots_wanted || booking.slots_wanted.length === 0) {
    const missing = []
    if (!booking.kind) missing.push('종류')
    if (!booking.date) missing.push('날짜')
    if (!booking.slots_wanted || booking.slots_wanted.length === 0) missing.push('희망 슬롯')
    trace.push(`1 빈 칸 검사: ${missing.join(', ')}`)
    return {
      decision: 'asking',
      reason: `빈 칸: ${missing.join(', ')}`,
      trace,
    }
  }

  trace.push('1 빈 칸 검사: 없음')

  // wanted를 슬롯 배열로 변환
  const wanted = booking.slots_wanted.split(',').map((s: string) => s.trim()) as SlotType[]

  // 2. 필요한 칸 계산
  const needCount = NEED[booking.kind] || 1
  trace.push(`2 종류 ${booking.kind} -> 필요한 칸 ${needCount}개 (희망 ${wanted.join(', ')})`)

  // 3. 그 날짜의 점유된 칸 확인
  const occupiedSet = occupied(booking.date, allBookings)
  trace.push(
    `3 ${booking.date} 달력: ${SLOTS.map((slot) => `${slot} ${occupiedSet.has(slot) ? 'X' : 'O'}`).join(', ')}`
  )

  // 4. 후보 찾기 - 희망 순서대로 필요한 칸이 전부 비어있는 것 찾기
  const candidates: SlotType[][] = []
  for (let i = 0; i < wanted.length; i++) {
    const slot = wanted[i]
    const req = requiredSlots(booking.kind, [slot])
    if (isAvailable(req, occupiedSet)) {
      candidates.push(req)
    }
  }

  if (candidates.length === 0) {
    const availableSlots = SLOTS.filter((slot) => !occupiedSet.has(slot))
    const availableStr = availableSlots.length > 0 ? availableSlots.join(', ') : '없음'
    trace.push(`4 희망 순서대로 필요한 칸이 전부 O인 후보: 없음`)
    trace.push(`결과: 거절 - 희망 슬롯 전부 찼음`)
    return {
      decision: 'rejected',
      reason: '희망 슬롯 전부 찼음',
      options: availableStr,
      trace,
    }
  }

  const candidateSlots = candidates[0]
  trace.push(`4 희망 순서대로 필요한 칸이 전부 O인 후보: ${candidateSlots.join(', ')}`)

  // 5. 같은 날짜의 다른 pending 예약과 비교
  const sameDatePending = allBookings.filter(
    (b) => b.date === booking.date && b.decision === 'pending' && b.id !== booking.id
  )

  let conflictBooking = null
  for (const other of sameDatePending) {
    const otherWanted = (other.slots_wanted || '').split(',').map((s: string) => s.trim()) as SlotType[]
    const otherCandidates: SlotType[][] = []
    for (let i = 0; i < otherWanted.length; i++) {
      const slot = otherWanted[i]
      const req = requiredSlots(other.kind, [slot])
      if (isAvailable(req, occupiedSet)) {
        otherCandidates.push(req)
      }
    }

    // 다른 예약의 유일한 후보와 우리 후보가 겹칠 때
    if (otherCandidates.length === 1 && candidateSlots.length > 0) {
      const otherSlots = otherCandidates[0]
      const overlap = otherSlots.some((s) => candidateSlots.includes(s))
      if (overlap) {
        conflictBooking = other
        break
      }
    }
  }

  if (conflictBooking) {
    trace.push(
      `5 같은 날 대기 요청 비교: 겹치는 유일 후보 발견 - ${conflictBooking.customer}`
    )
    trace.push(`결과: 검토 필요 - 동점`)
    return {
      decision: 'review',
      reason: `동점 - ${conflictBooking.customer}도 같은 칸이 유일 후보`,
      options: `${booking.customer},${conflictBooking.customer}`,
      trace,
    }
  }

  trace.push(`5 같은 날 대기 요청 비교: 겹치는 유일 후보 없음`)

  if (autoOn) {
    trace.push(`결과: 확정-자동 - 빈 칸 ${candidateSlots.join(', ')} 확정`)
    return {
      decision: 'confirmed_auto',
      reason: `빈 칸 ${candidateSlots.join(', ')} 확정`,
      candidate: candidateSlots.join(','),
      trace,
    }
  } else {
    trace.push(`결과: 대기 - 후보 ${candidateSlots.join(', ')} 확정 버튼 대기`)
    return {
      decision: 'pending',
      reason: `후보 ${candidateSlots.join(', ')} - 확정 버튼 대기`,
      candidate: candidateSlots.join(','),
      trace,
    }
  }
}
