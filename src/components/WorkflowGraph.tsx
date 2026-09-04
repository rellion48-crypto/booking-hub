import { useEffect, useState } from 'react'

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

interface WorkflowGraphProps {
  counts: NodeCounts
  lastPath?: HighlightPath
}

const nodeColors: Record<string, string> = {
  접수: '#f3f4f6',
  대기: '#e5e7eb',
  판정: 'white',
  확정_자동: '#dcfce7',
  확정_수동: '#dcfce7',
  검토: '#fef3c7',
  기각: '#fee2e2',
  질문: '#dbeafe',
}

const nodeTextColors: Record<string, string> = {
  접수: 'black',
  대기: 'black',
  판정: 'black',
  확정_자동: 'black',
  확정_수동: 'black',
  검토: 'black',
  기각: 'black',
  질문: 'black',
}

const nodeBorders: Record<string, string> = {
  접수: '#d1d5db',
  대기: '#d1d5db',
  판정: 'black',
  확정_자동: '#16a34a',
  확정_수동: '#16a34a',
  검토: '#ca8a04',
  기각: '#dc2626',
  질문: '#0284c7',
}

const positions: Record<string, [number, number]> = {
  접수: [100, 150],
  대기: [250, 150],
  판정: [400, 150],
  확정_자동: [550, 50],
  확정_수동: [550, 150],
  검토: [550, 250],
  기각: [700, 150],
  질문: [700, 50],
}

export default function WorkflowGraph({ counts, lastPath }: WorkflowGraphProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [])

  const isPathHighlighted = lastPath && now - lastPath.until < 2000

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4">워크플로</h3>
      <svg width="100%" height="400" viewBox="0 0 800 350" className="border border-gray-200 rounded">
        {/* 화살표 정의 */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#666" />
          </marker>
          <marker id="arrowhead-bold" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#ff6b6b" />
          </marker>
        </defs>

        {/* 화살표들 */}
        {[
          ['접수', '대기'],
          ['대기', '판정'],
          ['판정', '확정_자동'],
          ['판정', '확정_수동'],
          ['판정', '검토'],
          ['판정', '기각'],
          ['판정', '질문'],
          ['검토', '확정_수동'],
          ['질문', '대기'],
          ['확정_수동', '대기'],
        ].map(([from, to], idx) => {
          const [x1, y1] = positions[from]
          const [x2, y2] = positions[to]
          const highlighted =
            isPathHighlighted && ((lastPath!.from === from && lastPath!.to === to) ||
            (lastPath!.from === to && lastPath!.to === from))
          return (
            <line
              key={idx}
              x1={x1 + 40}
              y1={y1}
              x2={x2 - 40}
              y2={y2}
              stroke={highlighted ? '#ff6b6b' : '#999'}
              strokeWidth={highlighted ? 3 : 1}
              markerEnd={highlighted ? 'url(#arrowhead-bold)' : 'url(#arrowhead)'}
            />
          )
        })}

        {/* 노드들 */}
        {Object.entries(counts).map(([nodeKey, count]) => {
          const nodeId = nodeKey.replace(/_/g, '-')
          const [x, y] = positions[nodeKey]
          const displayKey = nodeKey.replace(/_/g, '/')

          return (
            <g key={nodeId}>
              <circle
                cx={x}
                cy={y}
                r="40"
                fill={nodeColors[nodeKey]}
                stroke={nodeBorders[nodeKey]}
                strokeWidth="2"
              />
              <text x={x} y={y - 10} textAnchor="middle" fontSize="12" fontWeight="bold">
                {displayKey}
              </text>
              <text x={x} y={y + 15} textAnchor="middle" fontSize="18" fontWeight="bold">
                {count}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
