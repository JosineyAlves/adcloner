import { NextRequest, NextResponse } from 'next/server'
import { templateStorage } from '@/lib/template-storage'

export async function GET() {
  try {
    // Inicializar com dados padrão se necessário
    await templateStorage.initializeWithDefaultData()
    
    const templates = await templateStorage.getAllTemplates()
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
    const newTemplate = await templateStorage.createTemplate({
      name,
      description: description || '',
      fileName: file.name,
      processedAt: new Date().toISOString(),
      campaignCount: JSON.parse(processedData).length,
      status: 'active',
      processedData: JSON.parse(processedData)
    })

    return NextResponse.json({ 
      success: true, 
      template: newTemplate 
    })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 