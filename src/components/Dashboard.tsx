import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { decide as decideFunc } from '../lib/decide'
import WorkflowGraph from './WorkflowGraph'

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
  candidate?: string
  slot_assigned?: string
  trace?: string
  options?: string
}

interface LogEntry {
  timestamp: Date
  customer: string
  decision: string
  trace: string[]
}

interface NodeCounts {
  접수: number
  대기: number
  판정: number
  확정_자동: number
  확정_수동: number
  검토: number
  기각: number
  질문: number
}

interface HighlightPath {
  from: string
  to: string
  until: number
}

const decisionDisplay: Record<string, string> = {
  pending: '대기',
  confirmed_auto: '확정-자동',
  confirmed_human: '확정-수동',
  review: '검토',
  rejected: '기각',
  asking: '질문',
}

const decisionColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  confirmed_auto: 'bg-green-100 text-green-800',
  confirmed_human: 'border-2 border-green-500 bg-white text-green-800',
  review: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  asking: 'bg-blue-100 text-blue-800',
}

export default function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [autoJudge, setAutoJudge] = useState(() => {
    const saved = localStorage.getItem('auto-judge')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [counts, setCounts] = useState<NodeCounts>({
    접수: 0,
    대기: 0,
    판정: 0,
    확정_자동: 0,
    확정_수동: 0,
    검토: 0,
    기각: 0,
    질문: 0,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastPath, setLastPath] = useState<HighlightPath | undefined>()

  useEffect(() => {
    localStorage.setItem('auto-judge', JSON.stringify(autoJudge))
  }, [autoJudge])

  const fetchBookings = async () => {
    const { data, error } = await supabase.from('bookings').select('*')
    if (error) {
      console.error('조회 실패:', error)
      return
    }

    setBookings(data || [])
    updateCounts(data || [])
  }

  const addLog = (customer: string, decision: string, trace: string[]) => {
    setLogs((prev) => [
      {
        timestamp: new Date(),
        customer,
        decision,
        trace,
      },
      ...prev,
    ].slice(0, 12))
  }

  const updateCounts = (allBookings: Booking[]) => {
    const newCounts: NodeCounts = {
      접수: 0,
      대기: 0,
      판정: 0,
      확정_자동: 0,
      확정_수동: 0,
      검토: 0,
      기각: 0,
      질문: 0,
    }

    allBookings.forEach((booking) => {
      if (!booking.decision) {
        newCounts.접수++
      } else if (booking.decision === 'pending') {
        newCounts.대기++
      } else if (booking.decision === 'confirmed_auto') {
        newCounts.확정_자동++
      } else if (booking.decision === 'confirmed_human') {
        newCounts.확정_수동++
      } else if (booking.decision === 'review') {
        newCounts.검토++
      } else if (booking.decision === 'rejected') {
        newCounts.기각++
      } else if (booking.decision === 'asking') {
        newCounts.질문++
      }
    })

    setCounts(newCounts)
  }

  const handleJudgeAll = async () => {
    const { data: allBookings, error } = await supabase.from('bookings').select('*')
    if (error || !allBookings) {
      console.error('조회 실패:', error)
      return
    }

    const pendingBookings = allBookings.filter((b: any) => b.decision === 'pending')

    for (const booking of pendingBookings) {
      try {
        const result = decideFunc(booking, allBookings, autoJudge)

        const updates: any = {
          decision: result.decision,
          reason: result.reason,
          trace: result.trace.join('\n'),
        }

        if (result.options) updates.options = result.options
        if (result.candidate) {
          updates.candidate = result.candidate
          updates.slot_assigned = result.candidate
        }

        await supabase.from('bookings').update(updates).eq('id', booking.id)

        addLog(booking.customer, result.decision, result.trace)
        setLastPath({
          from: '판정',
          to: decisionDisplay[result.decision],
          until: Date.now(),
        })
      } catch (err) {
        console.error('판정 에러:', err, booking)
      }
    }

    fetchBookings()
  }

  useEffect(() => {
    fetchBookings()

    const channel = supabase
      .channel('bookings-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          fetchBookings()
          if (payload.eventType === 'UPDATE' && (payload.new.decision || payload.new.trace)) {
            addLog(
              payload.new.customer,
              payload.new.decision,
              payload.new.trace ? payload.new.trace.split('\n') : []
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshKey])

  const bookingsByDecision = {
    pending: bookings.filter((b) => b.decision === 'pending'),
    confirmed_auto: bookings.filter((b) => b.decision === 'confirmed_auto'),
    confirmed_human: bookings.filter((b) => b.decision === 'confirmed_human'),
    review: bookings.filter((b) => b.decision === 'review'),
    rejected: bookings.filter((b) => b.decision === 'rejected'),
    asking: bookings.filter((b) => b.decision === 'asking'),
  }

  return (
    <div className="space-y-6">
      {/* 제어 패널 */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 flex gap-4 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoJudge}
            onChange={(e) => setAutoJudge(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm font-semibold text-gray-900">자동 판정</span>
        </label>
        <button
          onClick={handleJudgeAll}
          className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 transition"
        >
          전부 판정
        </button>
      </div>

      {/* 워크플로 그래프 */}
      <WorkflowGraph counts={counts} lastPath={lastPath} />

      {/* 판정 로그 */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">판정 로그</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">판정 로그가 없습니다</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                  <span className="font-semibold">{log.customer}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${decisionColors[log.decision]}`}>
                    {decisionDisplay[log.decision]}
                  </span>
                </div>
                {log.trace.length > 0 && (
                  <ol className="text-xs text-gray-600 space-y-0.5 ml-2">
                    {log.trace.slice(-3).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 상태 보드 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">상태 보드</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(bookingsByDecision).map(([decision, cards]) => (
            <div key={decision}>
              <h4 className="font-semibold mb-2 text-sm text-gray-900">{decisionDisplay[decision]} ({cards.length})</h4>
              <div className="space-y-2">
                {cards.map((booking) => (
                  <div key={booking.id} className={`p-3 rounded-lg border text-sm ${decisionColors[decision]}`}>
                    <p className="font-semibold text-sm">{booking.customer}</p>
                    <p className="text-xs text-gray-600">{booking.date}</p>
                    <p className="text-xs text-gray-600">
                      {booking.kind} · {booking.form}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{booking.memo}</p>
                    {booking.slot_assigned && (
                      <p className="text-xs font-semibold mt-1 text-green-700">{booking.slot_assigned}</p>
                    )}
                    {booking.reason && !booking.slot_assigned && (
                      <p className="text-xs mt-1 line-clamp-2">{booking.reason}</p>
                    )}
                    {decision === 'review' && booking.options && (
                      <p className="text-xs text-gray-500 mt-1">{booking.options}</p>
                    )}
                  </div>
                ))}
                {cards.length === 0 && <p className="text-xs text-gray-400">없음</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
