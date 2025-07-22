import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { NaturalSpeechProcessor } from '@/lib/speech-processor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { action, gameType, userResponse, gameState } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    let prompt = ''
    let responseText = ''

    if (action === 'start_game') {
      // Starting a new game
      prompt = `You are a playful game master for children aged 5-12. Start a fun ${gameType} game.

Game Types:
- riddle: Give a fun, age-appropriate riddle
- word_game: Start a rhyming game, word association, or spelling challenge
- trivia: Ask an interesting fun-fact question
- guessing_game: Start a "20 questions" style guessing game where you think of something
- story_game: Begin a collaborative story that the child can continue
- math_game: Create a fun number puzzle or math challenge

Instructions:
- Use simple, exciting language that gets kids pumped up
- Be encouraging and supportive
- Include emojis to make it fun
- Keep it age-appropriate (5-12 years)
- Make it interactive - ask for their response
- Start with enthusiasm like "Let's play!" or "I've got a fun game!"

Game type: ${gameType}

Create the opening game prompt and question. Make it exciting and clear what the child should do next!`

    } else if (action === 'respond_to_game') {
      // Responding to user's game answer
      prompt = `You are a playful game master responding to a child's answer in a ${gameType} game.

Current game context: ${gameState || 'Playing a fun game'}

The child said: "${userResponse}"

Provide an enthusiastic response that:
- Acknowledges their answer (right, wrong, or creative)
- Gives encouraging feedback
- Either continues the game with the next challenge OR starts a new round
- Uses lots of enthusiasm and emojis
- Keeps the energy high and positive
- If they got it right: celebrate and give them another challenge
- If they got it wrong: encourage them and maybe give a hint or the answer, then try another
- Keep responses to 100-200 words

Make sure to keep the game going and ask for their next response!`
    }

    const result = await model.generateContent(prompt)
    const rawResponseText = result.response.text()
    
    // Process text for natural conversational game speech
    const processedText = NaturalSpeechProcessor.processForConversation(rawResponseText)

    // Convert to speech using Murf API
    const murfResponse = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        text: processedText, // Remove SSML wrapper
        voice_id: "en-US-natalie",
        style: "Conversational", // Playful, energetic style for games
        speed: 0 // Normal speed for games to maintain energy
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
      gameType,
      responseText: rawResponseText,
      audioUrl: murfResponse.data.audioFile,
      action,
    })
  } catch (error) {
    console.error('Error in play-game:', error)
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('API response:', (error as any).response?.data)
    }
    
    return NextResponse.json(
      { error: 'Failed to process game. Let\'s try another game!' },
      { status: 500 }
    )
  }
} 