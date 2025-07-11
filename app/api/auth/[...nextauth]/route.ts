import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

console.log("📦 DATABASE_URL is:", process.env.DATABASE_URL);
const prisma = new PrismaClient()

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

      // Googleプロバイダーの場合のみ処理
      if (account?.provider === 'google' && profile?.email) {
        try {
          // ユーザーが存在するかチェック
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          })

          if (!existingUser) {
            console.log("👤 Creating new user in database:", profile.email)
            const newUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || null,
                image: (profile as any).picture || null,
                emailVerified: null
              }
            })
            console.log("✅ New user created:", newUser)
          } else {
            console.log("👤 Existing user found:", existingUser.email)
          }
        } catch (error) {
          console.error("❌ Error handling user in signIn:", error)
          // エラーが発生してもサインインは続行
        }
      }

      return true
    },
    async session({ session, user }) {
      console.log("👤 Session callback:", { session, user })
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user, account }) {
      console.log("🎫 JWT callback:", { token, user, account })
      return token
    }
  },
  session: {
    strategy: "database",
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error("❌ NextAuth Error:", code, metadata)
    },
    warn(code) {
      console.warn("⚠️ NextAuth Warning:", code)
    },
    debug(code, metadata) {
      console.log("🐛 NextAuth Debug:", code, metadata)
    }
  }
})

export { handler as GET, handler as POST }