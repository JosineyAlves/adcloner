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
    const contentType = request.headers.get('content-type') || ''
    
    let templateData: any = {}
    
    if (contentType.includes('application/json')) {
      // Processar JSON
      templateData = await request.json()
    } else if (contentType.includes('multipart/form-data')) {
      // Processar FormData
      const formData = await request.formData()
      const file = formData.get('file') as File
      const name = formData.get('name') as string
      const description = formData.get('description') as string
      const processedData = formData.get('processedData') as string

      if (!file || !name) {
        return NextResponse.json({ error: 'Arquivo e nome são obrigatórios' }, { status: 400 })
      }

      templateData = {
        name,
        description: description || '',
        fileName: file.name,
        processedData: JSON.parse(processedData),
        campaignCount: JSON.parse(processedData).length,
        status: 'active'
      }
    } else {
      return NextResponse.json({ error: 'Content-Type não suportado' }, { status: 400 })
    }

    // Validar dados obrigatórios
    if (!templateData.name || !templateData.processedData) {
      return NextResponse.json({ error: 'Nome e dados processados são obrigatórios' }, { status: 400 })
    }

    // Criar novo template
    const newTemplate = await templateStorage.createTemplate({
      name: templateData.name,
      description: templateData.description || '',
      fileName: templateData.fileName || 'template.csv',
      processedAt: new Date().toISOString(),
      campaignCount: templateData.campaignCount || templateData.processedData.length,
      status: templateData.status || 'active',
      processedData: templateData.processedData
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