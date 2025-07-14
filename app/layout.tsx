import type { Metadata } from 'next'
import SessionProvider from './components/SessionProvider'
import './styles/globals.css'

export const metadata: Metadata = {
  title: 'chatbot',
  description: 'Next.js + TypeScriptで作成したChatGPT風チャットアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[#0D1117] text-[#C9D1D9] font-sans overflow-hidden">
        <SessionProvider>
          <div className="h-full bg-[#0D1117] text-[#C9D1D9]">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}