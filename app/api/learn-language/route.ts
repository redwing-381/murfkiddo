import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { NaturalSpeechProcessor } from '@/lib/speech-processor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Input validation and sanitization
function sanitizeInput(input: string): string {
  return input.replace(/[<>\"'&]/g, '').trim().substring(0, 500)
}

// Style mapping for different languages
const getStyleForLanguage = (language: string): string => {
  const styleMap: { [key: string]: string } = {
    'spanish': 'Conversational',
    'french': 'Narration',
    'chinese': 'Conversational',
    'german': 'Narration',
    'italian': 'Conversational',
    'japanese': 'Narration',
    'english': 'Conversational'
  }
  return styleMap[language.toLowerCase()] || 'Conversational'
}

export async function POST(request: NextRequest) {
  try {
    // Add API key validation
    if (!process.env.GEMINI_API_KEY || !process.env.MURF_API_KEY) {
      console.error('Missing API keys')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('Failed to parse JSON request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    console.log('Language API received:', requestBody)
    const { input: userInput, language, lessonType } = requestBody

    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      console.error('Invalid input received:', userInput)
      return NextResponse.json({ error: 'Valid input text is required' }, { status: 400 })
    }

    if (!language || typeof language !== 'string' || language.trim().length === 0) {
      console.error('Invalid language received:', language)
      return NextResponse.json({ error: 'Valid language is required' }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedInput = sanitizeInput(userInput.trim())
    const sanitizedLanguage = sanitizeInput(language.trim())
    const sanitizedLessonType = lessonType ? sanitizeInput(lessonType.trim()) : ''

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    let prompt = ''
    let title = ''
    let detectedType = 'general'

    // Determine the type of language learning based on the request and lessonType
    if (sanitizedLessonType.includes('translation') || sanitizedInput.toLowerCase().includes('translate') || sanitizedInput.toLowerCase().includes('what does') || sanitizedInput.toLowerCase().includes('how do you say') || sanitizedInput.toLowerCase().includes('mean')) {
      detectedType = 'translation'
      title = `Translation to ${sanitizedLanguage}`
      prompt = `You are a friendly language teacher for children aged 5-12. The child wants to know about: "${sanitizedInput}" in ${sanitizedLanguage}.

Please provide:
1. The translation or answer in ${sanitizedLanguage} 
2. A phonetic pronunciation guide (how to say it using English sounds)
3. A fun explanation or memory tip
4. An encouraging message

Format like this:
"🌍 In ${sanitizedLanguage}: [TRANSLATION/ANSWER]
🗣️ How to say it: [PHONETIC GUIDE using English sounds]  
💡 Fun tip: [MEMORY TRICK OR CONTEXT]
🌟 Great job learning ${sanitizedLanguage}! Try using this today!"

Keep it simple, fun, and encouraging for kids!`

    } else if (sanitizedLessonType.includes('vocabulary') || sanitizedInput.toLowerCase().includes('words') || sanitizedInput.toLowerCase().includes('vocabulary') || sanitizedInput.toLowerCase().includes('learn') || sanitizedInput.toLowerCase().includes('teach me')) {
      detectedType = 'vocabulary'
      title = `${sanitizedLanguage} Vocabulary`
      prompt = `You are a playful language teacher for children aged 5-12. Based on their request: "${sanitizedInput}", teach them ${sanitizedLanguage} vocabulary.

Create a fun vocabulary lesson with:
1. 3-5 relevant words in ${sanitizedLanguage} (related to their request - could be animals, colors, numbers, family, food, etc.)
2. English translations  
3. Simple pronunciation guides using English sounds
4. A fun sentence or phrase using one of the words
5. Encouraging them to practice

Make it interactive - ask them to try saying one of the words back to you!

Use lots of emojis and excitement. Make learning feel like a game!`

    } else if (sanitizedLessonType.includes('conversation') || sanitizedInput.toLowerCase().includes('talk') || sanitizedInput.toLowerCase().includes('conversation') || sanitizedInput.toLowerCase().includes('chat')) {
      detectedType = 'conversation'
      title = `${sanitizedLanguage} Conversation`
      prompt = `You are a patient, encouraging language teacher for children aged 5-12. Start a very simple conversation practice in ${sanitizedLanguage} based on: "${sanitizedInput}"

Create a conversation starter that includes:
1. A simple greeting or response in ${sanitizedLanguage} (with English translation)
2. Praise for their interest in learning
3. A very basic question or prompt in ${sanitizedLanguage} to get them talking
4. Pronunciation tips using English sounds
5. Encouragement to keep practicing

Keep the ${sanitizedLanguage} very simple - basic greetings, yes/no questions, simple phrases.

Make it feel like talking to an encouraging friend, not a strict teacher!`

    } else if (sanitizedLessonType.includes('pronunciation') || sanitizedInput.toLowerCase().includes('pronounce') || sanitizedInput.toLowerCase().includes('say') || sanitizedInput.toLowerCase().includes('pronunciation')) {
      detectedType = 'pronunciation'
      title = `${sanitizedLanguage} Pronunciation`
      prompt = `You are a helpful pronunciation coach for children learning ${sanitizedLanguage}. The child needs help with: "${sanitizedInput}"

Provide:
1. Break the word/phrase into syllables
2. Simple phonetic guide using English sounds they know
3. Mouth/tongue position tips (kid-friendly descriptions)
4. A fun memory trick or rhyme to remember the sound
5. Lots of encouragement

Example format:
"🎯 Let's practice: [WORD/PHRASE]
📝 Break it down: [SYL-LA-BLES]
🗣️ Sounds like: [PHONETIC GUIDE using English]
💪 Tip: [HELPFUL TECHNIQUE]
🌟 You've got this! Practice makes perfect!"

Keep it fun and supportive - no pressure!`

    } else if (sanitizedLessonType.includes('grammar') || sanitizedInput.toLowerCase().includes('grammar') || sanitizedInput.toLowerCase().includes('sentence') || sanitizedInput.toLowerCase().includes('structure')) {
      detectedType = 'grammar'
      title = `${sanitizedLanguage} Grammar`
      prompt = `You are a friendly grammar teacher for children aged 5-12 learning ${sanitizedLanguage}. Based on their question: "${sanitizedInput}"

Explain grammar in a simple, fun way:
1. Give a clear, kid-friendly explanation
2. Provide 2-3 simple examples in ${sanitizedLanguage} with English translations
3. Show a pattern they can follow
4. Include a fun memory trick
5. Encourage them to try making their own sentence

Use simple language and make grammar feel like a fun puzzle, not scary rules!

Keep examples very basic and relatable to kids (family, pets, food, toys, etc.)`

    } else if (sanitizedLessonType.includes('culture') || sanitizedInput.toLowerCase().includes('culture') || sanitizedInput.toLowerCase().includes('country') || sanitizedInput.toLowerCase().includes('tradition')) {
      detectedType = 'culture'
      title = `${sanitizedLanguage} Culture`
      prompt = `You are a cultural guide for children aged 5-12 interested in ${sanitizedLanguage} culture. Based on their interest: "${sanitizedInput}"

Share fun cultural facts that:
1. Are appropriate and interesting for kids
2. Include some basic ${sanitizedLanguage} words related to the topic
3. Compare to things they might know from their own culture
4. Include fun traditions, food, games, or celebrations
5. Encourage curiosity about the world

Make it feel like going on a mini adventure to another country!

Include simple ${sanitizedLanguage} words with pronunciation guides when relevant.`

    } else {
      // Default to general language learning
      title = `Learning ${sanitizedLanguage}`
      prompt = `You are a friendly language teacher for children aged 5-12. Based on their request: "${sanitizedInput}", help them learn ${sanitizedLanguage}.

Provide helpful language learning content that:
1. Addresses their specific question or interest
2. Includes relevant ${sanitizedLanguage} words or phrases
3. Gives pronunciation help using English sounds
4. Is fun and encouraging for kids
5. Includes a simple way they can practice

Make learning feel like an exciting adventure!`
    }

    // Add timeout for Gemini API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const result = await model.generateContent(prompt)
      clearTimeout(timeoutId)
      const rawResponseText = result.response.text()
      
      // Process text for educational speech patterns
      const processedText = NaturalSpeechProcessor.processForEducation(rawResponseText)

      // Convert to speech using appropriate style for the language
      const style = getStyleForLanguage(sanitizedLanguage)
      
      const murfController = new AbortController()
      const murfTimeoutId = setTimeout(() => murfController.abort(), 30000)

      const murfResponse = await axios.post(
        'https://api.murf.ai/v1/speech/generate',
        {
          text: processedText,
          voice_id: "en-US-natalie",
          style: style,
          speed: -8 // Slower for language learning clarity
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
          language: sanitizedLanguage,
          learningType: detectedType,
          title: title,
        })

    } catch (genError) {
      clearTimeout(timeoutId)
      throw genError
    }

  } catch (error) {
    console.error('Error in language learning:', error)
    
    // Enhanced error logging
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
      { error: 'Failed to process language request. Let\'s try again!' },
      { status: 500 }
    )
  }
} 