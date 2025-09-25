import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const { id, budget } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    if (!id || budget === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: id and budget' },
        { status: 400 }
      )
    }

    if (budget < 0) {
      return NextResponse.json(
        { error: 'Budget must be a positive number' },
        { status: 400 }
      )
    }

    // Chamada para Facebook Marketing API para atualizar orçamento do ad set
    // Ad sets podem ter daily_budget ou lifetime_budget
    const facebookResponse = await fetch(`https://graph.facebook.com/v23.0/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        daily_budget: budget.toString(),
        access_token: accessToken
      })
    })

    if (!facebookResponse.ok) {
      const errorData = await facebookResponse.json()
      console.error('Facebook API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to update ad set budget', details: errorData },
        { status: facebookResponse.status }
      )
    }

    const result = await facebookResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Ad set budget updated successfully',
      adset_id: id,
      budget: budget
    })

  } catch (error) {
    console.error('Ad set budget update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
