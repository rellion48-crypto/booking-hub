import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize Kakao SDK
const kakaoApiKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
if (window.kakao && !window.kakao.isInitialized()) {
  window.kakao.init(kakaoApiKey)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
