import { useCallback, useRef, useEffect } from 'react'

export const useAutoScroll = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 最下部にスクロールする関数
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  // 即座に最下部にスクロールする関数
  const scrollToBottomInstant = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [])

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
    // CSS Gridレイアウトでは即座にスクロール可能
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }, [scrollToBottom])

  // 初期化時に最下部にスクロール
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottomInstant()
    }, 100)

    return () => clearTimeout(timer)
  }, [scrollToBottomInstant])

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
    handleScroll
  }
}