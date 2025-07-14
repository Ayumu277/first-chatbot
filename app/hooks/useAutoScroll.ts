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

  // 即座に最下部にスクロールする関数（アニメーションなし）
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

    // スクロール停止を検出するためのタイマー
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 150)
  }, [])

  // メッセージ送信・受信時に自動スクロール
  const scrollOnMessageUpdate = useCallback(() => {
    // 少し遅延させてDOM更新後にスクロール
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }, [scrollToBottom])

  // コンポーネントマウント時に最下部にスクロール
  useEffect(() => {
    scrollToBottomInstant()
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