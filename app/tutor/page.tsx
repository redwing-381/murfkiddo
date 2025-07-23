"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Brain, Lightbulb, Keyboard, Star, Heart } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"
import UserPreferencesManager from "@/lib/user-preferences"
import KidAchievements from "@/components/kid-achievements"

interface TutorResponse {
  success: boolean
  question: string
  explanation: string
  audioUrl: string
  subject: string
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

export default function TutorMode() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [conversationState, setConversationState] = useState<'greeting' | 'listening' | 'learning' | 'explanation_ready'>('greeting')
  const [currentResponse, setCurrentResponse] = useState<TutorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [listeningCountdown, setListeningCountdown] = useState(20) // Longer for kids
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [aiMessage, setAiMessage] = useState("Hi there, super smart friend! 🧠✨ I'm your learning buddy! Ask me ANYTHING you want to know - about science, animals, space, math, or anything that makes you curious! What amazing question do you have for me?")

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
               handleQuestion(finalTranscript.trim())
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
            setAiMessage("I didn't hear anything! Let's try again! Press the big microphone and speak clearly! 📢✨")
                         setTimeout(() => {
               if (!isListening) {
                 startListening()
               }
             }, 1000)
          } else {
            setError("I'm having trouble hearing you! Try using the typing option instead! 😊")
            setAiMessage("No problem! Click 'Switch to Typing' and type your question instead! ⌨️🌟")
          }
        } else {
          setError(`Having trouble with voice recognition. Let's try typing instead! 😊`)
          setAiMessage("Let's try typing your question instead! Click the typing button! 💻✨")
        }
        
        setIsListening(false)
        setConversationState('greeting')
        clearCountdown()
      }

      recognition.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
        clearCountdown()
        
        // If we got a transcript, process it
        if (transcript.trim()) {
          handleQuestion(transcript.trim())
        }
      }

      setRecognition(recognition)
    }

    return () => {
      clearCountdown()
      clearTimeout(listeningTimeoutRef.current)
    }
  }, [transcript])

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
      setAiMessage("I'm listening carefully! Ask me your amazing question! 🎧✨")
      restartAttempts.current = 0
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      clearCountdown()
      clearTimeout(listeningTimeoutRef.current)
      setConversationState('greeting')
      setAiMessage("Ready for your next awesome question! 🌟")
    }
  }

  const handleTextInput = () => {
    if (textInput.trim()) {
      handleQuestion(textInput.trim())
      setTextInput("")
    }
  }

  const handleTopicQuestion = (topic: string, question: string) => {
    setSelectedSubject(topic)
    handleQuestion(question)
  }

  const handleQuestion = async (question: string) => {
    console.log("Question received:", question)
    setConversationState('learning')
    setAiMessage("WOW! What a fantastic question! 🤩 Let me think about the BEST way to explain this to you... My brain is working super hard! 🧠💫")
    clearCountdown()
    
    try {
      const response = await fetch('/api/ask-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          subject: selectedSubject,
        }),
      })

      const data: TutorResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setConversationState('explanation_ready')
        setQuestionsAnswered(prev => prev + 1)
        setAiMessage("🎉 I'VE GOT AN AMAZING ANSWER FOR YOU! 🎉 Press the play button to hear my explanation, or ask me another super cool question! 🌟")
        
        // Track usage - estimate 5 minutes per educational interaction  
        UserPreferencesManager.trackUsage('Tutor Mode', 5)
      } else {
        setError(data.error || 'Hmm, I had trouble with that question, but that\'s okay!')
        setConversationState('greeting')
        setAiMessage("Oops! I had a little trouble with that question. Can you try asking it in a different way? I'm super excited to help you learn! 😊🌈")
      }
    } catch (err) {
      setError('Something went wrong, but let\'s try again!')
      setConversationState('greeting')
      setAiMessage("No worries! Sometimes things get a little mixed up. What other amazing things would you like to learn about? 🌟")
      console.error('Error:', err)
    }
  }

  const resetConversation = () => {
    stopListening()
    setConversationState('greeting')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setSelectedSubject("")
    setShowTextInput(false)
    restartAttempts.current = 0
    setAiMessage("What other incredible things would you like to learn about today? I LOVE answering questions and teaching awesome kids like you! 🎓✨")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Perfect! Type your amazing question here! I can't wait to teach you something super cool! ⌨️🌟")
    } else {
      setAiMessage("Great! Press the BIG microphone button and ask me your question out loud! 🎤✨")
    }
  }

  const learningTopics = [
    { emoji: "🔬", topic: "Science", questions: ["Why is the sky blue?", "How do plants grow?", "What are atoms?"] },
    { emoji: "🔢", topic: "Math", questions: ["What is multiplication?", "How do fractions work?", "What are prime numbers?"] },
    { emoji: "🐘", topic: "Animals", questions: ["How do elephants communicate?", "Why do cats purr?", "How do birds fly?"] },
    { emoji: "🌌", topic: "Space", questions: ["What are black holes?", "Why do planets orbit the sun?", "How big is the universe?"] },
    { emoji: "🌍", topic: "Geography", questions: ["How are mountains formed?", "Why do we have seasons?", "What causes rain?"] },
    { emoji: "🏛️", topic: "History", questions: ["Who built the pyramids?", "What were dinosaurs like?", "How did people live long ago?"] },
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <div className="max-w-5xl mx-auto">
        {/* Super Friendly Header */}
        <div className="text-center mb-12">
          <div className="w-40 h-40 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 float-animation shadow-2xl">
            <span className="text-8xl">🧠</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-purple-800 mb-6 rainbow-text">
            Learning Time! 🎓
          </h1>
        </div>

        {/* Kid Achievements System */}
        <div className="mb-12">
          <KidAchievements 
            mode="Tutor Mode"
            currentStats={{
              questionsAsked: questionsAnswered
            }}
          />
        </div>

        {/* AI Learning Buddy Speech Bubble */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-3xl rounded-bl-lg p-8 max-w-4xl mx-auto shadow-2xl border-4 border-white/30">
            <div className="flex items-center mb-6">
              <span className="text-6xl mr-6 bounce-animation">🎓</span>
              <span className="font-black text-3xl">Professor MurfKiddo</span>
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
        {conversationState !== 'explanation_ready' && (
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
        {conversationState !== 'explanation_ready' && !showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              {/* Giant Microphone Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={conversationState === 'learning'}
                className={`kid-mic-button mx-auto mb-8 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 pulse-animation' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-400 wiggle-animation'
                }`}
              >
                {isListening ? <MicOff className="w-24 h-24" /> : <Mic className="w-24 h-24" />}
              </button>

              {/* Listening Status - Kid Friendly */}
              {isListening && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-green-200 to-blue-200 rounded-3xl p-6 shadow-lg">
                    <p className="text-2xl font-black text-green-800 mb-4">
                      🎧 I'm Listening Super Carefully! ({listeningCountdown}s)
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
                    🗣️ Your Question:
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    "{transcript || interimTranscript}"
                  </p>
                </div>
              )}
              
              <p className="text-xl text-purple-600 font-bold">
                💡 Try asking: "Why is the sky blue?" or "How do airplanes fly?"
              </p>
            </div>
          </div>
        )}

        {/* Text Input Section - Much Bigger */}
        {conversationState !== 'explanation_ready' && showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              <div className="flex flex-col space-y-6">
              <input
                type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="Ask me anything you want to learn about..."
                  className="kid-input"
                  disabled={conversationState === 'learning'}
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim() || conversationState === 'learning'}
                  className="kid-button mx-auto"
                >
                  <Brain className="w-8 h-8 mr-4" />
                  Teach Me! 🌟
                </button>
              </div>
              <p className="text-xl text-purple-600 font-bold mt-6">
                💡 Try: "How do magnets work?" or "Why do we need to sleep?"
              </p>
            </div>
          </div>
        )}

        {/* Loading State - Fun for Kids */}
        {conversationState === 'learning' && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-2xl mx-auto">
              <div className="text-8xl mb-6 kid-loading">🧠</div>
              <p className="text-3xl font-black text-purple-600 mb-4">
                ✨ Finding the Perfect Answer! ✨
              </p>
              <p className="text-xl font-bold text-purple-500">
                🔍 Searching my brain... 💫 Making it super easy to understand... 🎉 Almost ready!
              </p>
              <LoadingSpinner />
            </div>
          </div>
        )}

        {/* Explanation Ready - Celebration */}
        {conversationState === 'explanation_ready' && currentResponse && (
          <div className="space-y-8">
            {/* Celebration Header */}
            <div className="text-center">
              <div className="kid-success max-w-3xl mx-auto">
                <div className="text-6xl mb-4 bounce-animation">🌟</div>
                <h2 className="text-4xl font-black text-green-800 mb-4">
                  I'VE GOT YOUR ANSWER! 
                </h2>
                <p className="text-2xl font-bold text-green-700">
                  This is going to be so cool to learn! 🎓
                </p>
              </div>
            </div>

            {/* Audio Player */}
            <div className="max-w-4xl mx-auto">
              <AudioPlayer 
                audioUrl={currentResponse.audioUrl} 
                title={`Learning about: ${currentResponse.subject}`}
                autoPlay={true}
              />
            </div>

            {/* Explanation Text Display */}
            <div className="kid-message-box max-w-4xl mx-auto">
              <h3 className="text-3xl font-black text-purple-800 mb-6">🧠 {currentResponse.subject}</h3>
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4 mb-6">
                <p className="text-green-700 italic text-xl">"{currentResponse.question}"</p>
              </div>
              <div className="text-xl leading-relaxed text-purple-700 font-semibold">
                {currentResponse.explanation}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-6">
              <button
                onClick={resetConversation}
                className="kid-button"
              >
                <Star className="w-8 h-8 mr-4" />
                Ask Another Question! 🤔
              </button>
            </div>
          </div>
        )}

        {/* Learning Topics */}
        {conversationState !== 'explanation_ready' && (
          <div className="mb-8">
            <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
              <Lightbulb className="inline w-10 h-10 mr-3 text-yellow-500 bounce-animation" />
              Quick Learning Topics! 🌟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningTopics.map((topic, index) => (
                <div key={index} className="bg-white/90 rounded-3xl p-6 shadow-lg border-4 border-purple-200 hover:border-purple-400 transform hover:scale-105 transition-all">
                  <div className="text-center">
                    <div className="text-5xl mb-4 bounce-animation">{topic.emoji}</div>
                    <h3 className="font-black text-2xl text-purple-800 mb-4">{topic.topic}</h3>
                    <div className="space-y-2">
                      {topic.questions.slice(0, 2).map((question, qIndex) => (
            <button
                          key={qIndex}
                          onClick={() => handleTopicQuestion(topic.topic, question)}
                          className="text-lg text-purple-600 hover:text-white hover:bg-purple-500 px-4 py-2 rounded-full transition-all block w-full font-bold"
                        >
                          {question}
            </button>
          ))}
        </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
