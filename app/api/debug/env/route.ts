import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_FACEBOOK_CONFIG_ID: process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'PRESENT' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV
  }

  return NextResponse.json({
    success: true,
    environment: envCheck,
    timestamp: new Date().toISOString()
  })
} 