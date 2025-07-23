"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Volume2, Keyboard, Star, Heart } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"
import UserPreferencesManager from "@/lib/user-preferences"
import KidAchievements from "@/components/kid-achievements"

interface StoryResponse {
  success: boolean
  storyText: string
  audioUrl: string
  title: string
  error?: string
}

export default function StoryMode() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [conversationState, setConversationState] = useState<'greeting' | 'listening' | 'generating' | 'story_ready'>('greeting')
  const [storyData, setStoryData] = useState<StoryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [listeningCountdown, setListeningCountdown] = useState(20) // Longer for kids
  const [storiesCreated, setStoriesCreated] = useState(0)
  const [aiMessage, setAiMessage] = useState("Hi awesome friend! 🌟 I'm your story magic maker! Tell me what you want your story to be about - maybe dragons, princesses, space adventures, or anything you love! What sounds super fun to you?")
  
  const listeningTimeoutRef = useRef<number | undefined>(undefined)
  const countdownRef = useRef<number | undefined>(undefined)
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
        startCountdown()
      }

      recognition.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          console.log("Final transcript:", finalTranscript)
          setTranscript(finalTranscript)
          setInterimTranscript("")
          handleVoiceInput(finalTranscript)
        } else {
          setInterimTranscript(interimTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        
        if (event.error === 'no-speech' && restartAttempts.current < 3) {
          console.log("No speech detected, auto-restarting...")
          restartAttempts.current++
          clearTimeouts()
          setTimeout(() => {
            if (conversationState === 'listening') {
              try {
                recognition.start()
                setAiMessage("I'm still listening! Take your time and tell me about your story idea! 🎤✨")
              } catch (err) {
                console.error("Failed to restart recognition:", err)
              }
            }
          }, 1000)
        } else {
          setError("No worries! Let's try a different way to tell me your story idea! 😊")
          setShowTextInput(true)
          setIsListening(false)
          clearTimeouts()
        }
      }

      recognition.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
        clearTimeouts()
        
        if (conversationState === 'listening' && restartAttempts.current < 3) {
          restartAttempts.current++
    setTimeout(() => {
            if (conversationState === 'listening') {
              console.log("Auto-restarting recognition, attempt:", restartAttempts.current)
              try {
                recognition.start()
              } catch (err) {
                console.error("Failed to restart recognition:", err)
              }
            }
          }, 500)
        }
      }

      setRecognition(recognition)
    } else {
      setShowTextInput(true)
      setAiMessage("Hi! Let's type your story idea instead! What would you like your story to be about? ⌨️🌟")
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
    setListeningCountdown(20) // 20 seconds for kids
    
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
      setAiMessage("I'm listening super carefully! 👂✨ Tell me what your story should be about - dragons? princesses? adventures? Anything you want!")
      restartAttempts.current = 0
      
      try {
        recognition.start()
      } catch (error) {
        console.error("Failed to start recognition:", error)
        setError("Let's try typing your story idea instead! 💕")
        setShowTextInput(true)
      }
    } else {
      setShowTextInput(true)
      setError("Let's type your amazing story idea! ✨")
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
    setAiMessage("WOW! That sounds AMAZING! ✨🎭 I'm creating the most awesome story for you right now... This is going to be SO good!")
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
        setStoriesCreated(prev => prev + 1)
        setAiMessage("🎉 YOUR STORY IS READY! 🎉 I made it extra special just for you! Press the big play button to hear it, or tell me about another story you want! 🌟")
        
        // Track usage - estimate 8 minutes for a story session
        UserPreferencesManager.trackUsage('Story Mode', 8)
      } else {
        setError(data.error || 'Oops! Something went wrong, but that\'s okay!')
        setConversationState('greeting')
        setAiMessage("Hmm, that didn't work, but don't worry! 😊 Can you tell me about a different story idea? Maybe something with animals or adventures?")
      }
    } catch (err) {
      setError('Something went wrong, but let\'s try again!')
      setConversationState('greeting')
      setAiMessage("Oops! Let's try again! What other awesome story would you like me to create? 🌈")
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
    setAiMessage("What other AMAZING story would you like me to create for you? I love making new stories! 🎪✨")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Type your super cool story idea here! What should the story be about? ⌨️🌟")
    } else {
      setAiMessage("Press the big microphone to tell me your story idea! 🎤✨")
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <div className="max-w-5xl mx-auto">
        {/* Super Friendly Header */}
        <div className="text-center mb-12">
          <div className="w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-8 float-animation shadow-2xl">
            <span className="text-8xl">🎭</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-purple-800 mb-6 rainbow-text">
            Story Magic Time! ✨
          </h1>
        </div>

        {/* Kid Achievements System */}
        <div className="mb-12">
          <KidAchievements 
            mode="Story Mode"
            currentStats={{
              storiesCreated: storiesCreated
            }}
              />
            </div>

        {/* AI Story Friend Speech Bubble */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-3xl rounded-bl-lg p-8 max-w-4xl mx-auto shadow-2xl border-4 border-white/30">
            <div className="flex items-center mb-6">
              <span className="text-6xl mr-6 bounce-animation">🤖</span>
              <span className="font-black text-3xl">Your Story Friend</span>
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

        {/* Input Mode Toggle - Bigger and Friendlier */}
        {conversationState !== 'story_ready' && (
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
        {conversationState !== 'story_ready' && !showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              {/* Giant Microphone Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={conversationState === 'generating'}
                className={`kid-mic-button mx-auto mb-8 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 pulse-animation' 
                    : 'bg-gradient-to-r from-blue-400 to-cyan-400 wiggle-animation'
                }`}
              >
                {isListening ? <MicOff className="w-24 h-24" /> : <Mic className="w-24 h-24" />}
              </button>

              {/* Listening Status - Kid Friendly */}
              {isListening && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-green-200 to-blue-200 rounded-3xl p-6 shadow-lg">
                    <p className="text-2xl font-black text-green-800 mb-4">
                      🎧 I'm Listening! ({listeningCountdown}s)
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
                    🗣️ You said:
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    "{transcript || interimTranscript}"
                  </p>
              </div>
              )}

              <p className="text-xl text-purple-600 font-bold">
                💡 Ideas: Dragons, princesses, space, animals, magic, adventures!
              </p>
            </div>
          </div>
        )}

        {/* Text Input Section - Much Bigger */}
        {conversationState !== 'story_ready' && showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              <div className="flex flex-col space-y-6">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="Tell me what your story should be about..."
                  className="kid-input"
                  disabled={conversationState === 'generating'}
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim() || conversationState === 'generating'}
                  className="kid-button mx-auto"
                >
                  <Heart className="w-8 h-8 mr-4" />
                  Create My Story! ✨
                </button>
              </div>
              <p className="text-xl text-purple-600 font-bold mt-6">
                💡 Try: "A dragon who loves ice cream" or "A princess in space!"
              </p>
            </div>
          </div>
        )}

        {/* Loading State - Fun for Kids */}
        {conversationState === 'generating' && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-2xl mx-auto">
              <div className="text-8xl mb-6 kid-loading">🎭</div>
              <p className="text-3xl font-black text-purple-600 mb-4">
                ✨ Creating Your Amazing Story! ✨
              </p>
              <p className="text-xl font-bold text-purple-500">
                🎪 Adding magic... 🌟 Making it super fun... 🎉 Almost ready!
              </p>
              <LoadingSpinner />
            </div>
          </div>
        )}

        {/* Story Ready - Celebration */}
        {conversationState === 'story_ready' && storyData && (
          <div className="space-y-8">
            {/* Celebration Header */}
            <div className="text-center">
              <div className="kid-success max-w-3xl mx-auto">
                <div className="text-6xl mb-4 bounce-animation">🎉</div>
                <h2 className="text-4xl font-black text-green-800 mb-4">
                  YOUR STORY IS READY! 
                </h2>
                <p className="text-2xl font-bold text-green-700">
                  I made it extra special just for you! 🌟
                </p>
              </div>
            </div>

            {/* Audio Player */}
            <div className="max-w-4xl mx-auto">
              <AudioPlayer 
                audioUrl={storyData.audioUrl} 
                title={storyData.title} 
                autoPlay={true}
              />
            </div>

            {/* Story Text Display */}
            <div className="kid-message-box max-w-4xl mx-auto">
              <h3 className="text-3xl font-black text-purple-800 mb-6">📖 {storyData.title}</h3>
              <div className="text-xl leading-relaxed text-purple-700 font-semibold">
                {storyData.storyText}
              </div>
                </div>

            {/* Action Buttons */}
            <div className="text-center space-y-6">
              <button
                onClick={resetConversation}
                className="kid-button"
              >
                <Star className="w-8 h-8 mr-4" />
                Make Another Story! 🎭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

