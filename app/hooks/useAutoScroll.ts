import { useCallback, useRef, useEffect, useState } from 'react'

export const useAutoScroll = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [inputFooterHeight, setInputFooterHeight] = useState(120)

  // 入力欄の実際の高さを計算
  const calculateInputFooterHeight = useCallback(() => {
    const inputFooter = document.querySelector('[data-input-footer]') as HTMLElement
    if (inputFooter) {
      const height = inputFooter.offsetHeight
      setInputFooterHeight(height + 20) // 20px の余白を追加
      return height + 20
    }
    return 120 // フォールバック値
  }, [])

  // 最下部にスクロールする関数（入力欄の高さを考慮）
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const actualFooterHeight = calculateInputFooterHeight()

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [calculateInputFooterHeight])

  // 即座に最下部にスクロールする関数
  const scrollToBottomInstant = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      calculateInputFooterHeight()
      container.scrollTop = container.scrollHeight
    }
  }, [calculateInputFooterHeight])

  // ユーザーがスクロールしているかを検出
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return

    isUserScrollingRef.current = true

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 150)
  }, [])

  // メッセージ送信・受信時に自動スクロール
  const scrollOnMessageUpdate = useCallback(() => {
    setTimeout(() => {
      calculateInputFooterHeight()
      scrollToBottom()
    }, 150) // DOM更新を待つ
  }, [scrollToBottom, calculateInputFooterHeight])

  // ウィンドウリサイズ時に高さを再計算
  useEffect(() => {
    const handleResize = () => {
      calculateInputFooterHeight()
    }

    window.addEventListener('resize', handleResize)

    // 初期計算
    const timer = setTimeout(() => {
      calculateInputFooterHeight()
      scrollToBottomInstant()
    }, 100)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [calculateInputFooterHeight, scrollToBottomInstant])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    scrollContainerRef,
    scrollToBottom,
    scrollToBottomInstant,
    scrollOnMessageUpdate,
    handleScroll,
    inputFooterHeight
  }
}