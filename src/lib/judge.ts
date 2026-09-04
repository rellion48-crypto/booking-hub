interface JudgeInput {
  customer: string
  kind: string
  form: string
  memo: string
  address: string
  date: string
  slots: { slot: string; priority: number }[]
}

interface JudgeResult {
  route: 'ask' | 'book'
  message: string
  badgeColor: string
}

export function judge(input: JudgeInput): JudgeResult {
  const missing: string[] = []

  if (!input.customer) missing.push('고객사')
  if (!input.kind) missing.push('종류')
  if (!input.form) missing.push('형태')
  if (!input.date) missing.push('날짜')
  if (input.slots.length === 0) missing.push('희망 슬롯')

  if (input.form === '외근' && !input.address) {
    missing.push('위치')
  }

  if (missing.length > 0) {
    return {
      route: 'ask',
      message: missing.join(', '),
      badgeColor: 'bg-blue-500',
    }
  }

  return {
    route: 'book',
    message: '예약 준비 완료',
    badgeColor: 'bg-green-500',
  }
}
