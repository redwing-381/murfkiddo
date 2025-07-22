"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Moon, Star, Heart, Wind, Keyboard, Volume2 } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"

interface BedtimeResponse {
  success: boolean
  action: string
  contentType: string
  responseText: string
  audioUrl: string
  childName: string | null
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
  const [bedtimeState, setBedtimeState] = useState<'welcome' | 'content_select' | 'personalizing' | 'listening' | 'processing' | 'content_ready'>('welcome')
  const [currentResponse, setCurrentResponse] = useState<BedtimeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [selectedContentType, setSelectedContentType] = useState<string>("")
  const [childName, setChildName] = useState<string>("")
  const [favoriteThings, setFavoriteThings] = useState<string>("")
  const [listeningCountdown, setListeningCountdown] = useState(15)
  const [storiesCount, setStoriesCount] = useState(0)
  const [aiMessage, setAiMessage] = useState("Shhh... welcome to bedtime, little one. 🌙 I'm here to help you have the most peaceful sleep with gentle stories, soft lullabies, and sweet dreams. What would help you relax tonight?")

  const countdownRef = useRef<number | undefined>(undefined)
  const restartAttempts = useRef(0)

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        
        recognition.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim()
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          if (interimTranscript) {
            setInterimTranscript(interimTranscript)
          }
          
          if (finalTranscript && finalTranscript.length > 1) {
            console.log("Bedtime input:", finalTranscript)
            setTranscript(finalTranscript)
            stopListening()
            if (bedtimeState === 'personalizing') {
              handlePersonalization(finalTranscript)
            } else {
              handleBedtimeInput(finalTranscript)
            }
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          clearCountdown()
          
          if (event.error === 'not-allowed') {
            setError("I need microphone permission to hear your bedtime wishes 🎤 Please allow microphone access.")
            setShowTextInput(true)
          } else if (event.error === 'no-speech') {
            if (restartAttempts.current < 2) {
              restartAttempts.current++
              window.setTimeout(() => {
                if (bedtimeState === 'listening' || bedtimeState === 'personalizing') {
                  startListening()
                }
              }, 500)
            } else {
              setError("I'm having trouble hearing you whisper. Try typing softly instead! ⌨️")
              setShowTextInput(true)
            }
          } else if (event.error === 'aborted') {
            // Normal stop, don't show error
          } else {
            setError("Let's try typing your bedtime wishes instead! 💤")
            setShowTextInput(true)
          }
        }
        
        recognition.onstart = () => {
          console.log("Speech recognition started")
          setIsListening(true)
          setError(null)
          setInterimTranscript("")
          restartAttempts.current = 0
          startCountdown()
        }
        
        recognition.onend = () => {
          console.log("Speech recognition ended")
          setIsListening(false)
          clearCountdown()
          
          if ((bedtimeState === 'listening' || bedtimeState === 'personalizing') && restartAttempts.current < 3) {
            restartAttempts.current++
            window.setTimeout(() => {
              if (bedtimeState === 'listening' || bedtimeState === 'personalizing') {
                console.log("Restarting recognition, attempt:", restartAttempts.current)
                recognition.start()
              }
            }, 300)
          }
        }
        
        setRecognition(recognition)
      } else {
        setShowTextInput(true)
        setAiMessage("Hi sleepy one! Your browser doesn't support voice, but you can type your bedtime wishes! 💤")
      }
    }
  }, [bedtimeState])

  const clearCountdown = () => {
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current)
      countdownRef.current = undefined
    }
  }

  const startCountdown = () => {
    setListeningCountdown(15)
    
    countdownRef.current = window.setInterval(() => {
      setListeningCountdown((prev) => {
        if (prev <= 1) {
          stopListening()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startListening = () => {
    if (recognition) {
      setTranscript("")
      setInterimTranscript("")
      restartAttempts.current = 0
      
      try {
        recognition.start()
      } catch (error) {
        console.error("Failed to start recognition:", error)
        setError("Let's try typing your bedtime wishes instead! ⌨️")
        setShowTextInput(true)
      }
    } else {
      setShowTextInput(true)
      setError("Let's type your bedtime wishes! 💤")
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
    }
    setIsListening(false)
    clearCountdown()
  }

  const handleTextInput = () => {
    if (textInput.trim()) {
      if (bedtimeState === 'personalizing') {
        handlePersonalization(textInput.trim())
      } else {
        handleBedtimeInput(textInput.trim())
      }
      setTextInput("")
    }
  }

  const selectContentType = (contentType: string, action: string) => {
    setSelectedContentType(contentType)
    setBedtimeState('personalizing')
    setAiMessage(`Perfect choice! 🌙 To make this extra special, what's your name? And what are some things you love? (like teddy bears, puppies, or fairy tales)`)
  }

  const handlePersonalization = (input: string) => {
    // Simple parsing - look for name and favorite things
    const words = input.toLowerCase().split(/\s+/)
    let detectedName = ""
    let detectedFavorites = input

    // Try to extract name (simple heuristic)
    if (input.toLowerCase().includes("my name is")) {
      const nameIndex = words.indexOf("name") + 2
      if (nameIndex < words.length) {
        detectedName = words[nameIndex]
      }
    } else {
      // Assume first word might be name if it's short
      const firstWord = words[0]
      if (firstWord && firstWord.length <= 10 && firstWord.match(/^[a-zA-Z]+$/)) {
        detectedName = firstWord
      }
    }

    setChildName(detectedName || "little one")
    setFavoriteThings(detectedFavorites || "gentle dreams and cozy blankets")
    
    // Now generate the content
    generateBedtimeContent(detectedName, detectedFavorites)
  }

  const generateBedtimeContent = async (name?: string, favorites?: string) => {
    setBedtimeState('processing')
    setError(null)
    setAiMessage("Creating something peaceful just for you... 💤✨")
    clearCountdown()
    
    const actionMap: { [key: string]: string } = {
      'gentle_story': 'bedtime_story',
      'soft_lullaby': 'lullaby', 
      'calm_breathing': 'relaxation',
      'sweet_dreams': 'goodnight_wishes'
    }
    
    try {
      const response = await fetch('/api/bedtime-companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionMap[selectedContentType] || 'bedtime_story',
          contentType: selectedContentType,
          childName: name || childName,
          favoriteThings: favorites || favoriteThings,
        }),
      })

      const data: BedtimeResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setBedtimeState('content_ready')
        if (data.action === 'bedtime_story') {
          setStoriesCount(storiesCount + 1)
        }
        setAiMessage("Your peaceful bedtime content is ready... 🌙 Close your eyes and listen to sweet dreams ✨")
      } else {
        setError(data.error || 'Failed to create bedtime content')
        setBedtimeState('content_select')
        setAiMessage("Let's try creating something else peaceful for bedtime... 💤")
      }
    } catch (err) {
      setError('Something went wrong. Let\'s try again with gentle dreams!')
      setBedtimeState('content_select')
      setAiMessage("Let's create something soothing for sweet dreams... 😴")
      console.error('Error:', err)
    }
  }

  const handleBedtimeInput = (input: string) => {
    // This could be used for interactive bedtime conversations if needed
    console.log("General bedtime input:", input)
    // For now, just acknowledge
    setAiMessage("That sounds lovely... let's choose what would help you sleep peacefully tonight 🌙")
  }

  const startNewContent = () => {
    setBedtimeState('content_select')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setChildName("")
    setFavoriteThings("")
    setSelectedContentType("")
    setAiMessage("What else would help you drift off to dreamland tonight? 😴✨")
  }

  const backToWelcome = () => {
    stopListening()
    setBedtimeState('welcome')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setChildName("")
    setFavoriteThings("")
    setSelectedContentType("")
    setShowTextInput(false)
    restartAttempts.current = 0
    setAiMessage("Welcome back to your peaceful bedtime space... 🌙 I'm here for sweet dreams whenever you're ready")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Type your bedtime wishes softly... 💤")
    } else {
      setAiMessage("Whisper your bedtime dreams to me... 🌙")
    }
  }

  const bedtimeContentTypes = [
    { 
      id: "gentle_story", 
      name: "Bedtime Story", 
      icon: "📖", 
      description: "A gentle, dreamy story to drift off to",
      color: "from-indigo-400/80 to-purple-400/80",
      action: "bedtime_story"
    },
    { 
      id: "soft_lullaby", 
      name: "Lullaby", 
      icon: "🎵", 
      description: "Soft, soothing lullaby just for you",
      color: "from-purple-400/80 to-pink-400/80",
      action: "lullaby"
    },
    { 
      id: "calm_breathing", 
      name: "Relaxation", 
      icon: "🫧", 
      description: "Gentle breathing and peaceful thoughts",
      color: "from-blue-400/80 to-indigo-400/80",
      action: "relaxation"
    },
    { 
      id: "sweet_dreams", 
      name: "Goodnight Wishes", 
      icon: "💤", 
      description: "Special goodnight message for you",
      color: "from-pink-400/80 to-red-400/80",
      action: "goodnight_wishes"
    },
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 relative">
      {/* Floating Stars Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: `${Math.random() * 8 + 8}px`,
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Gentle Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-r from-indigo-400/80 to-purple-400/80 rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-lg backdrop-blur-sm border border-white/20">
            <span className="text-6xl">🌙</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Sweet Dreams</h1>
          
          {/* Progress Display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto shadow-lg border border-white/20">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <Moon className="w-6 h-6 text-indigo-300" />
                <span className="font-bold text-white">Bedtime Stories: {storiesCount}</span>
              </div>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.min(storiesCount, 3) ? "text-yellow-300 fill-current" : "text-white/20"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Bedtime Companion Speech Bubble */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-400/80 to-purple-400/80 backdrop-blur-sm text-white rounded-3xl rounded-bl-lg p-6 max-w-2xl mx-auto shadow-lg border border-white/20">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">😴</span>
              <span className="font-bold text-xl">Luna the Dream Keeper</span>
            </div>
            <p className="text-lg leading-relaxed opacity-90">{aiMessage}</p>
          </div>
        </div>

        {/* Welcome State */}
        {bedtimeState === 'welcome' && (
          <div className="text-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
              <div className="text-6xl mb-6 animate-pulse">💤</div>
              <h2 className="text-2xl font-bold text-white mb-4">Time for Peaceful Dreams</h2>
              <p className="text-purple-200 mb-6">Let me help you drift off to the most wonderful sleep...</p>
              <button 
                onClick={() => setBedtimeState('content_select')}
                className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all border border-white/20"
              >
                Ready for Bedtime 🌙
              </button>
            </div>
          </div>
        )}

        {/* Content Selection */}
        {bedtimeState === 'content_select' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              <Heart className="inline w-8 h-8 mr-2 text-pink-300" />
              What Would Help You Sleep Tonight?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bedtimeContentTypes.map((content) => (
                <button
                  key={content.id}
                  onClick={() => selectContentType(content.id, content.action)}
                  className={`bg-gradient-to-r ${content.color} backdrop-blur-sm hover:shadow-xl transform hover:scale-105 text-white rounded-3xl p-6 transition-all duration-200 shadow-lg border border-white/20`}
                >
                  <div className="text-4xl mb-3">{content.icon}</div>
                  <h3 className="font-bold text-xl mb-2">{content.name}</h3>
                  <p className="text-sm opacity-90">{content.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Mode Toggle */}
        {bedtimeState === 'personalizing' && (
          <div className="text-center mb-4">
            <button
              onClick={toggleInputMode}
              className="bg-gradient-to-r from-indigo-400/80 to-purple-400/80 backdrop-blur-sm text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all flex items-center space-x-2 mx-auto border border-white/20"
            >
              {showTextInput ? <Mic className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
              <span>{showTextInput ? "Switch to Voice" : "Switch to Typing"}</span>
            </button>
          </div>
        )}

        {/* Voice Input Section */}
        {bedtimeState === 'personalizing' && !showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 backdrop-blur-sm border border-white/20 ${
                  isListening 
                    ? 'bg-gradient-to-r from-pink-400/80 to-red-400/80 animate-pulse' 
                    : 'bg-gradient-to-r from-indigo-400/80 to-purple-400/80'
                }`}
              >
                {isListening ? <MicOff className="w-16 h-16" /> : <Mic className="w-16 h-16" />}
              </button>
              
              {isListening && (
                <div className="mb-4">
                  <div className="text-2xl font-bold text-indigo-300 mb-2">
                    🎤 Listening gently... {listeningCountdown}s
                  </div>
                  <div className="bg-indigo-400/20 rounded-2xl p-3 border border-white/10">
                    <p className="text-indigo-200 font-medium">Whisper your name and favorite things...</p>
                  </div>
                </div>
              )}
              
              <p className="text-lg text-purple-200 font-medium mb-4">
                {isListening ? "🌙 I'm listening softly..." : "👆 Whisper to me..."}
              </p>
              
              {interimTranscript && (
                <div className="bg-yellow-400/20 rounded-2xl p-4 mb-4 border border-yellow-300/20">
                  <p className="text-yellow-200">
                    <span className="font-bold">I'm hearing:</span> "{interimTranscript}..."
                  </p>
                </div>
              )}
              
              {transcript && (
                <div className="bg-blue-400/20 rounded-2xl p-4 mb-4 border border-blue-300/20">
                  <p className="text-blue-200">
                    <span className="font-bold">You whispered:</span> "{transcript}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Input Section */}
        {bedtimeState === 'personalizing' && showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
              <div className="flex items-center space-x-4 max-w-lg mx-auto">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="What's your name? What do you love?"
                  className="flex-1 px-6 py-4 text-lg rounded-2xl bg-white/20 border border-white/30 focus:border-white/50 focus:outline-none text-white placeholder-white/60"
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim()}
                  className="bg-gradient-to-r from-indigo-400/80 to-purple-400/80 backdrop-blur-sm text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20"
                >
                  <Wind className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {bedtimeState === 'processing' && (
          <div className="text-center mb-8">
            <LoadingSpinner />
            <p className="text-purple-200 mt-4 text-lg font-medium">
              🌙 Creating peaceful dreams just for you... ✨
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-400/20 backdrop-blur-sm border border-red-300/30 rounded-3xl p-6 mb-8">
            <div className="text-center">
              <span className="text-4xl mb-2 block">😔</span>
              <p className="text-red-200 font-semibold text-lg">{error}</p>
              <div className="mt-4 space-x-4">
                <button 
                  onClick={() => setError(null)}
                  className="bg-gradient-to-r from-indigo-400/80 to-purple-400/80 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all border border-white/20"
                >
                  Try Again
                </button>
                {!showTextInput && bedtimeState === 'personalizing' && (
                  <button 
                    onClick={toggleInputMode}
                    className="bg-gradient-to-r from-blue-400/80 to-cyan-400/80 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all border border-white/20"
                  >
                    Type Instead
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bedtime Content Display */}
        {currentResponse && bedtimeState === 'content_ready' && (
          <div className="space-y-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-4">🌟 Sweet Dreams Content 🌟</h2>
                <div className="bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded-2xl p-4 mb-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-indigo-200 mb-2">
                    {bedtimeContentTypes.find(c => c.id === selectedContentType)?.name}
                    {currentResponse.childName && ` for ${currentResponse.childName}`}
                  </h3>
                </div>
              </div>

              {/* Content Text */}
              <div className="bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl p-6 mb-6 max-h-64 overflow-y-auto border border-white/10">
                <p className="text-white/90 leading-relaxed text-lg whitespace-pre-line">{currentResponse.responseText}</p>
              </div>

              <AudioPlayer 
                title={`${bedtimeContentTypes.find(c => c.id === selectedContentType)?.name || 'Bedtime Content'}${currentResponse.childName ? ` for ${currentResponse.childName}` : ''}`}
                audioUrl={currentResponse.audioUrl}
              />
              
              <div className="text-center mt-6 space-x-4">
                <button 
                  onClick={startNewContent}
                  className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all border border-white/20"
                >
                  More Sweet Dreams 💤
                </button>
                <button 
                  onClick={backToWelcome}
                  className="bg-gradient-to-r from-indigo-500/80 to-blue-500/80 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all border border-white/20"
                >
                  Back to Dreamland 🌙
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gentle Sleep Tips */}
        {(bedtimeState === 'welcome' || bedtimeState === 'content_select') && (
          <div className="text-center mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-purple-200 text-sm mb-2">
                💤 Bedtime tip: Get comfortable, close your eyes, and let your imagination drift...
              </p>
              <div className="flex justify-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-300/60 fill-current animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
