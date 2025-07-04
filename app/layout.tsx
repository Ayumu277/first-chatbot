import type { Metadata } from 'next'
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
  return (
    <html lang="ja" className="dark">
      <body className="bg-dark-bg text-gray-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}