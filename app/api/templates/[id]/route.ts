import { NextRequest, NextResponse } from 'next/server'

// Mock data - em produção seria um banco de dados
let templates = [
  {
    id: '1',
    name: 'Campanha de Conversão',
    description: 'Template para campanhas de conversão',
    fileName: 'conversao.csv',
    processedAt: '2024-01-15T10:30:00Z',
    campaignCount: 5,
    status: 'active',
    processedData: [] // Dados processados do template
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Encontrar template
    const template = templates.find(t => t.id === id)
    
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Erro ao buscar template:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Encontrar e remover template
    const templateIndex = templates.findIndex(t => t.id === id)
    
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }
    
    templates.splice(templateIndex, 1)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar template:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 