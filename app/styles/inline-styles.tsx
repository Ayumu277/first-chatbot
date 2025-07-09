'use client'

import { useEffect } from 'react'

export const InlineStyles = () => {
  useEffect(() => {
    // DOM操作で直接スタイルを強制適用
    const applyStyles = () => {
      // 既存のスタイルをすべて削除
      const existingStyles = document.querySelectorAll('style[data-force-css]')
      existingStyles.forEach(style => style.remove())

      // 新しいスタイルシートを作成
      const styleSheet = document.createElement('style')
      styleSheet.setAttribute('data-force-css', 'true')
      styleSheet.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600&display=swap');

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html,
      body {
        background-color: #0D1117 !important;
        color: #C9D1D9 !important;
        font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        height: 100%;
        overflow: hidden;
      }

      #__next {
        height: 100vh;
        background-color: #0D1117 !important;
      }

      /* Flexbox utilities */
      .flex { display: flex !important; }
      .flex-1 { flex: 1 1 0% !important; }
      .flex-col { flex-direction: column !important; }
      .items-center { align-items: center !important; }
      .justify-center { justify-content: center !important; }
      .justify-between { justify-content: space-between !important; }

      /* Spacing */
      .h-screen { height: 100vh !important; }
      .h-full { height: 100% !important; }
      .w-full { width: 100% !important; }
      .w-64 { width: 16rem !important; }
      .min-w-0 { min-width: 0px !important; }
      .p-2 { padding: 0.5rem !important; }
      .p-4 { padding: 1rem !important; }
      .px-4 { padding-left: 1rem; padding-right: 1rem !important; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .ml-2 { margin-left: 0.5rem !important; }

      /* Colors */
      .bg-dark-theme { background-color: #0D1117 !important; }
      .bg-sidebar { background-color: #161B22 !important; }
      .bg-gray-700 { background-color: #374151 !important; }
      .bg-gray-800 { background-color: #1F2937 !important; }
      .bg-blue-600 { background-color: #2563EB !important; }
      .text-light-theme { color: #C9D1D9 !important; }
      .text-white { color: #FFFFFF !important; }
      .text-gray-400 { color: #9CA3AF !important; }

      /* Borders */
      .border { border-width: 1px !important; }
      .border-theme { border-color: #30363D !important; }
      .border-gray-600 { border-color: #4B5563 !important; }
      .border-gray-700 { border-color: #374151 !important; }
      .rounded { border-radius: 0.25rem !important; }
      .rounded-lg { border-radius: 0.5rem !important; }

      /* Positioning */
      .fixed { position: fixed !important; }
      .relative { position: relative !important; }
      .absolute { position: absolute !important; }
      .inset-0 { top: 0; right: 0; bottom: 0; left: 0 !important; }
      .inset-y-0 { top: 0; bottom: 0 !important; }
      .top-4 { top: 1rem !important; }
      .left-4 { left: 1rem !important; }
      .z-30 { z-index: 30 !important; }
      .z-40 { z-index: 40 !important; }
      .z-50 { z-index: 50 !important; }

      /* Transform */
      .translate-x-0 { transform: translateX(0px) !important; }
      .-translate-x-full { transform: translateX(-100%) !important; }
      .transition-transform { transition-property: transform !important; }
      .transition-colors { transition-property: color, background-color, border-color !important; }
      .duration-300 { transition-duration: 300ms !important; }
      .ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important; }

      /* Display */
      .block { display: block !important; }
      .hidden { display: none !important; }
      .overflow-hidden { overflow: hidden !important; }
      .overflow-y-auto { overflow-y: auto !important; }

      /* Hover effects */
      .hover\\:bg-gray-700:hover { background-color: #374151 !important; }
      .hover\\:bg-blue-700:hover { background-color: #1D4ED8 !important; }

      /* Focus effects */
      .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px !important; }
      .focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important; }

      /* Icon sizing */
      .w-6 { width: 1.5rem !important; }
      .h-6 { height: 1.5rem !important; }

      /* Responsive design */
      @media (min-width: 768px) {
        .md\\:hidden { display: none !important; }
        .md\\:translate-x-0 { transform: translateX(0px) !important; }
        .md\\:static { position: static !important; }
      }

      /* Scrollbar */
      .scrollbar-thin {
        scrollbar-width: thin;
        scrollbar-color: #484F58 #21262D;
      }

      .scrollbar-thin::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .scrollbar-thin::-webkit-scrollbar-track {
        background: #21262D;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb {
        background-color: #484F58;
        border-radius: 4px;
        border: 2px solid #21262D;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background-color: #656D76;
      }

      /* Button specific styles */
      button {
        cursor: pointer;
        border: none;
        outline: none;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Input specific styles */
      input, textarea {
        background-color: #21262D !important;
        border: 1px solid #30363D !important;
        color: #C9D1D9 !important;
        border-radius: 0.5rem !important;
        padding: 0.75rem !important;
      }

      input:focus, textarea:focus {
        outline: none !important;
        border-color: #2563EB !important;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
      }

      /* Animation classes */
      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .animate-bounce {
        animation: bounce 1s infinite;
      }

      @keyframes bounce {
        0%, 100% {
          transform: translateY(-25%);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }
      `
      
      // ヘッドに追加
      document.head.appendChild(styleSheet)
      
      // body に直接スタイルを適用
      document.body.style.backgroundColor = '#0D1117'
      document.body.style.color = '#C9D1D9'
      document.body.style.fontFamily = 'Inter, "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      document.body.style.margin = '0'
      document.body.style.padding = '0'
      document.body.style.height = '100vh'
      document.body.style.overflow = 'hidden'
      
      // html にも適用
      document.documentElement.style.backgroundColor = '#0D1117'
      document.documentElement.style.color = '#C9D1D9'
      document.documentElement.style.height = '100%'
      
      // __next div にも適用
      const nextDiv = document.getElementById('__next')
      if (nextDiv) {
        nextDiv.style.backgroundColor = '#0D1117'
        nextDiv.style.color = '#C9D1D9'
        nextDiv.style.height = '100vh'
      }
    }
    
    // すぐに実行
    applyStyles()
    
    // DOM変更を監視して再適用
    const observer = new MutationObserver(applyStyles)
    observer.observe(document.body, { childList: true, subtree: true })
    
    // 1秒後にも実行（確実性のため）
    setTimeout(applyStyles, 1000)
    
    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}