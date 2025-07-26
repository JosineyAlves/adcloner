import { NextRequest, NextResponse } from 'next/server'
import { Campaign } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Em produção, você buscaria as campanhas reais do Facebook
    // Por enquanto, retornamos um array vazio
    const campaigns: Campaign[] = []
    
    return NextResponse.json({ 
      campaigns,
      success: true 
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
} 