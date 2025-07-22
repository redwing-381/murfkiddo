import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { NaturalSpeechProcessor } from '@/lib/speech-processor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Style mapping for different languages (using en-US-natalie with different styles)
const getStyleForLanguage = (language: string): string => {
  const styleMap: { [key: string]: string } = {
    'spanish': 'Conversational',  // Conversational style for Spanish content
    'french': 'Narration',        // Narration style for French content  
    'chinese': 'Conversational',  // Conversational style for Chinese content
    'german': 'Narration',        // Narration style for German content
    'italian': 'Conversational',  // Conversational style for Italian content
    'japanese': 'Narration',      // Narration style for Japanese content
    'english': 'Conversational'   // Default Conversational style
  }
  return styleMap[language.toLowerCase()] || 'Conversational'
}

export async function POST(request: NextRequest) {
  try {
    const { action, targetLanguage, inputText, learningMode } = await request.json()

    if (!action || !targetLanguage) {
      return NextResponse.json({ error: 'Action and target language are required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    let prompt = ''
    let responseText = ''

    if (action === 'translate') {
      // Translation mode
      prompt = `You are a friendly language teacher for children aged 5-12. The child wants to translate: "${inputText}" to ${targetLanguage}.

Please provide:
1. The translation in ${targetLanguage} 
2. A phonetic pronunciation guide (how to say it)
3. A fun explanation or memory tip
4. An encouraging message

Format like this:
"🌍 Translation to ${targetLanguage}: [TRANSLATION]
🗣️ How to say it: [PHONETIC GUIDE]  
💡 Fun tip: [MEMORY TRICK OR CONTEXT]
🌟 Great job learning ${targetLanguage}! Try using this word today!"

Keep it simple, fun, and encouraging for kids!`

    } else if (action === 'teach_words') {
      // Vocabulary teaching mode
      prompt = `You are a playful language teacher for children aged 5-12. Teach them basic ${targetLanguage} vocabulary.

Teaching mode: ${learningMode || 'basic_words'}

Create a fun vocabulary lesson with:
1. 3-5 basic words in ${targetLanguage} (like animals, colors, numbers, family, food)
2. English translations  
3. Simple pronunciation guides
4. A fun sentence or phrase using one of the words
5. Encouraging them to practice

Make it interactive - ask them to try saying one of the words back to you!

Use lots of emojis and excitement. Make learning feel like a game!`

    } else if (action === 'conversation_practice') {
      // Simple conversation practice
      prompt = `You are a patient, encouraging language teacher for children aged 5-12. Start a very simple conversation practice in ${targetLanguage}.

The child said: "${inputText}"

Respond with:
1. A simple response in ${targetLanguage} (with English translation)
2. Praise for their effort 
3. A gentle correction if needed (but stay positive!)
4. Ask them a simple question to continue the conversation
5. Pronunciation tips if helpful

Keep the ${targetLanguage} very simple - basic greetings, yes/no questions, simple phrases.

Make it feel like talking to a encouraging friend, not a strict teacher!`

    } else if (action === 'pronunciation_help') {
      // Pronunciation practice
      prompt = `You are a helpful pronunciation coach for children learning ${targetLanguage}. The child wants help with: "${inputText}"

Provide:
1. Break the word/phrase into syllables
2. Simple phonetic guide using English sounds
3. Mouth/tongue position tips (kid-friendly)
4. A fun memory trick or rhyme to remember the sound
5. Lots of encouragement

Example format:
"🎯 Let's practice: [WORD]
📝 Break it down: [SYL-LA-BLES]
🗣️ Sounds like: [PHONETIC GUIDE]
💪 Tip: [HELPFUL TECHNIQUE]
🌟 You've got this! Practice makes perfect!"

Keep it fun and supportive - no pressure!`
    }

    const result = await model.generateContent(prompt)
    const rawResponseText = result.response.text()
    
    // Process text for natural educational speech patterns
    const processedText = NaturalSpeechProcessor.processForEducation(rawResponseText)

    // Convert to speech using appropriate style for the language
    const style = getStyleForLanguage(targetLanguage)
    const murfResponse = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        text: processedText, // Remove SSML wrapper
        voice_id: "en-US-natalie",
        style: style,
        speed: -8 // Slower for language learning clarity
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
      targetLanguage,
      responseText: rawResponseText,
      audioUrl: murfResponse.data.audioFile,
      learningMode: learningMode || 'general',
    })
  } catch (error) {
    console.error('Error in language learning:', error)
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('API response:', (error as any).response?.data)
    }
    
    return NextResponse.json(
      { error: 'Failed to process language request. Let\'s try again!' },
      { status: 500 }
    )
  }
} 