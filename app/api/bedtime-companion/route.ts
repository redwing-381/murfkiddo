import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Use the most soothing, gentle voice for bedtime content
const getBedtimeVoice = (): string => {
  return 'en-US-natalie' // Softest, most calming voice available
}

export async function POST(request: NextRequest) {
  try {
    const { action, contentType, childName, favoriteThings } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    let prompt = ''
    let responseText = ''

    if (action === 'bedtime_story') {
      // Generate calming bedtime story
      prompt = `You are a gentle, soothing bedtime storyteller for children aged 5-12. Create a peaceful bedtime story.

Story type: ${contentType || 'peaceful adventure'}
Child's name: ${childName || 'little one'}
Things they love: ${favoriteThings || 'gentle animals and nature'}

Create a calming bedtime story that:
- Is 200-300 words long (perfect bedtime length)
- Has a peaceful, gentle tone
- Includes the child's name if provided
- Features their favorite things if mentioned
- Has a soothing, happy ending that promotes good dreams
- Uses soft, gentle language (whisper-quiet, gentle breeze, soft moonlight, etc.)
- Includes nature, friendly animals, or magical but peaceful elements
- Ends with the character going to sleep peacefully
- Encourages the child to have sweet dreams

Start with something like "Close your eyes, ${childName || 'little one'}, and let me tell you a gentle story..."

Make it dreamy and calming, perfect for drifting off to sleep. Use emojis sparingly and gently (🌙✨💤).`

    } else if (action === 'lullaby') {
      // Generate gentle lullaby
      prompt = `You are a caring bedtime companion creating a soothing lullaby for children.

Child's name: ${childName || 'little one'}
Lullaby theme: ${contentType || 'stars and moon'}

Create a gentle, original lullaby that:
- Has 2-3 short verses
- Uses simple, repetitive, soothing words
- Mentions stars, moon, dreams, sleep
- Includes the child's name if provided
- Has a soft rhythm perfect for singing
- Is calming and not exciting
- Ends with "close your eyes" or similar peaceful ending

Format like a song with gentle spacing:
"🌙 Gentle Lullaby for ${childName || 'You'} 🌙

[Verse 1]
[Simple, soothing lyrics]

[Verse 2]
[More peaceful lyrics]

[Gentle ending]
Sweet dreams, ${childName || 'little one'}... 💤"

Keep it very soft and sleepy.`

    } else if (action === 'relaxation') {
      // Generate calming relaxation/breathing exercise
      prompt = `You are a gentle mindfulness guide for children at bedtime. Create a simple, calming relaxation exercise.

Child's name: ${childName || 'little one'}
Focus: ${contentType || 'peaceful breathing'}

Create a short (2-3 minute) bedtime relaxation that:
- Uses very simple, gentle instructions
- Focuses on slow breathing or gentle body relaxation
- Uses peaceful imagery (floating clouds, gentle waves, soft animals)
- Speaks very slowly and calmly
- Includes the child's name to make it personal
- Ends with encouraging them to drift off to sleep
- Uses soft, whispering language

Example start: "Let's take some gentle breaths together, ${childName || 'little one'}..."

Make it super calm and sleepy - like a gentle whisper that helps them relax completely.`

    } else if (action === 'goodnight_wishes') {
      // Generate personalized goodnight message
      prompt = `You are a loving bedtime companion saying goodnight to a child.

Child's name: ${childName || 'little one'}
Special mentions: ${favoriteThings || 'their favorite stuffed animals'}

Create a warm, personal goodnight message that:
- Is short and sweet (50-100 words)
- Mentions their name lovingly
- Includes wishes for sweet dreams
- Maybe mentions their favorite things having good dreams too
- Is like what a loving parent or grandparent would say
- Ends with encouraging peaceful sleep
- Uses gentle, loving language

Make it feel like a warm hug in words, perfect for the last thing they hear before sleep.`
    }

    const result = await model.generateContent(prompt)
    responseText = result.response.text()

    // Convert to speech using the gentlest voice setting
    const voiceId = getBedtimeVoice()
    const murfResponse = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        text: responseText,
        voiceId: voiceId
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
      action,
      contentType: contentType || 'general',
      responseText,
      audioUrl: murfResponse.data.audioFile,
      childName: childName || null,
    })
  } catch (error) {
    console.error('Error in bedtime companion:', error)
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('API response:', (error as any).response?.data)
    }
    
    return NextResponse.json(
      { error: 'Failed to create bedtime content. Let\'s try again with sweet dreams!' },
      { status: 500 }
    )
  }
} 