import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validar que sea una URL de X/Twitter válida
    const twitterUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/
    if (!twitterUrlPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid Twitter/X URL' },
        { status: 400 }
      )
    }

    // Llamar a la API de oEmbed de Twitter
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&theme=light&align=center&omit_script=true`
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BitArena/1.0)',
      },
    })

    if (!response.ok) {
      console.error('Twitter oEmbed API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch tweet data' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Validar que tenemos los datos necesarios
    if (!data.html) {
      return NextResponse.json(
        { error: 'Invalid response from Twitter API' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      html: data.html,
      url: data.url || url,
      author_name: data.author_name,
      author_url: data.author_url,
      width: data.width,
      height: data.height,
    })

  } catch (error) {
    console.error('Error fetching Twitter oEmbed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
