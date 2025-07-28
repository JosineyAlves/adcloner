import { NextRequest, NextResponse } from 'next/server'

// Mock data - em produção seria um banco de dados
let templates = [
  {
    id: '1',
    name: 'Campanha de Conversão',
    description: 'Template para campanhas de conversão',
    fileName: 'conversao.csv',
    processedAt: '2024-01-15T10:30:00Z',
    campaignCount: 2,
    status: 'active',
    processedData: [
      {
        'Campaign Name': 'Campanha Teste 1',
        'Campaign Objective': 'LINK_CLICKS',
        'Campaign Status': 'PAUSED',
        'Ad Set Name': 'Conjunto Teste 1',
        'Ad Set Daily Budget': '1000',
        'Countries': 'BR',
        'Ad Name': 'Anúncio Teste 1',
        'Title': 'Título do Anúncio',
        'Body': 'Descrição do anúncio',
        'Link': 'https://example.com',
        'Campaign ID': '',
        'Ad Set ID': '',
        'Ad ID': ''
      },
      {
        'Campaign Name': 'Campanha Teste 2',
        'Campaign Objective': 'CONVERSIONS',
        'Campaign Status': 'PAUSED',
        'Ad Set Name': 'Conjunto Teste 2',
        'Ad Set Daily Budget': '2000',
        'Countries': 'BR',
        'Ad Name': 'Anúncio Teste 2',
        'Title': 'Título do Anúncio 2',
        'Body': 'Descrição do anúncio 2',
        'Link': 'https://example2.com',
        'Campaign ID': '',
        'Ad Set ID': '',
        'Ad ID': ''
      }
    ]
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