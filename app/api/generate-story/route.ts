import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { topic, voiceType } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    // Step 1: Generate story using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Write a fun, educational, and age-appropriate story for children aged 5-12 about "${topic}". 
    The story should be:
    - About 200-300 words long
    - Positive and uplifting with a good moral lesson
    - Use simple, engaging language
    - Include dialogue and sound effects like "whoosh!", "sparkle!", etc.
    - Be imaginative but not scary
    - Have a clear beginning, middle, and end
    
    Voice style: ${voiceType}
    
    Please write only the story content, no additional formatting or titles.`

    const result = await model.generateContent(prompt)
    const storyText = result.response.text()

    // Step 2: Convert to speech using Murf API (Simplified format)
    const murfResponse = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        text: storyText,
        voiceId: getVoiceId(voiceType)
      },
      {
        headers: {
          'api-key': process.env.MURF_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({
      success: true,
      storyText,
      audioUrl: murfResponse.data.audioFile,
      title: `The Adventure of ${topic}`,
    })
  } catch (error) {
    console.error('Error generating story:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('API response:', (error as any).response?.data)
    }
    
    return NextResponse.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: 500 }
    )
  }
}

function getVoiceId(voiceType: string): string {
  // Map voice types to actual Murf voice IDs (based on documentation examples)
  // You should replace these with actual voice IDs from your Murf dashboard
  const voiceMap = {
    playful: 'en-US-natalie',  // Kid-friendly, energetic voice
    calm: 'en-US-terrell',     // Calm, soothing voice for bedtime
    dramatic: 'en-US-joe',     // More dramatic, storytelling voice
  }
  
  return voiceMap[voiceType as keyof typeof voiceMap] || voiceMap.playful
} 