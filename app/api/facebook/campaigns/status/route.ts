import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const { id, status } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters: id and status' },
        { status: 400 }
      )
    }

    if (!['ACTIVE', 'PAUSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE or PAUSED' },
        { status: 400 }
      )
    }

    // Chamada para Facebook Marketing API para atualizar status da campanha
    const facebookResponse = await fetch(`https://graph.facebook.com/v23.0/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        status: status,
        access_token: accessToken
      })
    })

    if (!facebookResponse.ok) {
      const errorData = await facebookResponse.json()
      console.error('Facebook API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to update campaign status', details: errorData },
        { status: facebookResponse.status }
      )
    }

    const result = await facebookResponse.json()

    return NextResponse.json({
      success: true,
      message: `Campaign ${status === 'ACTIVE' ? 'activated' : 'paused'} successfully`,
      campaign_id: id,
      status: status
    })

  } catch (error) {
    console.error('Campaign status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
