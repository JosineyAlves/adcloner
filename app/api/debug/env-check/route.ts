import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envVars = {
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_FACEBOOK_CONFIG_ID: process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'PRESENT' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV
  }

  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => value === 'MISSING' || !value)
    .map(([key]) => key)

  const hasAllRequired = missingVars.length === 0

  return NextResponse.json({
    success: hasAllRequired,
    environment: envVars,
    missing: missingVars,
    timestamp: new Date().toISOString(),
    message: hasAllRequired 
      ? 'Todas as variáveis de ambiente estão configuradas'
      : `Variáveis faltando: ${missingVars.join(', ')}`
  })
} 