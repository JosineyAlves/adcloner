import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface FacebookIntegration {
  id: string
  userId: string
  accountId: string
  accountName: string
  accessToken: string
  status: 'active' | 'inactive'
  permissions: string[]
  createdAt: Date
  updatedAt: Date
} 