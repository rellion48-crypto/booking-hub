import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface ChatMessage {
  id: number
  nickname: string
  message: string
  created_at: string
  is_admin: boolean
}

interface ChatBoxProps {
  userEmail: string
  userName: string
  isAdmin: boolean
}

export default function ChatBox({ userEmail, userName, isAdmin }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get nickname
  const getNickname = (): string => {
    if (isAdmin) {
      return '관리자'
    }
    // Google 닉네임 앞 4글자 + ***
    const namePart = userName.substring(0, 4)
    return `${namePart}***`
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)

      if (!error) {
        setMessages(data || [])
        setTimeout(scrollToBottom, 100)
      }
    }

    fetchMessages()

    // Subscribe to realtime updates
    const channel = supabase.channel('public:chat_messages', {
      config: {
        broadcast: { self: true }
      }
    })

    channel
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload: any) => {
          console.log('Realtime update:', payload)
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as ChatMessage])
            setTimeout(scrollToBottom, 100)
          }
        }
      )
      .subscribe((status) => {
        console.log('Channel subscription status:', status)
      })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    setLoading(true)

    const { error } = await supabase.from('chat_messages').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      email: userEmail,
      nickname: getNickname(),
      message: inputValue,
      is_admin: isAdmin,
    })

    if (!error) {
      setInputValue('')
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-96 flex flex-col">
      <h2 className="text-xl font-bold mb-4">실시간 채팅</h2>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm">메시지가 없습니다</div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-bold ${
                      msg.is_admin ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {msg.nickname}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800 mt-1">{msg.message}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 text-sm"
        >
          전송
        </button>
      </form>
    </div>
  )
}
