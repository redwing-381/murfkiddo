"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Volume2, Keyboard } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"

interface StoryResponse {
  success: boolean
  storyText: string
  audioUrl: string
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

export default function StoryMode() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [conversationState, setConversationState] = useState<'greeting' | 'listening' | 'generating' | 'story_ready'>('greeting')
  const [storyData, setStoryData] = useState<StoryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [listeningCountdown, setListeningCountdown] = useState(10)
  const [aiMessage, setAiMessage] = useState("Hi there! I'm your storytelling friend! 🎭 What would you like me to tell you a story about today?")
  
  const listeningTimeoutRef = useRef<number | undefined>(undefined)
  const countdownRef = useRef<number | undefined>(undefined)
  const restartAttempts = useRef(0)

  useEffect(() => {
    // Initialize speech recognition with better settings
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true // Keep listening
        recognition.interimResults = true // Show what's being said in real-time
        
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
          
          if (finalTranscript && finalTranscript.length > 3) {
            console.log("Final transcript:", finalTranscript)
            setTranscript(finalTranscript)
            stopListening()
            handleVoiceInput(finalTranscript)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          clearTimeouts()
          
          if (event.error === 'not-allowed') {
            setError("I need microphone permission! 🎤 Please allow microphone access in your browser and try again.")
            setShowTextInput(true)
          } else if (event.error === 'no-speech') {
            // Don't show error for no-speech, just restart listening
            if (restartAttempts.current < 2) {
              restartAttempts.current++
              window.setTimeout(() => {
                if (conversationState === 'listening') {
                  startListening()
                }
              }, 500)
            } else {
              setError("I'm having trouble hearing you. Try speaking a bit louder, or use the typing option! 📢")
              setShowTextInput(true)
            }
          } else if (event.error === 'aborted') {
            // Normal stop, don't show error
          } else {
            setError("Voice recognition isn't working well. Let's try typing instead! ⌨️")
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
          clearTimeouts()
          
          // If we're still in listening state but recognition ended unexpectedly, restart
          if (conversationState === 'listening' && restartAttempts.current < 3) {
            restartAttempts.current++
            window.setTimeout(() => {
              if (conversationState === 'listening') {
                console.log("Restarting recognition, attempt:", restartAttempts.current)
                recognition.start()
              }
            }, 300)
          }
        }
        
        setRecognition(recognition)
      } else {
        // No speech recognition support
        setShowTextInput(true)
        setAiMessage("Hi! Your browser doesn't support voice, but you can type to me! 💬 What story would you like?")
      }
    }
  }, [conversationState])

  const clearTimeouts = () => {
    if (listeningTimeoutRef.current) {
      window.clearTimeout(listeningTimeoutRef.current)
      listeningTimeoutRef.current = undefined
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current)
      countdownRef.current = undefined
    }
  }

  const startCountdown = () => {
    setListeningCountdown(15) // Give kids 15 seconds
    
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
      setConversationState('listening')
      setAiMessage("I'm listening! 👂 Tell me what story you'd like... Take your time!")
      restartAttempts.current = 0
      
      try {
        recognition.start()
      } catch (error) {
        console.error("Failed to start recognition:", error)
        setError("Couldn't start voice recognition. Let's try typing instead! ⌨️")
        setShowTextInput(true)
      }
    } else {
      setShowTextInput(true)
      setError("Voice not available - but you can type! 💬")
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
    }
    setIsListening(false)
    clearTimeouts()
  }

  const handleTextInput = () => {
    if (textInput.trim()) {
      handleVoiceInput(textInput.trim())
      setTextInput("")
    }
  }

  const handleVoiceInput = async (input: string) => {
    console.log("Input received:", input)
    setConversationState('generating')
    setAiMessage("Ooh, that sounds amazing! Let me create a magical story for you... ✨")
    clearTimeouts()
    
    // Determine voice type based on content or randomly for variety
    const voiceTypes = ['playful', 'calm', 'dramatic']
    const voiceType = voiceTypes[Math.floor(Math.random() * voiceTypes.length)]
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: input,
          voiceType: voiceType,
        }),
      })

      const data: StoryResponse = await response.json()

      if (data.success) {
        setStoryData(data)
        setConversationState('story_ready')
        setAiMessage("Your story is ready! 🌟 Press the play button to hear it, or ask me for another story!")
      } else {
        setError(data.error || 'Failed to generate story')
        setConversationState('greeting')
        setAiMessage("Hmm, something went wrong. Can you tell me about a different story idea? 🤔")
      }
    } catch (err) {
      setError('Something went wrong. Please try again!')
      setConversationState('greeting')
      setAiMessage("Oops! Something went wrong. What other story would you like to hear? 😊")
      console.error('Error:', err)
    }
  }

  const resetConversation = () => {
    stopListening()
    setConversationState('greeting')
    setStoryData(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setShowTextInput(false)
    restartAttempts.current = 0
    setAiMessage("What other amazing story would you like me to tell you? 🎪")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("You can type your story idea here! What would you like the story to be about? ⌨️")
    } else {
      setAiMessage("Press the microphone to tell me your story idea! 🎤")
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <div className="max-w-4xl mx-auto">
        {/* Friendly Header with Character */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-lg">
            <span className="text-6xl">🎭</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">Your Storytelling Friend!</h1>
        </div>

        {/* AI Character Speech Bubble */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-3xl rounded-bl-lg p-6 max-w-2xl mx-auto shadow-lg">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">🤖</span>
              <span className="font-bold text-xl">Story Friend</span>
            </div>
            <p className="text-lg leading-relaxed">{aiMessage}</p>
          </div>
        </div>

        {/* Input Mode Toggle */}
        {conversationState !== 'story_ready' && (
          <div className="text-center mb-4">
            <button
              onClick={toggleInputMode}
              className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all flex items-center space-x-2 mx-auto"
            >
              {showTextInput ? <Mic className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
              <span>{showTextInput ? "Switch to Voice" : "Switch to Typing"}</span>
            </button>
          </div>
        )}

        {/* Voice Input Section */}
        {conversationState !== 'story_ready' && !showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
              {/* Big Microphone Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={conversationState === 'generating'}
                className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 animate-pulse' 
                    : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                }`}
              >
                {isListening ? <MicOff className="w-16 h-16" /> : <Mic className="w-16 h-16" />}
              </button>
              
              {isListening && (
                <div className="mb-4">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    🎤 Listening... {listeningCountdown}s
                  </div>
                  <div className="bg-red-100 rounded-2xl p-3">
                    <p className="text-red-700 font-medium">Speak now! I'm listening for {listeningCountdown} more seconds...</p>
                  </div>
                </div>
              )}
              
              <p className="text-lg text-purple-700 font-medium mb-4">
                {isListening ? "🗣️ Say your story idea now!" : "👆 Press the microphone and speak clearly!"}
              </p>
              
              {interimTranscript && (
                <div className="bg-yellow-50 rounded-2xl p-4 mb-4">
                  <p className="text-yellow-800">
                    <span className="font-bold">I'm hearing:</span> "{interimTranscript}..."
                  </p>
                </div>
              )}
              
              {transcript && (
                <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                  <p className="text-blue-800">
                    <span className="font-bold">You said:</span> "{transcript}"
                  </p>
                </div>
              )}
              
              <p className="text-sm text-purple-600">
                💡 Try saying: "a dragon who loves pizza" or "space adventure with aliens"
              </p>
              <p className="text-xs text-gray-500 mt-2">
                🔊 Make sure your microphone is working and speak clearly!
              </p>
            </div>
          </div>
        )}

        {/* Text Input Section */}
        {conversationState !== 'story_ready' && showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
              <div className="flex items-center space-x-4 max-w-lg mx-auto">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="Type your story idea here... e.g., magical robot"
                  className="flex-1 px-6 py-4 text-lg rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none"
                  disabled={conversationState === 'generating'}
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim() || conversationState === 'generating'}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ✨ Create Story!
                </button>
              </div>
              <p className="text-sm text-purple-600 mt-4">
                💡 Try: "a unicorn who loves cookies" or "underwater adventure"
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {conversationState === 'generating' && (
          <div className="text-center mb-8">
            <LoadingSpinner />
            <p className="text-purple-600 mt-4 text-lg font-medium">
              ✨ Creating your magical story... This might take a moment! ✨
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border-2 border-red-300 rounded-3xl p-6 mb-8">
            <div className="text-center">
              <span className="text-4xl mb-2 block">😔</span>
              <p className="text-red-700 font-semibold text-lg">{error}</p>
              <div className="mt-4 space-x-4">
                <button 
                  onClick={resetConversation}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                >
                  Try Again
                </button>
                {!showTextInput && (
                  <button 
                    onClick={toggleInputMode}
                    className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                  >
                    Type Instead
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Story Player */}
        {storyData && conversationState === 'story_ready' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-purple-800 mb-4">🌟 Your Story is Ready! 🌟</h2>
                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-4 mb-6">
                  <h3 className="text-xl font-semibold text-blue-800">{storyData.title}</h3>
                </div>
              </div>

              {/* Story Text Preview */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6 max-h-48 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed text-lg">{storyData.storyText}</p>
              </div>

              <AudioPlayer 
                title={storyData.title}
                audioUrl={storyData.audioUrl}
              />
              
              {/* Ask for Another Story */}
              <div className="text-center mt-6">
                <button 
                  onClick={resetConversation}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Tell Me Another Story! 🎪
                </button>
              </div>
            </div>

            {/* Story Illustrations */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["🏰", "🐉", "🌟", "⭐"].map((emoji, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border-2 border-yellow-200 hover:scale-105 transition-transform"
                >
                  <div className="text-4xl mb-2">{emoji}</div>
                  <p className="text-sm text-purple-600 font-medium">Scene {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

