import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import BookingForm from './components/BookingForm'
import BookingTable from './components/BookingTable'
import StatCards from './components/StatCards'
import LoginPage from './components/LoginPage'

type TabType = '대시보드' | '예약목록' | '예약추가' | '상태관리' | '위치확인'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('대시보드')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleFormSuccess = () => {
    handleRefresh()
    setActiveTab('예약목록')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  const tabs: TabType[] = ['대시보드', '예약목록', '예약추가', '상태관리', '위치확인']

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">예약 관리 허브</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm font-semibold"
            >
              로그아웃
            </button>
          </div>
        </div>

        {activeTab === '대시보드' && <StatCards refreshKey={refreshKey} />}

        {activeTab === '예약목록' && (
          <BookingTable refreshKey={refreshKey} onStatusChange={handleRefresh} />
        )}

        {activeTab === '예약추가' && (
          <BookingForm onSuccess={handleFormSuccess} />
        )}

        {activeTab === '상태관리' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">상태 관리</h2>
            <BookingTable refreshKey={refreshKey} onStatusChange={handleRefresh} />
          </div>
        )}

        {activeTab === '위치확인' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">위치 확인</h2>
            <BookingTable refreshKey={refreshKey} onStatusChange={handleRefresh} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around max-w-4xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
