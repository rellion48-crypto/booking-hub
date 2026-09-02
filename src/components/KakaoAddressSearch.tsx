import { useEffect, useRef, useState } from 'react'

interface KakaoAddressSearchProps {
  onAddressSelect: (address: string) => void
  initialValue?: string
}

declare global {
  interface Window {
    kakao: any
  }
}

export default function KakaoAddressSearch({
  onAddressSelect,
  initialValue = ''
}: KakaoAddressSearchProps) {
  const [searchInput, setSearchInput] = useState(initialValue)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle search
  const handleSearch = (value: string) => {
    setSearchInput(value)

    if (!value.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    // Check if Kakao is loaded
    if (!window.kakao) {
      console.error('Kakao SDK not loaded yet')
      return
    }

    if (!window.kakao.maps?.services?.Places) {
      console.error('Kakao Maps Services not available')
      return
    }

    try {
      const places = new window.kakao.maps.services.Places()
      places.keywordSearch(value, (data: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data)
          setShowResults(true)
        } else {
          setSearchResults([])
        }
      })
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  // Handle address selection
  const handleSelectAddress = (result: any) => {
    const address = result.address_name
    setSearchInput(address)
    onAddressSelect(address)
    setShowResults(false)
    setSearchResults([])
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full">
      <input
        ref={searchInputRef}
        type="text"
        name="address"
        id="address-search"
        placeholder="주소 검색 (예: 강남역, 서울시 강남구)"
        value={searchInput}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto z-10 shadow-md">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectAddress(result)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
            >
              <div className="text-sm font-semibold">{result.place_name}</div>
              <div className="text-xs text-gray-500">{result.address_name}</div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && searchInput.trim() && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 px-3 py-2 z-10 shadow-md text-gray-500 text-sm">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  )
}
