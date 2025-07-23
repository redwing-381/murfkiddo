"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Globe, Star, Brain, Keyboard, Heart, Volume2 } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"
import UserPreferencesManager from "@/lib/user-preferences"
import KidAchievements from "@/components/kid-achievements"

interface LanguageResponse {
  success: boolean
  responseText: string
  audioUrl: string
  language: string
  lessonType: string
  error?: string
}

interface SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  onresult: (event: any) => void
  onerror: (event: any) => void
  onstart: () => void
  onend: () => void
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function LanguageMode() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [conversationState, setConversationState] = useState<'menu' | 'learning' | 'processing' | 'lesson_ready'>('menu')
  const [currentResponse, setCurrentResponse] = useState<LanguageResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [selectedLessonType, setSelectedLessonType] = useState<string>("")
  const [listeningCountdown, setListeningCountdown] = useState(20) // Longer for kids
  const [languagesLearned, setLanguagesLearned] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiMessage, setAiMessage] = useState("¡Hola! Bonjour! Ciao! 🌍✨ I'm your language learning buddy! I can teach you AMAZING words and phrases in different languages! Pick a language below or tell me what you want to learn! What sounds super exciting to you?")

  const countdownRef = useRef<number | undefined>(undefined)
  const listeningTimeoutRef = useRef<number | undefined>(undefined)
  const restartAttempts = useRef(0)

  // Set up speech recognition with kid-friendly settings
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      // More patient settings for children
      recognition.continuous = true
      recognition.interimResults = true
      if ('lang' in recognition) {
        recognition.lang = 'en-US'
      }

      recognition.onstart = () => {
        console.log("Speech recognition started")
        setIsListening(true)
        setError(null)
        setListeningCountdown(20) // 20 seconds for kids
        startCountdown()
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        setTranscript(finalTranscript)
        setInterimTranscript(interimTranscript)

        // Auto-submit when we get a complete sentence
        if (finalTranscript.trim()) {
          clearTimeout(listeningTimeoutRef.current)
          listeningTimeoutRef.current = window.setTimeout(() => {
            if (finalTranscript.trim()) {
              handleLanguageInput(finalTranscript.trim())
              recognition.stop()
            }
          }, 2000) as unknown as number // Wait 2 seconds for more speech
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        
        if (event.error === 'no-speech') {
          // Auto-restart for kids, but with attempts limit
          if (restartAttempts.current < 3 && conversationState === 'learning') {
            restartAttempts.current++
            setAiMessage("I didn't hear anything! Let's try again! Press the big microphone and speak clearly! 📢✨")
            setTimeout(() => {
              if (!isListening) {
                startListening()
              }
            }, 1000)
          } else {
            setError("I'm having trouble hearing you! Try using the typing option instead! 😊")
            setAiMessage("No problem! Click 'Switch to Typing' and type what you want to learn instead! ⌨️🌟")
          }
        } else {
          setError(`Having trouble with voice recognition. Let's try typing instead! 😊`)
          setAiMessage("Let's try typing what you want to learn instead! Click the typing button! 💻✨")
        }
        
        setIsListening(false)
        setConversationState('learning')
        clearCountdown()
      }

      recognition.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
        clearCountdown()
        
        // If we got a transcript, process it
        if (transcript.trim()) {
          handleLanguageInput(transcript.trim())
        }
      }

      setRecognition(recognition)
    }

    return () => {
      clearCountdown()
      clearTimeout(listeningTimeoutRef.current)
    }
  }, [transcript, conversationState])

  const startCountdown = () => {
    clearCountdown()
    let timeLeft = 20
    setListeningCountdown(timeLeft)
    
    countdownRef.current = setInterval(() => {
      timeLeft -= 1
      setListeningCountdown(timeLeft)
      
      if (timeLeft <= 0) {
        clearCountdown()
        if (recognition) {
          recognition.stop()
        }
      }
    }, 1000) as unknown as number
  }

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = undefined
    }
  }

  const startListening = () => {
    if (recognition && !isListening) {
      setError(null)
      setTranscript("")
      setInterimTranscript("")
      setAiMessage("I'm listening super carefully! Tell me what you want to learn! 🎧✨")
      restartAttempts.current = 0
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      clearCountdown()
      clearTimeout(listeningTimeoutRef.current)
      setAiMessage("Ready for your next amazing language adventure! 🌟")
    }
  }

  const handleTextInput = () => {
    if (textInput.trim()) {
      handleLanguageInput(textInput.trim())
      setTextInput("")
    }
  }

  const startLanguageLesson = (language: string, lessonType: string) => {
    setSelectedLanguage(language)
    setSelectedLessonType(lessonType)
    setConversationState('processing')
    setAiMessage(`¡Fantástico! 🎉 Let me prepare an AMAZING ${language} ${lessonType} lesson for you! This is going to be so much fun! ✨`)
    handleLanguageInput(`start ${lessonType} in ${language}`)
  }

  const handleLanguageInput = async (input: string) => {
    console.log("Language input:", input)
    setConversationState('processing')
    setIsProcessing(true)
    clearCountdown()
    
    // Set default language if none selected
    const languageToUse = selectedLanguage || 'spanish'
    const lessonTypeToUse = selectedLessonType || 'vocabulary'
    
    try {
      const response = await fetch('/api/learn-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input,
          language: languageToUse,
          lessonType: lessonTypeToUse,
        }),
      })

      const data: LanguageResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setConversationState('lesson_ready')
        setLanguagesLearned(prev => prev + 1)
        setAiMessage("🎉 YOUR LANGUAGE LESSON IS READY! 🎉 Listen to learn something amazing, or ask me to teach you more cool words! 🌟")
        
        // Track usage - estimate varies based on lesson type
        const estimatedMinutes = selectedLessonType === 'conversation' ? 15 : 8
        UserPreferencesManager.trackUsage('Language Mode', estimatedMinutes)
      } else {
        setError(data.error || 'Hmm, I had trouble with that language lesson, but that\'s okay!')
        setConversationState('learning')
        setAiMessage("Oops! I had a little trouble with that lesson. Can you try asking for something different? I'm super excited to teach you languages! 😊🌈")
      }
      setIsProcessing(false)
    } catch (err) {
      setError('Something went wrong, but let\'s keep learning!')
      setConversationState('learning')
      setAiMessage("No worries! Sometimes things get a little mixed up. What other amazing language would you like to learn? 🌟")
      setIsProcessing(false)
      console.error('Error:', err)
    }
  }

  const resetConversation = () => {
    stopListening()
    setConversationState('menu')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setSelectedLanguage("")
    setSelectedLessonType("")
    setShowTextInput(false)
    setIsProcessing(false)
    restartAttempts.current = 0
    setAiMessage("What other incredible language would you like to explore today? I LOVE teaching amazing kids like you new languages! 🌍✨")
  }

  const continueLesson = () => {
    setConversationState('learning')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setAiMessage("What else would you like to learn? Ask me for words, phrases, or anything about languages! 🎉")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Perfect! Type what you want to learn here! I can't wait to teach you something super cool! ⌨️🌟")
    } else {
      setAiMessage("Great! Press the BIG microphone button and tell me what you want to learn! 🎤✨")
    }
  }

  const languages = [
    { 
      name: "Spanish", 
      emoji: "🇪🇸", 
      greeting: "¡Hola!",
      color: "from-red-400 to-yellow-400"
    },
    { 
      name: "French", 
      emoji: "🇫🇷", 
      greeting: "Bonjour!",
      color: "from-blue-400 to-white to-red-400"
    },
    { 
      name: "Italian", 
      emoji: "🇮🇹", 
      greeting: "Ciao!",
      color: "from-green-400 to-white to-red-400"
    },
    { 
      name: "German", 
      emoji: "🇩🇪", 
      greeting: "Hallo!",
      color: "from-black to-red-400 to-yellow-400"
    },
    { 
      name: "Japanese", 
      emoji: "🇯🇵", 
      greeting: "Konnichiwa!",
      color: "from-red-500 to-white"
    },
    { 
      name: "Mandarin", 
      emoji: "🇨🇳", 
      greeting: "Nǐ hǎo!",
      color: "from-red-500 to-yellow-400"
    }
  ]

  const lessonTypes = [
    { type: "vocabulary", name: "Fun Words", emoji: "📝", description: "Learn cool new words!" },
    { type: "phrases", name: "Useful Phrases", emoji: "💬", description: "Say amazing things!" },
    { type: "conversation", name: "Chat Practice", emoji: "🗣️", description: "Talk like a local!" },
    { type: "pronunciation", name: "Sound Perfect", emoji: "🎵", description: "Speak beautifully!" }
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-blue-100 via-green-50 to-yellow-100">
      <div className="max-w-5xl mx-auto">
        {/* Super Friendly Header */}
        <div className="text-center mb-12">
          <div className="w-40 h-40 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center mx-auto mb-8 float-animation shadow-2xl">
            <span className="text-8xl">🌍</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-purple-800 mb-6 rainbow-text">
            Language Fun! 🗣️
          </h1>
        </div>

        {/* Kid Achievements System */}
        <div className="mb-12">
          <KidAchievements 
            mode="Language Mode"
            currentStats={{
              languagesLearned: languagesLearned
            }}
          />
        </div>

        {/* AI Language Teacher Speech Bubble */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-3xl rounded-bl-lg p-8 max-w-4xl mx-auto shadow-2xl border-4 border-white/30">
            <div className="flex items-center mb-6">
              <span className="text-6xl mr-6 bounce-animation">🌍</span>
              <span className="font-black text-3xl">Teacher MurfKiddo</span>
            </div>
            <p className="text-2xl leading-relaxed font-bold">{aiMessage}</p>
          </div>
        </div>

        {/* Error Message - Kid Friendly */}
        {error && (
          <div className="kid-error mb-8 max-w-2xl mx-auto">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">😊</span>
              <span className="text-2xl font-black">No Problem!</span>
            </div>
            <p className="text-xl font-bold">{error}</p>
          </div>
        )}

        {/* Language Selection Menu */}
        {conversationState === 'menu' && (
          <div className="space-y-12">
            <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
              <Globe className="inline w-10 h-10 mr-3 text-blue-500 bounce-animation" />
              Pick Your Amazing Language! 🌟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languages.map((language, index) => (
                <div key={index} className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-white/70 text-center">
                  <div className="text-6xl mb-4 bounce-animation">{language.emoji}</div>
                  <h3 className="text-2xl font-black text-purple-800 mb-3">{language.name}</h3>
                  <p className="text-xl text-purple-600 font-bold mb-6">{language.greeting}</p>
                  
                  <div className="space-y-3">
                    {lessonTypes.map((lesson, lessonIndex) => (
                      <button
                        key={lessonIndex}
                        onClick={() => startLanguageLesson(language.name, lesson.type)}
                        className="w-full bg-gradient-to-r from-blue-400 to-green-400 text-white px-4 py-3 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
                      >
                        <span className="text-2xl">{lesson.emoji}</span>
                        <span>{lesson.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Mode Toggle - During Learning */}
        {(conversationState === 'learning' || conversationState === 'lesson_ready') && (
          <div className="text-center mb-8">
            <button
              onClick={toggleInputMode}
              className="kid-toggle"
            >
              {showTextInput ? <Mic className="w-8 h-8" /> : <Keyboard className="w-8 h-8" />}
              <span className="text-xl font-black">
                {showTextInput ? "🎤 Switch to Voice!" : "⌨️ Switch to Typing!"}
              </span>
            </button>
          </div>
        )}

        {/* Voice Input Section - Much Bigger */}
        {conversationState === 'learning' && !showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              {/* Giant Microphone Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`kid-mic-button mx-auto mb-8 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 pulse-animation' 
                    : 'bg-gradient-to-r from-blue-400 to-green-400 wiggle-animation'
                }`}
              >
                {isListening ? <MicOff className="w-24 h-24" /> : <Mic className="w-24 h-24" />}
              </button>

              {/* Listening Status - Kid Friendly */}
              {isListening && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-green-200 to-blue-200 rounded-3xl p-6 shadow-lg">
                    <p className="text-2xl font-black text-green-800 mb-4">
                      🎧 I'm Listening for What You Want to Learn! ({listeningCountdown}s)
                    </p>
                    <div className="bg-white rounded-full h-6 overflow-hidden">
                      <div 
                        className="kid-progress h-full"
                        style={{ width: `${(listeningCountdown / 20) * 100}%` }}
                      />
                    </div>
          </div>
        </div>
              )}

              {/* What the kid is saying */}
              {(transcript || interimTranscript) && (
                <div className="bg-gradient-to-r from-blue-200 to-purple-200 rounded-3xl p-6 mb-6 shadow-lg border-4 border-blue-300">
                  <p className="text-xl font-black text-blue-800 mb-2">
                    🗣️ You Want to Learn:
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    "{transcript || interimTranscript}"
                  </p>
                </div>
              )}
              
              <p className="text-xl text-purple-600 font-bold">
                💡 Try: "Teach me colors in Spanish" or "How do I say hello?"
              </p>
            </div>
          </div>
        )}

        {/* Text Input Section - Much Bigger */}
        {conversationState === 'learning' && showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              <div className="flex flex-col space-y-6">
            <input
              type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="What do you want to learn in this language?"
                  className="kid-input"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim() || isProcessing}
                  className="kid-button mx-auto"
                >
                  <Brain className="w-8 h-8 mr-4" />
                  Teach Me! 🌟
                </button>
              </div>
              <p className="text-xl text-purple-600 font-bold mt-6">
                💡 Try: "Numbers in French" or "How to order food"
              </p>
            </div>
          </div>
        )}

        {/* Loading State - Fun for Kids */}
        {conversationState === 'processing' && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-2xl mx-auto">
              <div className="text-8xl mb-6 kid-loading">🌍</div>
              <p className="text-3xl font-black text-purple-600 mb-4">
                ✨ Preparing Your Language Lesson! ✨
              </p>
              <p className="text-xl font-bold text-purple-500">
                🔍 Finding the perfect words... 💫 Making it super fun to learn... 🎉 Almost ready!
              </p>
              <LoadingSpinner />
            </div>
          </div>
        )}

        {/* Language Lesson Ready - Celebration */}
        {conversationState === 'lesson_ready' && currentResponse && (
          <div className="space-y-8">
            {/* Celebration Header */}
          <div className="text-center">
              <div className="kid-success max-w-3xl mx-auto">
                <div className="text-6xl mb-4 bounce-animation">🌟</div>
                <h2 className="text-4xl font-black text-green-800 mb-4">
                  YOUR LESSON IS READY! 
                </h2>
                <p className="text-2xl font-bold text-green-700">
                  You're going to learn something AMAZING! 🌍
                </p>
              </div>
            </div>

            {/* Audio Player */}
            <div className="max-w-4xl mx-auto">
              <AudioPlayer 
                audioUrl={currentResponse.audioUrl} 
                title={`Learning: ${currentResponse.language} - ${currentResponse.lessonType}`}
                autoPlay={true}
              />
            </div>

            {/* Language Lesson Display */}
            <div className="kid-message-box max-w-4xl mx-auto">
              <h3 className="text-3xl font-black text-purple-800 mb-6">🌍 {currentResponse.language} - {currentResponse.lessonType}</h3>
              <div className="text-xl leading-relaxed text-purple-700 font-semibold">
                {currentResponse.responseText}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-6">
              <button
                onClick={continueLesson}
                className="kid-button mr-4"
              >
                <Star className="w-8 h-8 mr-4" />
                Learn More! 🌟
              </button>
              <button
                onClick={resetConversation}
                className="kid-button"
              >
                <Globe className="w-8 h-8 mr-4" />
                New Language! 🌍
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
