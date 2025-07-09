import type { Metadata } from 'next'
import SessionProvider from './components/SessionProvider'
import { InlineStyles } from './styles/inline-styles'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChatGPT風チャットアプリ',
  description: 'Next.js + TypeScriptで作成したChatGPT風チャットアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const inlineCSS = `
    * { 
      box-sizing: border-box !important; 
      margin: 0 !important; 
      padding: 0 !important; 
    }
    html, body { 
      background-color: #0D1117 !important; 
      color: #C9D1D9 !important; 
      font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      height: 100% !important;
      overflow: hidden !important;
    }
    #__next { 
      height: 100vh !important; 
      background-color: #0D1117 !important; 
    }
    .flex { display: flex !important; }
    .flex-1 { flex: 1 1 0% !important; }
    .flex-col { flex-direction: column !important; }
    .h-screen { height: 100vh !important; }
    .h-full { height: 100% !important; }
    .w-full { width: 100% !important; }
    .w-64 { width: 16rem !important; }
    .w-6 { width: 1.5rem !important; }
    .h-6 { height: 1.5rem !important; }
    .min-w-0 { min-width: 0px !important; }
    .p-2 { padding: 0.5rem !important; }
    .p-4 { padding: 1rem !important; }
    .bg-dark-theme { background-color: #0D1117 !important; }
    .bg-sidebar { background-color: #161B22 !important; }
    .bg-gray-700 { background-color: #374151 !important; }
    .bg-gray-800 { background-color: #1F2937 !important; }
    .text-light-theme { color: #C9D1D9 !important; }
    .text-white { color: #FFFFFF !important; }
    .border { border-width: 1px !important; }
    .border-theme { border-color: #30363D !important; }
    .rounded { border-radius: 0.25rem !important; }
    .rounded-lg { border-radius: 0.5rem !important; }
    .fixed { position: fixed !important; }
    .relative { position: relative !important; }
    .top-4 { top: 1rem !important; }
    .left-4 { left: 1rem !important; }
    .z-30 { z-index: 30 !important; }
    .z-40 { z-index: 40 !important; }
    .z-50 { z-index: 50 !important; }
    .inset-y-0 { top: 0; bottom: 0 !important; }
    .translate-x-0 { transform: translateX(0px) !important; }
    .-translate-x-full { transform: translateX(-100%) !important; }
    .transition-transform { transition-property: transform !important; }
    .transition-colors { transition-property: color, background-color, border-color !important; }
    .duration-300 { transition-duration: 300ms !important; }
    .ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important; }
    .overflow-hidden { overflow: hidden !important; }
    .hover\\:bg-gray-700:hover { background-color: #374151 !important; }
    @media (min-width: 768px) {
      .md\\:hidden { display: none !important; }
      .md\\:translate-x-0 { transform: translateX(0px) !important; }
      .md\\:static { position: static !important; }
    }
  `

  return (
    <html lang="ja" style={{
      backgroundColor: '#0D1117',
      color: '#C9D1D9',
      height: '100%',
      fontFamily: 'Inter, "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600&display=swap" rel="stylesheet" />
        <script src="/css-loader.js" defer></script>
        <style dangerouslySetInnerHTML={{ __html: inlineCSS }} />
      </head>
      <body style={{
        backgroundColor: '#0D1117',
        color: '#C9D1D9',
        fontFamily: 'Inter, "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        <InlineStyles />
        <SessionProvider>
          <div style={{
            backgroundColor: '#0D1117',
            color: '#C9D1D9',
            height: '100vh',
            fontFamily: 'Inter, "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}