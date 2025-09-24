import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { budget, budgetType } = await request.json()
    const adsetId = params.id
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      }, { status: 401 })
    }

    if (!budget || budget <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Orçamento deve ser maior que zero.'
      }, { status: 400 })
    }

    if (!['daily_budget', 'lifetime_budget'].includes(budgetType)) {
      return NextResponse.json({
        success: false,
        message: 'Tipo de orçamento inválido. Use daily_budget ou lifetime_budget.'
      }, { status: 400 })
    }

    console.log(`💰 Atualizando ${budgetType} do conjunto de anúncios ${adsetId} para ${budget}`)

    // Converter para centavos (Facebook usa centavos)
    const budgetInCents = Math.round(budget * 100)

    // Atualizar orçamento do conjunto de anúncios
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${adsetId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          [budgetType]: budgetInCents.toString(),
          access_token: accessToken,
        })
      }
    )

    const data = await response.json()

    if (data.error) {
      console.error('Erro ao atualizar orçamento do conjunto:', data.error)
      return NextResponse.json({
        success: false,
        message: data.error.message || 'Erro ao atualizar orçamento do conjunto de anúncios'
      }, { status: 400 })
    }

    console.log(`✅ Orçamento do conjunto de anúncios ${adsetId} atualizado`)

    return NextResponse.json({
      success: true,
      message: `${budgetType === 'daily_budget' ? 'Orçamento diário' : 'Orçamento total'} atualizado com sucesso`,
      adsetId,
      budget: budget,
      budgetType
    })

  } catch (error) {
    console.error('Error updating adset budget:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
