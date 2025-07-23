import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const childName = formData.get('childName') as string
    const conversationHistoryStr = formData.get('conversationHistory') as string
    const userText = formData.get('userText') as string
    
    let userMessage = ''

    // If we have direct text (from browser speech recognition), use that
    if (userText?.trim()) {
      userMessage = userText.trim()
    } 
    // Otherwise, try to transcribe audio with OpenAI Whisper
    else if (audioFile) {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'en',
          response_format: 'text',
          temperature: 0.2 // Lower temperature for more accurate transcription
        })
        
        userMessage = transcription.trim()
        
      } catch (transcriptionError: any) {
        console.error('Whisper transcription error:', transcriptionError)
        
        // For any error, suggest using browser speech recognition
        return NextResponse.json({ 
          error: 'Audio transcription failed. Using browser speech recognition instead.',
          success: false,
          useWebSpeechAPI: true
        }, { status: 400 })
      }
    } else {
      return NextResponse.json({ 
        error: 'Audio file or text is required',
        success: false 
      }, { status: 400 })
    }

    if (!userMessage || userMessage.length < 1) {
      return NextResponse.json({ 
        error: 'Could not understand input. Please try speaking again.',
        success: false 
      }, { status: 400 })
    }

    // Parse conversation history (limit to recent messages)
    let conversationHistory: string[] = []
    try {
      if (conversationHistoryStr) {
        const fullHistory = JSON.parse(conversationHistoryStr)
        // Only keep last 8 messages to avoid token limits and improve response time
        conversationHistory = fullHistory.slice(-8)
      }
    } catch (parseError) {
      console.warn('Failed to parse conversation history:', parseError)
    }

    // Build conversation context for OpenAI
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = `Previous conversation:\n${conversationHistory.join('\n')}\n\n`
    }

    // Generate AI response using OpenAI GPT with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are MurfKiddo, a friendly, cheerful AI voice companion for children aged 5-12. 

**CRITICAL VOICE CONVERSATION RULES:**
- Keep responses SHORT (1-2 sentences max) - this is spoken conversation
- Use simple, clear words that kids understand
- Be warm, enthusiastic, and encouraging
- Ask ONE simple follow-up question to keep conversation flowing
- Sound natural and conversational, not scripted

**Personality:**
- Friendly and supportive, like a caring older sibling
- Genuinely interested in what the child is saying
- Encouraging and positive
- Playful but not overly silly

**Response Style:**
- Natural conversation flow
- Show you're listening by referencing what they said
- Keep it conversational and engaging
- Use expressions like "That's cool!" or "Wow!" when appropriate

**Safety:**
- Keep all content child-safe and positive
- If inappropriate topics come up, gently redirect to something fun
- Never ask for personal information

Remember: This is a VOICE conversation, so be conversational and brief!`
          },
          {
            role: 'user',
            content: `${conversationContext}Child ${childName ? `named ${childName} ` : ''}just said: "${userMessage}"`
          }
        ],
        max_tokens: 100, // Keep responses short for voice
        temperature: 0.7, // Balanced creativity and consistency
        presence_penalty: 0.3, // Encourage variety in responses
        frequency_penalty: 0.2 // Reduce repetitive phrases
      }, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      const aiMessage = completion.choices[0]?.message?.content?.trim()

      if (!aiMessage) {
        throw new Error('No response generated from OpenAI')
      }

      return NextResponse.json({
        success: true,
        userMessage,
        message: aiMessage,
        timestamp: new Date().toISOString()
      })

    } catch (completionError: any) {
      clearTimeout(timeoutId)
      
      if (completionError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Response took too long. Please try again.'
        }, { status: 408 })
      }
      
      throw completionError
    }

  } catch (error: any) {
    console.error('Error in voice agent API:', error)
    
    // Return a helpful error response
    let errorMessage = 'I had trouble processing that. Please try again!'
    
    if (error.message?.includes('timeout') || error.name === 'AbortError') {
      errorMessage = 'That took too long. Let\'s try again!'
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Connection issue. Please check your internet and try again!'
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
} 