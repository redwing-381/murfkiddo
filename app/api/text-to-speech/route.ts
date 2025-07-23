import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'friendly' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // For now, always use browser TTS for maximum reliability and speed
    // This eliminates API timeouts and network issues
    return NextResponse.json({
      success: false, // This tells client to use browser TTS
      error: 'Using browser TTS for better reliability',
      useBrowserTTS: true,
      browserTTSConfig: {
        rate: 0.85, // Slower for kids
        pitch: 1.15, // Slightly higher pitch for friendliness
        volume: 0.8,
        voice: 'child-friendly' // Will be handled by client
      }
    })

  } catch (error) {
    console.error('Error in text-to-speech API:', error)
    
    return NextResponse.json({
      success: false,
      error: 'TTS service error',
      useBrowserTTS: true,
      browserTTSConfig: {
        rate: 0.85,
        pitch: 1.15, 
        volume: 0.8,
        voice: 'child-friendly'
      }
    })
  }
} 