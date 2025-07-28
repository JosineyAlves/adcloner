import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

export async function GET() {
  try {
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const processedData = formData.get('processedData') as string

    if (!file || !name) {
      return NextResponse.json({ error: 'Arquivo e nome são obrigatórios' }, { status: 400 })
    }

    // Criar novo template
    const newTemplate = {
      id: Date.now().toString(),
      name,
      description: description || '',
      fileName: file.name,
      processedAt: new Date().toISOString(),
      campaignCount: JSON.parse(processedData).length,
      status: 'active' as const,
      processedData: JSON.parse(processedData)
    }

    templates.push(newTemplate)

    return NextResponse.json({ 
      success: true, 
      template: newTemplate 
    })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 