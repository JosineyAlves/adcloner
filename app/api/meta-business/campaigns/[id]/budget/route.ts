import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { budget, budgetType } = await request.json()
    const campaignId = params.id
    const accessToken = request.cookies.get('fb_access_token')?.value

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
    let hasAdvantageCampaignBudget = false
    try {
      const campaignResponse = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}?fields=is_advantage_campaign_budget,daily_budget,lifetime_budget&access_token=${accessToken}`
      )
      const campaignData = await campaignResponse.json()
      
      if (campaignData.error) {
        console.warn('Facebook API error fetching campaign details:', campaignData.error)
        // Fallback: verificar se tem orçamento definido
        const budgetResponse = await fetch(
          `https://graph.facebook.com/v23.0/${campaignId}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`
        )
        const budgetData = await budgetResponse.json()
        if (!budgetData.error && (budgetData.daily_budget || budgetData.lifetime_budget)) {
          hasAdvantageCampaignBudget = true
        } else {
          hasAdvantageCampaignBudget = false
        }
      } else {
        if (campaignData.is_advantage_campaign_budget !== undefined) {
          hasAdvantageCampaignBudget = campaignData.is_advantage_campaign_budget === true
        } else {
          // Se o campo não estiver disponível, verificar se tem orçamento
          if (campaignData.daily_budget || campaignData.lifetime_budget) {
            hasAdvantageCampaignBudget = true
          } else {
            hasAdvantageCampaignBudget = false
          }
        }
      }
    } catch (error) {
      console.warn('Error fetching campaign details:', error)
      hasAdvantageCampaignBudget = true // Assume CBO for modern campaigns on error
    }

    // Verificar se pode editar orçamento no nível da campanha
    if (!hasAdvantageCampaignBudget) {
      return NextResponse.json({ 
        error: 'Esta campanha não usa CBO. Edite o orçamento no nível do Conjunto de Anúncios.',
        code: 'NOT_CBO_CAMPAIGN'
      }, { status: 400 })
    }

    // Obter orçamento atual para validação
    let currentDailyBudget = 0
    let currentLifetimeBudget = 0
    
    try {
      const currentResponse = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`
      )
      const currentData = await currentResponse.json()
      
      if (!currentData.error) {
        currentDailyBudget = currentData.daily_budget ? parseInt(currentData.daily_budget) : 0
        currentLifetimeBudget = currentData.lifetime_budget ? parseInt(currentData.lifetime_budget) : 0
      }
    } catch (error) {
      console.warn('Error fetching current budget:', error)
    }

    // Preparar parâmetros para atualização
    const updateParams: any = {
      access_token: accessToken
    }

    if (budgetType === 'daily' || currentDailyBudget > 0) {
      updateParams.daily_budget = Math.round(budget * 100) // Converter reais para centavos
      updateParams.lifetime_budget = '' // Limpar lifetime budget
    } else if (budgetType === 'lifetime' || currentLifetimeBudget > 0) {
      updateParams.lifetime_budget = Math.round(budget * 100) // Converter reais para centavos
      updateParams.daily_budget = '' // Limpar daily budget
    }

    // Atualizar orçamento da campanha
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${campaignId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(updateParams)
      }
    )

    const data = await response.json()

    if (data.error) {
      console.error('Facebook API error:', data.error)
      
      // Tratar erros específicos
      if (data.error.code === 4 || data.error.code === 17 || data.error.code === 341 || data.error.code === 613) {
        return NextResponse.json({ 
          error: 'Limite de taxa excedido. Tente novamente em alguns minutos.',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 })
      }
      
      if (data.error.message?.includes('INVALID_BUDGET')) {
        return NextResponse.json({ 
          error: 'Orçamento inválido. Verifique o valor e tente novamente.',
          code: 'INVALID_BUDGET'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: data.error.message || 'Erro ao atualizar orçamento',
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