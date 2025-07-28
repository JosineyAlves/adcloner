import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function POST(request: NextRequest) {
  try {
    const { templateId, accountIds } = await request.json()
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Token de acesso não encontrado' }, { status: 401 })
    }

    if (!templateId || !accountIds || accountIds.length === 0) {
      return NextResponse.json({ error: 'Template ID e Account IDs são obrigatórios' }, { status: 400 })
    }

    // Buscar dados do template
    const templateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/templates/${templateId}`)
    if (!templateResponse.ok) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    const template = await templateResponse.json()
    
    // Processar clonagem para cada conta
    const results = []
    
    for (const accountId of accountIds) {
      try {
        // Aqui você implementaria a lógica de clonagem usando os dados do template
        // Por enquanto, vamos simular o processo
        
        const cloneResult = await facebookAPI.cloneCampaignFromTemplate(
          accountId,
          accessToken,
          template.processedData
        )
        
        results.push({
          accountId,
          success: true,
          campaignIds: cloneResult.results.map(r => r.campaignId),
          message: cloneResult.message
        })
      } catch (error) {
        results.push({
          accountId,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      templateName: template.name
    })

  } catch (error) {
    console.error('Erro na clonagem por template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 