"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Send, Brain, Lightbulb, Keyboard } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"

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
  const [listeningCountdown, setListeningCountdown] = useState(15)
  const [aiMessage, setAiMessage] = useState("Hi there! I'm your learning buddy! 🧠 Ask me anything you want to learn about - science, math, animals, space, or anything else!")

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
          
          if (finalTranscript && finalTranscript.length > 3) {
            console.log("Final question:", finalTranscript)
            setTranscript(finalTranscript)
            stopListening()
            handleQuestion(finalTranscript)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          clearCountdown()
          
          if (event.error === 'not-allowed') {
            setError("I need microphone permission to hear your questions! 🎤 Please allow microphone access.")
            setShowTextInput(true)
          } else if (event.error === 'no-speech') {
            if (restartAttempts.current < 2) {
              restartAttempts.current++
              window.setTimeout(() => {
                if (conversationState === 'listening') {
                  startListening()
                }
              }, 500)
            } else {
              setError("I'm having trouble hearing you. Try speaking louder, or use typing! 📢")
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
          clearCountdown()
          
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
        setShowTextInput(true)
        setAiMessage("Hi! Your browser doesn't support voice, but you can type questions to me! 💬")
      }
    }
  }, [conversationState])

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
      setConversationState('listening')
      setAiMessage("I'm listening! 👂 Ask me any question you're curious about!")
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
    clearCountdown()
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
    setAiMessage("Great question! Let me think about the best way to explain this to you... 🤔✨")
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
        setAiMessage("I've got a great explanation for you! 🌟 Press play to hear it, or ask me another question!")
      } else {
        setError(data.error || 'Failed to generate explanation')
        setConversationState('greeting')
        setAiMessage("Hmm, I had trouble with that question. Can you try asking it differently? 🤔")
      }
    } catch (err) {
      setError('Something went wrong. Please try asking again!')
      setConversationState('greeting')
      setAiMessage("Oops! Something went wrong. What else would you like to learn about? 😊")
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
    setAiMessage("What else would you like to learn about today? I love answering questions! 🎓")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Type your question here! I'm excited to teach you something new! ⌨️")
    } else {
      setAiMessage("Press the microphone to ask me anything! 🎤")
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
      <div className="max-w-4xl mx-auto">
        {/* Friendly Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-lg">
            <span className="text-6xl">🧠</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">Your Learning Buddy!</h1>
        </div>

        {/* AI Tutor Speech Bubble */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-3xl rounded-bl-lg p-6 max-w-2xl mx-auto shadow-lg">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">🎓</span>
              <span className="font-bold text-xl">Professor MurfKiddo</span>
            </div>
            <p className="text-lg leading-relaxed">{aiMessage}</p>
          </div>
        </div>

        {/* Input Mode Toggle */}
        {conversationState !== 'explanation_ready' && (
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
        {conversationState !== 'explanation_ready' && !showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={conversationState === 'learning'}
                className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 animate-pulse' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-400'
                }`}
              >
                {isListening ? <MicOff className="w-16 h-16" /> : <Mic className="w-16 h-16" />}
              </button>
              
              {isListening && (
                <div className="mb-4">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    🎤 Listening... {listeningCountdown}s
                  </div>
                  <div className="bg-green-100 rounded-2xl p-3">
                    <p className="text-green-700 font-medium">Ask your question now! I'm listening for {listeningCountdown} more seconds...</p>
                  </div>
                </div>
              )}
              
              <p className="text-lg text-purple-700 font-medium mb-4">
                {isListening ? "🗣️ Ask me anything!" : "👆 Press to ask a question!"}
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
                    <span className="font-bold">Your question:</span> "{transcript}"
                  </p>
                </div>
              )}
              
              <p className="text-sm text-purple-600">
                💡 Try asking: "Why is the sky blue?" or "How do airplanes fly?"
              </p>
            </div>
          </div>
        )}

        {/* Text Input Section */}
        {conversationState !== 'explanation_ready' && showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200">
              <div className="flex items-center space-x-4 max-w-lg mx-auto">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="Ask me anything you want to learn about..."
                  className="flex-1 px-6 py-4 text-lg rounded-2xl border-2 border-green-200 focus:border-green-400 focus:outline-none"
                  disabled={conversationState === 'learning'}
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim() || conversationState === 'learning'}
                  className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Brain className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-purple-600 mt-4">
                💡 Try: "How do magnets work?" or "Why do we need to sleep?"
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {conversationState === 'learning' && (
          <div className="text-center mb-8">
            <LoadingSpinner />
            <p className="text-purple-600 mt-4 text-lg font-medium">
              🧠 Let me think about the best way to explain this... ✨
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
                  className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
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

        {/* Explanation Display */}
        {currentResponse && conversationState === 'explanation_ready' && (
          <div className="space-y-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-blue-200">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-purple-800 mb-4">🌟 Here's Your Answer! 🌟</h2>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">{currentResponse.subject}</h3>
                  <p className="text-green-700 italic">"{currentResponse.question}"</p>
                </div>
              </div>

              {/* Explanation Text */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 max-h-48 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed text-lg">{currentResponse.explanation}</p>
              </div>

              <AudioPlayer 
                title={`Learning about: ${currentResponse.subject}`}
                audioUrl={currentResponse.audioUrl}
              />
              
              <div className="text-center mt-6">
                <button 
                  onClick={resetConversation}
                  className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Ask Another Question! 🤔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Learning Topics */}
        {conversationState !== 'explanation_ready' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-purple-800 text-center mb-6">
              <Lightbulb className="inline w-8 h-8 mr-2 text-yellow-500" />
              Quick Learning Topics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {learningTopics.map((topic, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{topic.emoji}</div>
                    <h3 className="font-bold text-purple-800 mb-3">{topic.topic}</h3>
                    <div className="space-y-1">
                      {topic.questions.slice(0, 2).map((question, qIndex) => (
                        <button
                          key={qIndex}
                          onClick={() => handleTopicQuestion(topic.topic, question)}
                          className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-100 px-2 py-1 rounded-full transition-all block w-full"
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
