import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function getVoiceId(type: string = 'friendly') {
  const voices = {
    friendly: 'en-US-natalie',
    cheerful: 'en-US-sarah', 
    calm: 'en-US-kate',
    playful: 'en-US-katie'
  }
  return voices[type as keyof typeof voices] || voices.friendly
}

export async function POST(request: NextRequest) {
  try {
    const { message, childName, voiceType = 'friendly', chatHistory = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build conversation context
    let conversationContext = chatHistory.map((msg: any) => 
      `${msg.role === 'user' ? 'Child' : 'MurfKiddo'}: ${msg.content}`
    ).join('\n')

    if (conversationContext) {
      conversationContext = `Previous conversation:\n${conversationContext}\n\n`
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `You are MurfKiddo, a friendly, cheerful, and supportive AI companion for children aged 5-12. A child ${childName ? `named ${childName} ` : ''}has sent you this message: "${message}"

${conversationContext}Please respond as MurfKiddo with these guidelines:

**Personality & Tone:**
- Be warm, enthusiastic, and genuinely interested in what the child says
- Use age-appropriate language that's easy to understand
- Show excitement about their questions, ideas, and stories
- Be encouraging and supportive
- Use a conversational, friendly tone like talking to a good friend

**Response Style:**
- Keep responses conversational and natural (100-200 words)
- Ask follow-up questions to keep the conversation going
- Show curiosity about their interests and experiences
- Use simple, clear language
- Include appropriate emojis to make it fun and engaging
- Remember details from the conversation to show you're listening

**Content Guidelines:**
- Answer any questions they have in a kid-friendly way
- If they share something personal, respond with empathy and encouragement
- For educational topics, explain things simply with fun examples
- If they want to play word games or tell jokes, participate enthusiastically
- For creative topics (stories, drawings, games), be imaginative and supportive
- Always maintain a positive, safe, and nurturing environment

**Safety & Appropriateness:**
- Keep all content completely child-safe and educational
- If inappropriate topics come up, gently redirect to more suitable subjects
- Never share personal information or ask for theirs
- Focus on learning, creativity, fun, and positive interactions

Respond as MurfKiddo would - like a caring, fun, and knowledgeable friend who's always excited to chat!`

    const result = await model.generateContent(prompt)
    const aiResponse = result.response.text()

    // Generate speech using Murf API
    let audioUrl = null
    try {
      const murfResponse = await axios.post(
        'https://api.murf.ai/v1/speech/generate',
        {
          text: aiResponse.replace(/\*/g, '').replace(/#{1,}/g, ''), // Clean up markdown
          voiceId: getVoiceId(voiceType)
        },
        {
          headers: {
            'api-key': process.env.MURF_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      )

      if (murfResponse.data && murfResponse.data.audioFile) {
        audioUrl = murfResponse.data.audioFile
      }
    } catch (murfError) {
      console.error('Murf API error:', murfError)
      // Continue without audio if Murf fails
    }

    return NextResponse.json({
      success: true,
      message: aiResponse,
      audioUrl,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in chat API:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('API response:', (error as any).response?.data)
    }
    
    return NextResponse.json(
      { error: 'Failed to generate chat response' },
      { status: 500 }
    )
  }
} 