import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import BookingForm from './components/BookingForm'
import BookingTable from './components/BookingTable'
import Dashboard from './components/Dashboard'
import LoginPage from './components/LoginPage'
import ChatBox from './components/ChatBox'
import MyBookings from './components/MyBookings'
import CalendarView from './components/CalendarView'

type TabType = '대시보드' | '예약목록' | '예약추가' | '미확정 관리' | '위치확인' | '캘린더' | '채팅' | '내 예약'

const ADMIN_EMAIL = 'rellion48@gmail.com'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('예약추가')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)
      setLoading(false)

      // Set initial tab based on user role
      if (currentUser?.email === ADMIN_EMAIL) {
        setActiveTab('대시보드')
      } else {
        setActiveTab('예약추가')
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user || null
        setUser(currentUser)

        // Save refresh token for Google Calendar
        if (session?.provider_refresh_token) {
          localStorage.setItem('google_refresh_token', session.provider_refresh_token)
        }

        // Update tab based on role on auth change
        if (currentUser?.email === ADMIN_EMAIL) {
          setActiveTab('대시보드')
        } else {
          setActiveTab('예약추가')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleFormSuccess = () => {
    handleRefresh()
    if (isAdmin) {
      setActiveTab('예약목록')
    } else {
      setActiveTab('내 예약')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const isAdmin = user?.email === ADMIN_EMAIL

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  const tabs: TabType[] = isAdmin
    ? ['대시보드', '예약목록', '예약추가', '미확정 관리', '위치확인', '캘린더', '채팅']
    : ['예약추가', '내 예약', '캘린더', '채팅']

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 - 네이버 스타일 */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900">예약 관리 허브</h1>
            {isAdmin && (
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded text-sm font-semibold border border-green-200">
                관리자
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 - 네이버 스타일 */}
        <div className="border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6 flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-green-600 border-green-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 컨텐츠 영역 */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {activeTab === '대시보드' && <Dashboard refreshKey={refreshKey} />}

        {activeTab === '예약목록' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">예약 목록</h2>
            <BookingTable refreshKey={refreshKey} onStatusChange={handleRefresh} isAdmin={isAdmin} />
          </div>
        )}

        {activeTab === '예약추가' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">새 예약 추가</h2>
            <BookingForm onSuccess={handleFormSuccess} userEmail={user.email} />
          </div>
        )}

        {activeTab === '미확정 관리' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">미확정 관리</h2>
            <BookingTable refreshKey={refreshKey} onStatusChange={handleRefresh} isAdmin={isAdmin} />
          </div>
        )}

        {activeTab === '위치확인' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">위치 확인</h2>
            <BookingTable refreshKey={refreshKey} onStatusChange={handleRefresh} showAll={true} />
          </div>
        )}

        {activeTab === '캘린더' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">캘린더</h2>
            <CalendarView refreshKey={refreshKey} isAdmin={isAdmin} userEmail={user.email} />
          </div>
        )}

        {activeTab === '채팅' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">채팅</h2>
            <ChatBox userEmail={user.email} userName={user.user_metadata?.name || user.email} isAdmin={isAdmin} />
          </div>
        )}

        {activeTab === '내 예약' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">내 예약 현황</h2>
            <MyBookings userEmail={user.email} refreshKey={refreshKey} />
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-50 border-t border-gray-300 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-gray-600">
          <p>© 2026 예약 관리 허브. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
