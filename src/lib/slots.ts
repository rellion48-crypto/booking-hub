export const SLOTS = ['오전', '오후-1', '오후-2'] as const
export type SlotType = typeof SLOTS[number]

export const NEED: Record<string, number> = {
  서울: 1,
  내부: 1,
  경기: 2,
  지방: 3,
}

export function requiredSlots(kind: string, wanted: SlotType[]): SlotType[] {
  if (kind === '서울' || kind === '내부') {
    return wanted.length > 0 ? [wanted[0]] : []
  }

  if (kind === '경기') {
    if (wanted.length === 0) return []
    const first = wanted[0]
    if (first === '오전') return ['오전', '오후-1']
    if (first === '오후-1') return ['오후-1', '오전', '오후-2']
    if (first === '오후-2') return ['오후-2', '오후-1']
    return []
  }

  if (kind === '지방') {
    return SLOTS
  }

  return []
}

export function occupied(date: string, bookings: any[]): Set<SlotType> {
  const occupied = new Set<SlotType>()
  bookings.forEach((booking) => {
    if (
      booking.date === date &&
      (booking.decision === 'confirmed_auto' || booking.decision === 'confirmed_human') &&
      booking.slot_assigned
    ) {
      const slots = booking.slot_assigned.split(',') as SlotType[]
      slots.forEach((slot) => occupied.add(slot))
    }
  })
  return occupied
}

export function isAvailable(required: SlotType[], occupiedSet: Set<SlotType>): boolean {
  return required.every((slot) => !occupiedSet.has(slot))
}
