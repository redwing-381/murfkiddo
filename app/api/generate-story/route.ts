import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { NaturalSpeechProcessor } from '@/lib/speech-processor'

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable')
}
if (!process.env.MURF_API_KEY) {
  console.error('Missing MURF_API_KEY environment variable')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .slice(0, 500) // Limit length
}

export async function POST(request: NextRequest) {
  try {
    // Environment check
    if (!process.env.GEMINI_API_KEY || !process.env.MURF_API_KEY) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { topic, voiceType } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    // Sanitize inputs
    const safeTopic = sanitizeInput(topic)
    const safeVoiceType = voiceType ? sanitizeInput(voiceType) : 'calm'

    if (safeTopic.length < 2) {
      return NextResponse.json({ error: 'Topic too short' }, { status: 400 })
    }

    // Step 1: Generate story using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Write a fun, educational, and age-appropriate story for children aged 5-12 about "${safeTopic}". 
    The story should be:
    - About 200-300 words long
    - Positive and uplifting with a good moral lesson
    - Use simple, engaging language
    - Include dialogue and sound effects like "whoosh!", "sparkle!", etc.
    - Be imaginative but not scary
    - Have a clear beginning, middle, and end
    
    Voice style: ${safeVoiceType}
    
    Please write only the story content, no additional formatting or titles.`

    const result = await model.generateContent(prompt)
    const rawStoryText = result.response.text()
    
    // Process text for natural storytelling speech patterns with pauses and emphasis
    const processedText = NaturalSpeechProcessor.processForStorytelling(rawStoryText)

    // Step 2: Convert to speech using Murf API (Simplified format)
    const murfResponse = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        text: processedText, // Remove SSML wrapper since we're not using SSML breaks
        voice_id: "en-US-natalie",
        style: "Narration", // Always use Narration for better storytelling pace
        speed: -10 // Slow down by 10% for kids to follow better
      },
      {
        headers: {
          'api-key': process.env.MURF_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    )

    return NextResponse.json({
      success: true,
      storyText: rawStoryText,
      audioUrl: murfResponse.data.audioFile,
      title: `The Adventure of ${safeTopic}`,
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

function getVoiceStyle(voiceType: string): string {
  // Map voice types to Murf voice styles for en-US-natalie
  const styleMap = {
    playful: 'Conversational',    // Kid-friendly, energetic style
    calm: 'Narration',           // Calm, soothing style for bedtime
    dramatic: 'Narration',       // Storytelling style
  }
  
  return styleMap[voiceType as keyof typeof styleMap] || 'Conversational'
} 