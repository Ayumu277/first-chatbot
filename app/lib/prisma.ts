import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// PrismaClientの初期化を安全に行う
const createPrismaClient = () => {
  try {
    console.log('🔧 Initializing PrismaClient...')
    console.log('📊 DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV)

    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    })

    console.log('✅ PrismaClient initialized successfully')
    return client
  } catch (error) {
    console.error('❌ Failed to initialize PrismaClient:', error)
    throw error
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 接続テスト関数
export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}