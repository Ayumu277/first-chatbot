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

      // emailが存在することを確認
      if (!user.email) {
        console.error("❌ No email provided in user object")
        return false
      }

      try {
        // Prismaでemailベースでユーザーを検索
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          console.log("👤 Creating new user in database:", user.email)
          // その場でprisma.user.create()により登録処理を行う
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              emailVerified: null
            },
          })
          console.log("✅ New user created successfully")
        } else {
          console.log("👤 Existing user found:", existingUser.email)
        }
      } catch (error) {
        console.error("❌ Error in signIn callback:", error)
        // エラーが発生した場合でも認証を続行（デバッグ用）
        // 本番環境では return false にすることを検討
      }

      // 認証を許可
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