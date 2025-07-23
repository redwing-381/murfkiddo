"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Moon, Star, Heart, Keyboard, Volume2, Sparkles } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"
import UserPreferencesManager from "@/lib/user-preferences"
import KidAchievements from "@/components/kid-achievements"

interface BedtimeResponse {
  success: boolean
  responseText: string
  audioUrl: string
  contentType: string
  title: string
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

export default function BedtimeMode() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [conversationState, setConversationState] = useState<'menu' | 'listening' | 'creating' | 'content_ready'>('menu')
  const [currentResponse, setCurrentResponse] = useState<BedtimeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [selectedContentType, setSelectedContentType] = useState<string>("")
  const [listeningCountdown, setListeningCountdown] = useState(20) // Longer for kids
  const [bedtimeStories, setBedtimeStories] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiMessage, setAiMessage] = useState("Good evening, little dreamer! 🌙✨ I'm your cozy bedtime companion! I can create magical bedtime stories, sing gentle lullabies, or help you relax before sleep. What sounds perfect for your bedtime tonight?")

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
              handleBedtimeRequest(finalTranscript.trim())
              recognition.stop()
            }
          }, 2000) as unknown as number // Wait 2 seconds for more speech
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        
        if (event.error === 'no-speech') {
          // Auto-restart for kids, but with attempts limit
          if (restartAttempts.current < 3 && conversationState === 'listening') {
            restartAttempts.current++
            setAiMessage("I didn't hear anything! Let's try again! Press the big microphone and speak softly! 📢✨")
            setTimeout(() => {
              if (!isListening) {
                startListening()
              }
            }, 1000)
          } else {
            setError("I'm having trouble hearing you! Try using the typing option instead! 😊")
            setAiMessage("No problem! Click 'Switch to Typing' and type what you'd like for bedtime! ⌨️🌟")
          }
        } else {
          setError(`Having trouble with voice recognition. Let's try typing instead! 😊`)
          setAiMessage("Let's try typing what you'd like for bedtime instead! Click the typing button! 💻✨")
        }
        
        setIsListening(false)
        setConversationState('menu')
        clearCountdown()
      }

      recognition.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
        clearCountdown()
        
        // If we got a transcript, process it
        if (transcript.trim()) {
          handleBedtimeRequest(transcript.trim())
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
      setConversationState('listening')
      setAiMessage("I'm listening softly! Tell me what would help you have sweet dreams! 🎧✨")
      restartAttempts.current = 0
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      clearCountdown()
      clearTimeout(listeningTimeoutRef.current)
      setConversationState('menu')
      setAiMessage("Ready to help you have the most wonderful bedtime! 🌟")
    }
  }

  const handleTextInput = () => {
    if (textInput.trim()) {
      handleBedtimeRequest(textInput.trim())
      setTextInput("")
    }
  }

  const startBedtimeContent = (contentType: string) => {
    setSelectedContentType(contentType)
    setConversationState('creating')
    setAiMessage(`Sweet! 🌙 Let me create the most magical ${contentType} to help you have beautiful dreams! This is going to be so peaceful and wonderful! ✨`)
    handleBedtimeRequest(`create ${contentType}`)
  }

  const handleBedtimeRequest = async (request: string) => {
    console.log("Bedtime request:", request)
    setConversationState('creating')
    setIsProcessing(true)
    clearCountdown()
    
    try {
      const response = await fetch('/api/bedtime-companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: request,
          contentType: selectedContentType,
        }),
      })

      const data: BedtimeResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setConversationState('content_ready')
        setBedtimeStories(prev => prev + 1)
        setAiMessage("🌙 YOUR BEDTIME MAGIC IS READY! 🌙 Listen to this gentle content and let it help you drift off to dreamland! Sweet dreams! 💫")
        
        // Track usage - estimate 12 minutes for bedtime content
        UserPreferencesManager.trackUsage('Bedtime Mode', 12)
      } else {
        setError(data.error || 'Hmm, I had trouble creating that bedtime content, but that\'s okay!')
        setConversationState('menu')
        setAiMessage("Oops! I had a little trouble with that. Can you try asking for something different for bedtime? I'm here to help you sleep peacefully! 😊🌈")
      }
      setIsProcessing(false)
    } catch (err) {
      setError('Something went wrong, but let\'s try again!')
      setConversationState('menu')
      setAiMessage("No worries! Sometimes things get a little mixed up. What other peaceful thing would help you sleep tonight? 🌟")
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
    setSelectedContentType("")
    setShowTextInput(false)
    setIsProcessing(false)
    restartAttempts.current = 0
    setAiMessage("What other dreamy bedtime magic would you like? I LOVE helping wonderful kids like you have the sweetest dreams! 🌙✨")
  }

  const continueListening = () => {
    setConversationState('listening')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setAiMessage("What else would help you have sweet dreams tonight? Tell me what sounds cozy and peaceful! 🎉")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Perfect! Type what would help you sleep peacefully! I can't wait to create something magical for you! ⌨️🌟")
    } else {
      setAiMessage("Great! Press the BIG microphone button and whisper what you'd like for bedtime! 🎤✨")
    }
  }

  const bedtimeContent = [
    { 
      type: "bedtime story", 
      name: "Sleepy Story", 
      emoji: "📚", 
      description: "A gentle tale to drift off to!",
      color: "from-purple-400 to-blue-400"
    },
    { 
      type: "lullaby", 
      name: "Soft Lullaby", 
      emoji: "🎵", 
      description: "Peaceful melodies for dreams!",
      color: "from-pink-400 to-purple-400"
    },
    { 
      type: "relaxation", 
      name: "Calm & Cozy", 
      emoji: "🧘", 
      description: "Breathing and relaxation!",
      color: "from-green-400 to-blue-400"
    },
    { 
      type: "nature sounds", 
      name: "Peaceful Sounds", 
      emoji: "🌊", 
      description: "Soothing nature for sleep!",
      color: "from-blue-400 to-teal-400"
    },
    { 
      type: "goodnight wishes", 
      name: "Sweet Dreams", 
      emoji: "⭐", 
      description: "Gentle wishes for bedtime!",
      color: "from-yellow-400 to-orange-400"
    },
    { 
      type: "counting sheep", 
      name: "Sleepy Counting", 
      emoji: "🐑", 
      description: "Count your way to dreamland!",
      color: "from-gray-400 to-blue-400"
    }
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100">
      <div className="max-w-5xl mx-auto">
        {/* Super Friendly Header */}
        <div className="text-center mb-12">
          <div className="w-40 h-40 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-8 float-animation shadow-2xl">
            <span className="text-8xl">🌙</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-purple-800 mb-6 rainbow-text">
            Sleepy Time! 😴
          </h1>
        </div>

        {/* Kid Achievements System */}
        <div className="mb-12">
          <KidAchievements 
            mode="Bedtime Mode"
            currentStats={{
              bedtimeStories: bedtimeStories
            }}
          />
        </div>

        {/* AI Bedtime Companion Speech Bubble */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-3xl rounded-bl-lg p-8 max-w-4xl mx-auto shadow-2xl border-4 border-white/30">
            <div className="flex items-center mb-6">
              <span className="text-6xl mr-6 bounce-animation">🌙</span>
              <span className="font-black text-3xl">Sleepy MurfKiddo</span>
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

        {/* Bedtime Content Menu */}
        {conversationState === 'menu' && (
          <div className="space-y-12">
            <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
              <Moon className="inline w-10 h-10 mr-3 text-indigo-500 bounce-animation" />
              Pick Your Bedtime Magic! 🌟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bedtimeContent.map((content, index) => (
            <button
                  key={index}
                  onClick={() => startBedtimeContent(content.type)}
                  className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-white/70 hover:border-indigo-300 transform hover:scale-105 transition-all text-center"
                >
                  <div className={`w-24 h-24 bg-gradient-to-r ${content.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <span className="text-5xl">{content.emoji}</span>
                  </div>
                  <h3 className="text-2xl font-black text-purple-800 mb-3">{content.name}</h3>
                  <p className="text-lg text-purple-600 font-bold">{content.description}</p>
            </button>
          ))}
        </div>

            {/* Custom Request Section */}
            <div className="text-center">
              <p className="text-xl text-purple-600 font-bold mb-6">
                Or tell me something special that would help you sleep! 💫
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <button
                  onClick={startListening}
                  className="kid-button"
                >
                  <Mic className="w-8 h-8 mr-4" />
                  Tell Me! 🎤
                </button>
                <button
                  onClick={() => setShowTextInput(true)}
                  className="kid-button"
                >
                  <Keyboard className="w-8 h-8 mr-4" />
                  Type It! ⌨️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Mode Toggle - During Listening */}
        {(conversationState === 'listening' || conversationState === 'content_ready') && (
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
        {conversationState === 'listening' && !showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              {/* Giant Microphone Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`kid-mic-button mx-auto mb-8 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 pulse-animation' 
                    : 'bg-gradient-to-r from-indigo-400 to-purple-400 wiggle-animation'
                }`}
              >
                {isListening ? <MicOff className="w-24 h-24" /> : <Mic className="w-24 h-24" />}
              </button>

              {/* Listening Status - Kid Friendly */}
              {isListening && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-purple-200 to-blue-200 rounded-3xl p-6 shadow-lg">
                    <p className="text-2xl font-black text-purple-800 mb-4">
                      🎧 I'm Listening Softly! ({listeningCountdown}s)
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
                    🗣️ Your Bedtime Wish:
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    "{transcript || interimTranscript}"
                  </p>
                </div>
              )}
              
              <p className="text-xl text-purple-600 font-bold">
                💡 Try: "A story about sleepy animals" or "Soft music please"
              </p>
            </div>
          </div>
        )}

        {/* Text Input Section - Much Bigger */}
        {(conversationState === 'listening' || showTextInput) && showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              <div className="flex flex-col space-y-6">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="What would help you have sweet dreams?"
                  className="kid-input"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim() || isProcessing}
                  className="kid-button mx-auto"
                >
                  <Sparkles className="w-8 h-8 mr-4" />
                  Create Bedtime Magic! 🌙
                </button>
              </div>
              <p className="text-xl text-purple-600 font-bold mt-6">
                💡 Try: "Counting stars" or "A lullaby about the moon"
              </p>
            </div>
          </div>
        )}

        {/* Loading State - Fun for Kids */}
        {conversationState === 'creating' && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-2xl mx-auto">
              <div className="text-8xl mb-6 kid-loading">🌙</div>
              <p className="text-3xl font-black text-purple-600 mb-4">
                ✨ Creating Bedtime Magic! ✨
              </p>
              <p className="text-xl font-bold text-purple-500">
                🌟 Sprinkling sleepy dust... 💫 Adding peaceful dreams... 🌙 Almost ready!
              </p>
              <LoadingSpinner />
            </div>
          </div>
        )}

        {/* Bedtime Content Ready - Celebration */}
        {conversationState === 'content_ready' && currentResponse && (
          <div className="space-y-8">
            {/* Celebration Header */}
            <div className="text-center">
              <div className="kid-success max-w-3xl mx-auto">
                <div className="text-6xl mb-4 bounce-animation">🌙</div>
                <h2 className="text-4xl font-black text-green-800 mb-4">
                  YOUR BEDTIME MAGIC IS READY! 
                </h2>
                <p className="text-2xl font-bold text-green-700">
                  Listen and let it carry you to dreamland! 💫
                </p>
              </div>
            </div>

            {/* Audio Player */}
            <div className="max-w-4xl mx-auto">
              <AudioPlayer 
                audioUrl={currentResponse.audioUrl} 
                title={currentResponse.title || `Bedtime: ${currentResponse.contentType}`}
                autoPlay={true}
              />
            </div>

            {/* Bedtime Content Display */}
            <div className="kid-message-box max-w-4xl mx-auto">
              <h3 className="text-3xl font-black text-purple-800 mb-6">🌙 {currentResponse.title || currentResponse.contentType}</h3>
              <div className="text-xl leading-relaxed text-purple-700 font-semibold">
                {currentResponse.responseText}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-6">
              <button
                onClick={continueListening}
                className="kid-button mr-4"
              >
                <Star className="w-8 h-8 mr-4" />
                More Bedtime Magic! ✨
              </button>
              <button
                onClick={resetConversation}
                className="kid-button"
              >
                <Moon className="w-8 h-8 mr-4" />
                Sweet Dreams! 🌙
              </button>
            </div>
        </div>
        )}
      </div>
    </div>
  )
}
