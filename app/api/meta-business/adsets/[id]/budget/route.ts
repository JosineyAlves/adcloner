import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const adSetId = params.id
    const body = await request.json()
    const { budget, budgetType, daily_budget, lifetime_budget } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    // Validar se o orçamento é válido (mínimo R$ 0,01)
    const budgetValue = budget || daily_budget || lifetime_budget
    if (!budgetValue || budgetValue < 0.01) {
      return NextResponse.json(
        { error: 'Orçamento deve ser pelo menos R$ 0,01' },
        { status: 400 }
      )
    }

    try {
      // Preparar parâmetros para atualização
      const updateParams: any = {
        access_token: accessToken
      }

      if (budgetType === 'daily' || daily_budget) {
        updateParams.daily_budget = Math.round(budgetValue * 100) // Converter reais para centavos
        updateParams.lifetime_budget = '' // Limpar lifetime budget
      } else if (budgetType === 'lifetime' || lifetime_budget) {
        updateParams.lifetime_budget = Math.round(budgetValue * 100) // Converter reais para centavos
        updateParams.daily_budget = '' // Limpar daily budget
      }

      console.log('📤 Enviando para Facebook API (AdSet):', updateParams)

      // Atualizar orçamento do Ad Set
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${adSetId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(updateParams)
        }
      )
      
      // Verificar se a resposta é válida antes de fazer parse JSON
      if (!response.ok) {
        console.error('Facebook API response not ok:', response.status, response.statusText)
        return NextResponse.json({ 
          error: `Erro na API do Facebook: ${response.status} ${response.statusText}`,
          code: 'FACEBOOK_API_ERROR'
        }, { status: response.status })
      }

      // Verificar se há conteúdo para fazer parse
      const responseText = await response.text()
      if (!responseText) {
        console.error('Facebook API returned empty response')
        return NextResponse.json({ 
          error: 'Resposta vazia da API do Facebook',
          code: 'EMPTY_RESPONSE'
        }, { status: 500 })
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse Facebook API response:', parseError)
        console.error('Response text:', responseText)
        return NextResponse.json({ 
          error: 'Resposta inválida da API do Facebook',
          code: 'INVALID_JSON_RESPONSE'
        }, { status: 500 })
      }
      
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
        adSetId,
        budget: budgetValue,
        budgetType: budgetType || (daily_budget ? 'daily' : 'lifetime'),
        message: `Orçamento do conjunto atualizado para R$ ${budgetValue.toFixed(2)}`
      })
    } catch (error) {
      console.error('Error updating ad set budget:', error)
      return NextResponse.json(
        { error: 'Failed to update ad set budget' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business ad set budget error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}