import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { budget, budgetType, accountId } = await request.json()
    const campaignId = params.id
    // Ver comentário completo em app/api/meta-business/campaigns/[id]/status/route.ts.
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId, userId)

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Token de acesso não encontrado' 
      }, { status: 401 })
    }

    if (!budget || budget <= 0) {
      return NextResponse.json({ 
        error: 'Orçamento inválido. Verifique o valor e tente novamente.',
        code: 'INVALID_BUDGET'
      }, { status: 400 })
    }

    if (!budgetType || !['daily', 'lifetime'].includes(budgetType)) {
      return NextResponse.json({ 
        error: 'Tipo de orçamento inválido' 
      }, { status: 400 })
    }

    console.log(`🔄 Atualizando orçamento da campanha ${campaignId}:`, { budget, budgetType })

    // Verificar se a campanha usa CBO (Campaign Budget Optimization)
    // Simplificado para evitar rate limit - usar apenas campos básicos
    let hasAdvantageCampaignBudget = false
    try {
      // Usar apenas campos básicos para evitar erro 400
      const campaignResponse = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`
      )
      
      if (!campaignResponse.ok) {
        console.warn('Error fetching campaign details:', campaignResponse.status)
        // Se não conseguir buscar, assumir CBO se tem orçamento na requisição
        hasAdvantageCampaignBudget = true
      } else {
        const campaignData = await campaignResponse.json()
        
        if (campaignData.error) {
          console.warn('Facebook API error fetching campaign details:', campaignData.error)
          // Se houver erro, assumir CBO se tem orçamento na requisição
          hasAdvantageCampaignBudget = true
        } else {
          // Verificar se tem orçamento definido no nível da campanha
          const hasCampaignBudget = !!(campaignData.daily_budget || campaignData.lifetime_budget)
          hasAdvantageCampaignBudget = hasCampaignBudget
        }
      }
    } catch (error) {
      console.warn('Error fetching campaign details:', error)
      // Em caso de erro, assumir CBO (mais permissivo)
      hasAdvantageCampaignBudget = true
    }

    // Verificar se pode editar orçamento no nível da campanha
    if (!hasAdvantageCampaignBudget) {
      return NextResponse.json({ 
        error: 'Esta campanha não usa CBO. Edite o orçamento no nível do Conjunto de Anúncios.',
        code: 'NOT_CBO_CAMPAIGN'
      }, { status: 400 })
    }

    // Preparar parâmetros para atualização (form-data conforme documentação)
    const formData = new URLSearchParams()
    formData.append('access_token', accessToken)
    
    if (budgetType === 'daily') {
      formData.append('daily_budget', Math.round(budget * 100).toString()) // Converter reais para centavos
      formData.append('lifetime_budget', '') // Limpar lifetime budget
    } else if (budgetType === 'lifetime') {
      formData.append('lifetime_budget', Math.round(budget * 100).toString()) // Converter reais para centavos
      formData.append('daily_budget', '') // Limpar daily budget
    }

    console.log('📤 Enviando para Facebook API:', {
      campaignId,
      budget: budget,
      budgetType: budgetType,
      daily_budget: budgetType === 'daily' ? Math.round(budget * 100) : '',
      lifetime_budget: budgetType === 'lifetime' ? Math.round(budget * 100) : ''
    })

    // Atualizar orçamento da campanha usando POST conforme documentação
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${campaignId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      }
    )

    // A Graph API praticamente sempre devolve um corpo JSON com o motivo real do erro mesmo
    // quando o status HTTP já é 4xx (ex.: 400 Bad Request) — então o parse do corpo tem que
    // acontecer ANTES de decidir se foi erro, senão a mensagem específica do Facebook (ex.:
    // "O orçamento diário mínimo é...") se perde e sobra só o genérico "400 Bad Request".
    const responseText = await response.text()
    console.log('📥 Resposta da Facebook API:', responseText)

    if (!responseText) {
      console.error('Facebook API returned empty response, status:', response.status, response.statusText)
      return NextResponse.json({ 
        error: response.ok
          ? 'Resposta vazia da API do Facebook'
          : `Erro na API do Facebook: ${response.status} ${response.statusText}`,
        code: response.ok ? 'EMPTY_RESPONSE' : 'FACEBOOK_API_ERROR'
      }, { status: response.ok ? 500 : response.status })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse Facebook API response:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json({ 
        error: response.ok
          ? 'Resposta inválida da API do Facebook'
          : `Erro na API do Facebook: ${response.status} ${response.statusText}`,
        code: response.ok ? 'INVALID_JSON_RESPONSE' : 'FACEBOOK_API_ERROR'
      }, { status: response.ok ? 500 : response.status })
    }

    if (data.error) {
      console.error('Facebook API error:', data.error)
      
      // Tratar erros específicos
      if (data.error.code === 4 || data.error.code === 17 || data.error.code === 341 || data.error.code === 613) {
        return NextResponse.json({ 
          error: 'Limite de taxa excedido. Tente novamente em alguns minutos.',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 })
      }
      
      if (data.error.message?.includes('INVALID_BUDGET') || data.error.code === 100) {
        return NextResponse.json({ 
          error: 'Orçamento inválido. Verifique o valor e tente novamente.',
          code: 'INVALID_BUDGET'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: data.error.error_user_msg || data.error.message || 'Erro ao atualizar orçamento',
        code: data.error.code || 'UNKNOWN_ERROR'
      }, { status: 400 })
    }

    console.log(`✅ Orçamento da campanha ${campaignId} atualizado com sucesso`)

    return NextResponse.json({ 
      success: true,
      message: 'Orçamento atualizado com sucesso',
      budget: budget,
      budgetType: budgetType
    })

  } catch (error) {
    console.error('Error updating campaign budget:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}