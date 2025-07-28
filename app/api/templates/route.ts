import { NextRequest, NextResponse } from 'next/server'
import { Template } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Em produção, você buscaria os templates reais do banco de dados
    // Por enquanto, retornamos um array vazio
    const templates: Template[] = []
    
    return NextResponse.json({ 
      templates,
      success: true 
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
} 