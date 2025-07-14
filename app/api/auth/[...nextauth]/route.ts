import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "../../../lib/prisma"


const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {

      // emailが存在することを確認
      if (!user.email) {
        console.error("❌ No email provided in user object")
        return false
      }

      try {
        // データベースでユーザーを確認（正しいモデル名を使用）
        const existingUser = await prisma.users.findUnique({
          where: { email: user.email }
        })

        if (existingUser) {
          // ユーザーが存在する場合、サインインを許可
          return true
        } else {
          // ユーザーが存在しない場合、サインインを拒否
          return false
        }
      } catch (error) {
        console.error("❌ Database query error:", error)
        // データベースエラーの場合でもサインインを許可（フォールバック）
        return true
      }
    },
    async session({ session, user }) {
      // セッションにユーザーIDを追加
      if (session?.user?.email) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: session.user.email }
          })
          if (dbUser) {
            session.user.id = dbUser.id
          }
        } catch (error) {
          console.error("❌ Session callback error:", error)
          // エラーが発生してもセッションは継続
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/', // カスタムサインインページ
    error: '/?error=auth_error'
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }