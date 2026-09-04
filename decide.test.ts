// decide 로직 테스트 (수동 검증용)

import { decide } from './src/lib/decide'

// 테스트 케이스 1: 기본 case - 서울, 한 칸만 필요
const booking1 = {
  id: 1,
  customer: 'A사',
  kind: '서울',
  form: '외근',
  memo: '미팅',
  date: '2026-09-05',
  address: '강남역',
  slots_wanted: '오전,오후-1',
  decision: 'pending',
}

const allBookings1 = [booking1]
const result1 = decide(booking1, allBookings1, true)
console.log('Test 1 - 서울, 한 칸 필요:')
console.log('Expected: confirmed_auto (오전)')
console.log('Actual:', result1.decision, result1.candidate)
console.log('Trace:', result1.trace)
console.log()

// 테스트 케이스 2: 경기 - 2개 칸 필요
const booking2 = {
  id: 2,
  customer: 'B사',
  kind: '경기',
  form: '외근',
  memo: '기획회의',
  date: '2026-09-05',
  address: '성남',
  slots_wanted: '오후-1',
  decision: 'pending',
}

const allBookings2 = [booking2]
const result2 = decide(booking2, allBookings2, true)
console.log('Test 2 - 경기, 오후-1 선택 (2개 칸 필요):')
console.log('Expected: confirmed_auto (오후-1,오전 또는 오후-1,오후-2)')
console.log('Actual:', result2.decision, result2.candidate)
console.log('Trace:', result2.trace)
console.log()

// 테스트 케이스 3: 점유된 칸 - 기각
const booking3 = {
  id: 3,
  customer: 'C사',
  kind: '서울',
  form: '온라인',
  memo: '회의',
  date: '2026-09-05',
  slots_wanted: '오전',
  decision: 'pending',
}

const bookedBooking = {
  id: 99,
  customer: 'X사',
  kind: '지방',
  form: '외근',
  memo: 'x',
  date: '2026-09-05',
  address: 'x',
  slots_wanted: '오전',
  decision: 'confirmed_auto',
  slot_assigned: '오전,오후-1,오후-2',
}

const allBookings3 = [booking3, bookedBooking]
const result3 = decide(booking3, allBookings3, true)
console.log('Test 3 - 모든 칸 점유 (기각):')
console.log('Expected: rejected')
console.log('Actual:', result3.decision)
console.log('Trace:', result3.trace)
console.log()

// 테스트 케이스 4: 동점
const booking4a = {
  id: 4,
  customer: 'D사',
  kind: '서울',
  form: '외근',
  memo: '미팅',
  date: '2026-09-06',
  address: '강남',
  slots_wanted: '오전',
  decision: 'pending',
}

const booking4b = {
  id: 5,
  customer: 'E사',
  kind: '서울',
  form: '외근',
  memo: '미팅',
  date: '2026-09-06',
  address: '강남',
  slots_wanted: '오전',
  decision: 'pending',
}

const allBookings4 = [booking4a, booking4b]
const result4a = decide(booking4a, allBookings4, true)
const result4b = decide(booking4b, allBookings4, true)
console.log('Test 4 - 동점 (같은 날 두 예약, 같은 슬롯 희망):')
console.log('Result A:', result4a.decision, '- Expected: review')
console.log('Result B:', result4b.decision, '- Expected: review')
console.log('Trace A:', result4a.trace)
