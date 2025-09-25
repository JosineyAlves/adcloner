import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const campaignId = params.id
    const body = await request.json()
    const { budget, budgetType, daily_budget, lifetime_budget } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    // Validar se o orçamento é válido (mínimo 1 centavo)
    const budgetValue = budget || daily_budget || lifetime_budget
    if (!budgetValue || budgetValue < 0.01) {
      return NextResponse.json(
        { error: 'Orçamento deve ser pelo menos R$ 0,01' },
        { status: 400 }
      )
    }

    try {
      // Verificar se a campanha tem Advantage Campaign Budget
      let hasAdvantageCampaignBudget = false
      
      try {
        // Primeiro, tentar buscar o campo is_advantage_campaign_budget
        const campaignResponse = await fetch(
          `https://graph.facebook.com/v23.0/${campaignId}?fields=is_advantage_campaign_budget&access_token=${accessToken}`
        )
        
        const campaignData = await campaignResponse.json()
        
        if (campaignData.error) {
          console.warn('Facebook API error fetching campaign details:', campaignData.error)
          
          // Se o campo não estiver disponível, tentar verificar se a campanha tem orçamento definido
          // Campanhas com orçamento definido geralmente são CBO
          const budgetResponse = await fetch(
            `https://graph.facebook.com/v23.0/${campaignId}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`
          )
          
          const budgetData = await budgetResponse.json()
          
          if (!budgetData.error && (budgetData.daily_budget || budgetData.lifetime_budget)) {
            // Se a campanha tem orçamento definido, assumir CBO
            hasAdvantageCampaignBudget = true
          } else {
            // Se não tem orçamento, assumir ABO
            hasAdvantageCampaignBudget = false
          }
        } else {
          // Verificar se o campo existe e é true
          hasAdvantageCampaignBudget = campaignData.is_advantage_campaign_budget === true
        }
      } catch (error) {
        console.warn('Error fetching campaign details:', error)
        // Em caso de erro, assumir CBO para campanhas modernas
        hasAdvantageCampaignBudget = true
      }

      if (!hasAdvantageCampaignBudget) {
        return NextResponse.json(
          { 
            error: 'Esta campanha não usa CBO. Edite o orçamento no nível do Conjunto de Anúncios.',
            code: 'NO_ADVANTAGE_CAMPAIGN_BUDGET'
          },
          { status: 400 }
        )
      }

      // Preparar parâmetros para atualização
      const updateParams: any = {
        access_token: accessToken
      }

      if (budgetType === 'daily' || daily_budget) {
        updateParams.daily_budget = Math.round((budgetValue || daily_budget) * 100) // Converter para centavos
        updateParams.lifetime_budget = '' // Limpar lifetime budget
      } else if (budgetType === 'lifetime' || lifetime_budget) {
        updateParams.lifetime_budget = Math.round((budgetValue || lifetime_budget) * 100) // Converter para centavos
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
        if (data.error.code === 4 || data.error.code === 17 || data.error.code === 341) {
          return NextResponse.json(
            { 
              error: 'Limite de alterações de orçamento atingido. Tente novamente em alguns minutos.',
              code: 'RATE_LIMIT'
            },
            { status: 429 }
          )
        }
        
        if (data.error.code === 100) {
          return NextResponse.json(
            { 
              error: 'Orçamento inválido. Verifique o valor e tente novamente.',
              code: 'INVALID_BUDGET'
            },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { 
            error: `Erro ao atualizar orçamento: ${data.error.message}`,
            code: 'UPDATE_ERROR'
          },
          { status: 400 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        campaignId,
        budget: budgetValue,
        budgetType: budgetType || (daily_budget ? 'daily' : 'lifetime'),
        message: `Orçamento da campanha atualizado para R$ ${budgetValue.toFixed(2)}`
      })
    } catch (error) {
      console.error('Error updating campaign budget:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign budget' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business campaign budget error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
