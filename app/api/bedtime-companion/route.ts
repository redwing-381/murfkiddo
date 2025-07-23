import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { NaturalSpeechProcessor } from '@/lib/speech-processor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Input validation and sanitization
function sanitizeInput(input: string): string {
  return input.replace(/[<>\"'&]/g, '').trim().substring(0, 500)
}

export async function POST(request: NextRequest) {
  try {
    // Add API key validation
    if (!process.env.GEMINI_API_KEY || !process.env.MURF_API_KEY) {
      console.error('Missing API keys')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    const { request: userRequest, contentType } = await request.json()

    if (!userRequest) {
      return NextResponse.json({ error: 'Request is required' }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedRequest = sanitizeInput(userRequest)
    const sanitizedContentType = contentType ? sanitizeInput(contentType) : ''

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    let prompt = ''
    let title = ''

    // Determine the type of bedtime content based on the request and contentType
    if (sanitizedContentType.includes('bedtime story') || sanitizedRequest.toLowerCase().includes('story')) {
      title = 'Sweet Dreams Story'
      prompt = `You are a gentle, soothing bedtime storyteller for children aged 5-12. Create a peaceful bedtime story based on: "${sanitizedRequest}"

Create a calming bedtime story that:
- Is 200-300 words long (perfect bedtime length)
- Has a peaceful, gentle tone
- Uses soft, gentle language (whisper-quiet, gentle breeze, soft moonlight, etc.)
- Includes nature, friendly animals, or magical but peaceful elements
- Has a soothing, happy ending that promotes good dreams
- Ends with the character going to sleep peacefully
- Encourages sweet dreams

Start with something like "Close your eyes, little one, and let me tell you a gentle story..."

Make it dreamy and calming, perfect for drifting off to sleep. Use emojis sparingly and gently (🌙✨💤).`

    } else if (sanitizedContentType.includes('lullaby') || sanitizedRequest.toLowerCase().includes('lullaby') || sanitizedRequest.toLowerCase().includes('song')) {
      title = 'Gentle Lullaby'
      prompt = `You are a caring bedtime companion creating a soothing lullaby for children based on: "${sanitizedRequest}"

Create a gentle, original lullaby that:
- Has 2-3 short verses
- Uses simple, repetitive, soothing words
- Mentions stars, moon, dreams, sleep
- Has a soft rhythm perfect for singing
- Is calming and not exciting
- Ends with "close your eyes" or similar peaceful ending

Format like a song with gentle spacing:
"🌙 Gentle Lullaby 🌙

[Verse 1]
[Simple, soothing lyrics]

[Verse 2] 
[More peaceful lyrics]

[Gentle ending]
Sweet dreams, little one... 💤"

Keep it very soft and sleepy.`

    } else if (sanitizedContentType.includes('relaxation') || sanitizedRequest.toLowerCase().includes('relax') || sanitizedRequest.toLowerCase().includes('calm') || sanitizedRequest.toLowerCase().includes('breathing')) {
      title = 'Peaceful Relaxation'
      prompt = `You are a gentle mindfulness guide for children at bedtime. Create a simple, calming relaxation exercise based on: "${sanitizedRequest}"

Create a short (2-3 minute) bedtime relaxation that:
- Uses very simple, gentle instructions
- Focuses on slow breathing or gentle body relaxation
- Uses peaceful imagery (floating clouds, gentle waves, soft animals)
- Speaks very slowly and calmly
- Ends with encouraging them to drift off to sleep
- Uses soft, whispering language

Example start: "Let's take some gentle breaths together, little one..."

Make it super calm and sleepy - like a gentle whisper that helps them relax completely.`

    } else if (sanitizedContentType.includes('goodnight wishes') || sanitizedRequest.toLowerCase().includes('goodnight') || sanitizedRequest.toLowerCase().includes('sweet dreams')) {
      title = 'Sweet Goodnight Wishes'
      prompt = `You are a loving bedtime companion saying goodnight to a child based on: "${sanitizedRequest}"

Create a warm, personal goodnight message that:
- Is short and sweet (50-100 words)
- Includes wishes for sweet dreams
- Maybe mentions favorite things having good dreams too
- Is like what a loving parent or grandparent would say
- Ends with encouraging peaceful sleep
- Uses gentle, loving language

Make it feel like a warm hug in words, perfect for the last thing they hear before sleep.`

    } else if (sanitizedContentType.includes('nature sounds') || sanitizedRequest.toLowerCase().includes('sounds') || sanitizedRequest.toLowerCase().includes('nature')) {
      title = 'Peaceful Nature Sounds'
      prompt = `You are creating a peaceful nature sound experience for bedtime based on: "${sanitizedRequest}"

Create a gentle description of calming nature sounds that:
- Describes soothing natural sounds (rain, ocean waves, gentle wind, etc.)
- Uses very peaceful, descriptive language
- Helps the child imagine being in a peaceful natural setting
- Encourages them to listen to these sounds in their imagination
- Ends with drifting off to sleep surrounded by nature
- Is 150-250 words

Make it feel like they're in the most peaceful place in nature, ready for sleep.`

    } else if (sanitizedContentType.includes('counting sheep') || sanitizedRequest.toLowerCase().includes('count') || sanitizedRequest.toLowerCase().includes('sheep')) {
      title = 'Sleepy Counting'
      prompt = `You are helping a child count their way to sleep based on: "${sanitizedRequest}"

Create a gentle counting exercise that:
- Involves counting something peaceful (sheep, stars, clouds, etc.)
- Uses a very slow, rhythmic counting pattern
- Includes peaceful imagery for each thing being counted
- Gets progressively slower and more sleepy
- Helps the child visualize peaceful scenes
- Ends with them drifting off to sleep
- Is soothing and repetitive

Make it feel like each number brings them closer to dreamland.`

    } else {
      // Default to a general bedtime story
      title = 'Sweet Dreams Story'
      prompt = `You are a gentle bedtime companion helping a child prepare for sleep. Based on their request: "${sanitizedRequest}"

Create peaceful bedtime content that:
- Is gentle and soothing
- Helps them feel calm and ready for sleep
- Uses soft, peaceful language
- Includes comforting imagery
- Ends with encouragement for sweet dreams
- Is appropriate for bedtime (calming, not exciting)

Make it perfect for helping them drift off to peaceful sleep.`
    }

    // Add timeout for Gemini API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const result = await model.generateContent(prompt)
      clearTimeout(timeoutId)
      const rawResponseText = result.response.text()
      
      // Process text for bedtime speech patterns
      const processedText = NaturalSpeechProcessor.processForBedtime(rawResponseText)

      // Convert to speech using the gentlest settings
      const murfController = new AbortController()
      const murfTimeoutId = setTimeout(() => murfController.abort(), 30000)

      const murfResponse = await axios.post(
        'https://api.murf.ai/v1/speech/generate',
        {
          text: processedText,
          voice_id: "en-US-natalie",
          style: "Narration", // Gentle narration style for bedtime
          speed: -15 // Much slower for calming bedtime effect
        },
        {
          headers: {
            'api-key': process.env.MURF_API_KEY,
            'Content-Type': 'application/json',
          },
          signal: murfController.signal,
          timeout: 30000
        }
      )

      clearTimeout(murfTimeoutId)

      return NextResponse.json({
        success: true,
        responseText: rawResponseText,
        audioUrl: murfResponse.data.audioFile,
        contentType: sanitizedContentType || 'bedtime content',
        title: title,
      })

    } catch (genError) {
      clearTimeout(timeoutId)
      throw genError
    }

  } catch (error) {
    console.error('Error in bedtime companion:', error)
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      console.error('API response status:', axiosError.response?.status)
      console.error('API response data:', axiosError.response?.data)
    }
    
    return NextResponse.json(
      { error: 'Failed to create bedtime content. Let\'s try again with sweet dreams!' },
      { status: 500 }
    )
  }
} 