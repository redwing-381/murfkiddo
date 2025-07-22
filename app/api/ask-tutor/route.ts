import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { NaturalSpeechProcessor } from '@/lib/speech-processor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { question, subject } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Generate educational response using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a friendly and knowledgeable tutor for children aged 5-12. A child has asked: "${question}"

    Please provide a clear, age-appropriate explanation that:
    - Uses simple, easy-to-understand language
    - Includes fun examples or analogies that kids can relate to
    - Is educational but engaging (not boring!)
    - Is about 100-200 words long
    - Encourages curiosity and follow-up questions
    - Uses excitement and enthusiasm in your tone
    - Includes relevant emojis to make it fun
    - Avoids scary or complex technical jargon

    Subject context: ${subject || 'general knowledge'}

    Start your response with something like "Great question!" or "That's so cool that you asked!" and make it sound like you're excited to teach them.`

    const result = await model.generateContent(prompt)
    const rawExplanation = result.response.text()
    
    // Process text for natural educational speech patterns
    const processedText = NaturalSpeechProcessor.processForEducation(rawExplanation)

    // Convert to speech using Murf API
    const murfResponse = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        text: processedText, // Remove SSML wrapper
        voice_id: "en-US-natalie",
        style: "Conversational", // Use a friendly, educational style
        speed: -5 // Slightly slower for educational content
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
      question,
      explanation: rawExplanation,
      audioUrl: murfResponse.data.audioFile,
      subject: subject || 'General Knowledge',
    })
  } catch (error) {
    console.error('Error generating educational response:', error)
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('API response:', (error as any).response?.data)
    }
    
    return NextResponse.json(
      { error: 'Failed to generate explanation. Please try asking again!' },
      { status: 500 }
    )
  }
} 