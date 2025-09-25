import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { dailyBudget } = await request.json()
    const adSetId = params.id
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      }, { status: 401 })
    }

    if (!dailyBudget || typeof dailyBudget !== 'number' || dailyBudget <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Orçamento diário inválido. Deve ser um número positivo.'
      }, { status: 400 })
    }

    console.log(`💰 Atualizando orçamento do conjunto ${adSetId} para R$ ${dailyBudget}`)

    await facebookAPI.updateAdSetBudget(adSetId, accessToken, dailyBudget)

    return NextResponse.json({
      success: true,
      message: `Orçamento atualizado para R$ ${dailyBudget.toFixed(2)} com sucesso!`
    })

  } catch (error: any) {
    console.error('Error updating adset budget:', error)
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro ao atualizar orçamento do conjunto de anúncios'
    }, { status: 500 })
  }
}
