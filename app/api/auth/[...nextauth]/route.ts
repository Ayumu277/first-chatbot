import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "../../../lib/prisma"

console.log("📦 DATABASE_URL is:", process.env.DATABASE_URL);

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
      console.log("🔐 SignIn callback:", { user, account, profile })

      // emailが存在することを確認
      if (!user.email) {
        console.error("❌ No email provided in user object")
        return false
      }

      try {
        // データベースでユーザーを確認
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        })

        if (existingUser) {
          console.log("✅ User found in database:", existingUser.email)
          // ユーザーが存在する場合、サインインを許可
          return true
        } else {
          console.log("❌ User not found in database:", user.email)
          console.log("🛑 Account registration required")
          // ユーザーが存在しない場合、サインインを拒否
          return false
        }
      } catch (error) {
        console.error("❌ Database query error:", error)
        return false
      }
    },
    async session({ session, user }) {
      console.log("🔐 Session callback:", { session, user })
      // セッションにユーザーIDを追加
      if (session?.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
          })
          if (dbUser) {
            session.user.id = dbUser.id
          }
        } catch (error) {
          console.error("❌ Session callback error:", error)
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