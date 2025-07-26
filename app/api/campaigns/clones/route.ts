import { NextRequest, NextResponse } from 'next/server'
import { CampaignClone } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Em produção, você buscaria os clones reais do Facebook
    // Por enquanto, retornamos um array vazio
    const clones: CampaignClone[] = []
    
    return NextResponse.json({ 
      clones,
      success: true 
    })
  } catch (error) {
    console.error('Error fetching campaign clones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clones' },
      { status: 500 }
    )
  }
} 