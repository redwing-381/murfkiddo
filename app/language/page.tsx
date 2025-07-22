"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Globe, Volume2, Brain, Keyboard, BookOpen, MessageCircle } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"

interface LanguageResponse {
  success: boolean
  action: string
  targetLanguage: string
  responseText: string
  audioUrl: string
  learningMode: string
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

export default function LanguageBuddy() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [learningState, setLearningState] = useState<'language_select' | 'mode_select' | 'learning' | 'processing' | 'response_ready'>('language_select')
  const [currentResponse, setCurrentResponse] = useState<LanguageResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [selectedMode, setSelectedMode] = useState<string>("")
  const [listeningCountdown, setListeningCountdown] = useState(15)
  const [wordsLearned, setWordsLearned] = useState(0)
  const [conversationsCount, setConversationsCount] = useState(0)
  const [aiMessage, setAiMessage] = useState("¡Hola! Hello! Bonjour! I'm your friendly language buddy! 🌍 I can help you learn any language you want - let's pick one and start our adventure!")

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
            console.log("Language input:", finalTranscript)
            setTranscript(finalTranscript)
            stopListening()
            handleLanguageInput(finalTranscript)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          clearCountdown()
          
          if (event.error === 'not-allowed') {
            setError("I need microphone permission to hear you speak! 🎤 Please allow microphone access.")
            setShowTextInput(true)
          } else if (event.error === 'no-speech') {
            if (restartAttempts.current < 2) {
              restartAttempts.current++
              window.setTimeout(() => {
                if (learningState === 'learning') {
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
          
          if (learningState === 'learning' && restartAttempts.current < 3) {
            restartAttempts.current++
            window.setTimeout(() => {
              if (learningState === 'learning') {
                console.log("Restarting recognition, attempt:", restartAttempts.current)
                recognition.start()
              }
            }, 300)
          }
        }
        
        setRecognition(recognition)
      } else {
        setShowTextInput(true)
        setAiMessage("Hi! Your browser doesn't support voice, but you can type to learn languages with me! 💬")
      }
    }
  }, [learningState])

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
      handleLanguageInput(textInput.trim())
      setTextInput("")
    }
  }

  const selectLanguage = (language: string) => {
    setSelectedLanguage(language)
    setLearningState('mode_select')
    setAiMessage(`¡Excelente! Great choice! Let's learn ${language}! 🎉 What would you like to do - translate words, learn vocabulary, practice pronunciation, or have a simple conversation?`)
  }

  const selectMode = async (mode: string, action: string) => {
    setSelectedMode(mode)
    setLearningState('processing')
    setError(null)
    setAiMessage("Setting up your language lesson... 📚")
    clearCountdown()
    
    try {
      const response = await fetch('/api/learn-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          targetLanguage: selectedLanguage,
          learningMode: mode,
        }),
      })

      const data: LanguageResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setLearningState('response_ready')
        if (action === 'teach_words') {
          setWordsLearned(wordsLearned + 1)
        } else if (action === 'conversation_practice') {
          setConversationsCount(conversationsCount + 1)
        }
        setAiMessage("Your lesson is ready! 🌟 Listen and then try it yourself!")
      } else {
        setError(data.error || 'Failed to start lesson')
        setLearningState('mode_select')
        setAiMessage("Hmm, I had trouble with that lesson. Let's try a different activity! 🤔")
      }
    } catch (err) {
      setError('Something went wrong. Please try another lesson!')
      setLearningState('mode_select')
      setAiMessage("Oops! Something went wrong. What would you like to learn? 😊")
      console.error('Error:', err)
    }
  }

  const handleLanguageInput = async (userInput: string) => {
    console.log("Language input received:", userInput)
    setLearningState('processing')
    setAiMessage("Processing your input... 🤔")
    clearCountdown()
    
    let action = 'translate' // default
    if (selectedMode === 'conversation') {
      action = 'conversation_practice'
    } else if (selectedMode === 'pronunciation') {
      action = 'pronunciation_help'
    }
    
    try {
      const response = await fetch('/api/learn-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          targetLanguage: selectedLanguage,
          inputText: userInput,
          learningMode: selectedMode,
        }),
      })

      const data: LanguageResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setLearningState('response_ready')
        setAiMessage("Great job! 🌟 Listen to my response and keep practicing!")
      } else {
        setError(data.error || 'Failed to process your input')
        setLearningState('learning')
        setAiMessage("I didn't catch that. Can you try again? 🎤")
      }
    } catch (err) {
      setError('Something went wrong. Please try again!')
      setLearningState('learning')
      setAiMessage("Oops! Can you repeat that? 😊")
      console.error('Error:', err)
    }
  }

  const continueLesson = () => {
    setLearningState('learning')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setAiMessage(`Great work! Now ${selectedMode === 'conversation' ? 'continue our conversation' : selectedMode === 'pronunciation' ? 'try another word' : 'ask me to translate something else'}! I'm listening! 👂`)
  }

  const backToModes = () => {
    stopListening()
    setLearningState('mode_select')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setSelectedMode("")
    setShowTextInput(false)
    restartAttempts.current = 0
    setAiMessage(`What would you like to do next in ${selectedLanguage}? Pick another learning activity! 🎯`)
  }

  const backToLanguages = () => {
    stopListening()
    setLearningState('language_select')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setSelectedLanguage("")
    setSelectedMode("")
    setShowTextInput(false)
    restartAttempts.current = 0
    setAiMessage("Which language should we explore next? I love teaching new languages! 🌍")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Type what you want to learn! I'm excited to help! ⌨️")
    } else {
      setAiMessage("Press the microphone to speak! 🎤")
    }
  }

  const languages = [
    { code: "spanish", name: "Spanish", flag: "🇪🇸", color: "from-red-400 to-yellow-400" },
    { code: "french", name: "French", flag: "🇫🇷", color: "from-blue-400 to-red-400" },
    { code: "german", name: "German", flag: "🇩🇪", color: "from-red-400 to-yellow-300" },
    { code: "chinese", name: "Chinese", flag: "🇨🇳", color: "from-red-500 to-yellow-500" },
    { code: "italian", name: "Italian", flag: "🇮🇹", color: "from-green-400 to-red-400" },
    { code: "japanese", name: "Japanese", flag: "🇯🇵", color: "from-red-500 to-white" },
  ]

  const learningModes = [
    { 
      id: "translate", 
      name: "Translator", 
      icon: "🌍", 
      description: "Translate words and phrases!",
      action: "translate",
      color: "from-blue-400 to-cyan-400"
    },
    { 
      id: "vocabulary", 
      name: "Vocabulary", 
      icon: "📚", 
      description: "Learn new words and phrases!",
      action: "teach_words",
      color: "from-green-400 to-emerald-400"
    },
    { 
      id: "pronunciation", 
      name: "Pronunciation", 
      icon: "🗣️", 
      description: "Practice how to say words!",
      action: "pronunciation_help",
      color: "from-purple-400 to-pink-400"
    },
    { 
      id: "conversation", 
      name: "Chat Practice", 
      icon: "💬", 
      description: "Simple conversations!",
      action: "conversation_practice",
      color: "from-orange-400 to-red-400"
    },
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-orange-100 via-red-50 to-purple-100">
      <div className="max-w-4xl mx-auto">
        {/* Friendly Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-lg">
            <span className="text-6xl">🌍</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">Language Buddy!</h1>
          
          {/* Progress Display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto shadow-lg border-2 border-orange-200">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-orange-500" />
                <span className="font-bold text-purple-800">Words: {wordsLearned}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-6 h-6 text-red-500" />
                <span className="font-bold text-purple-800">Chats: {conversationsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Language Teacher Speech Bubble */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-3xl rounded-bl-lg p-6 max-w-2xl mx-auto shadow-lg">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">👨‍🏫</span>
              <span className="font-bold text-xl">Professor Polyglot</span>
            </div>
            <p className="text-lg leading-relaxed">{aiMessage}</p>
          </div>
        </div>

        {/* Language Selection */}
        {learningState === 'language_select' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-purple-800 text-center mb-6">
              <Globe className="inline w-8 h-8 mr-2 text-orange-600" />
              Choose Your Language Adventure!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => selectLanguage(language.code)}
                  className={`bg-gradient-to-r ${language.color} hover:shadow-xl transform hover:scale-105 text-white rounded-3xl p-6 transition-all duration-200 shadow-lg`}
                >
                  <div className="text-4xl mb-3">{language.flag}</div>
                  <h3 className="font-bold text-xl mb-2">{language.name}</h3>
                  <p className="text-sm opacity-90">¡Vamos a aprender!</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Learning Mode Selection */}
        {learningState === 'mode_select' && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-2">
                Learning {languages.find(l => l.code === selectedLanguage)?.name} {languages.find(l => l.code === selectedLanguage)?.flag}
              </h2>
              <p className="text-purple-600">What would you like to practice?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => selectMode(mode.id, mode.action)}
                  className={`bg-gradient-to-r ${mode.color} hover:shadow-xl transform hover:scale-105 text-white rounded-3xl p-6 transition-all duration-200 shadow-lg`}
                >
                  <div className="text-4xl mb-3">{mode.icon}</div>
                  <h3 className="font-bold text-xl mb-2">{mode.name}</h3>
                  <p className="text-sm opacity-90">{mode.description}</p>
                </button>
              ))}
            </div>
            <div className="text-center mt-6">
              <button 
                onClick={backToLanguages}
                className="text-purple-600 hover:text-purple-800 underline"
              >
                ← Choose Different Language
              </button>
            </div>
          </div>
        )}

        {/* Input Mode Toggle */}
        {learningState === 'learning' && (
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
        {learningState === 'learning' && !showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-orange-200">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 animate-pulse' 
                    : 'bg-gradient-to-r from-orange-400 to-red-400'
                }`}
              >
                {isListening ? <MicOff className="w-16 h-16" /> : <Mic className="w-16 h-16" />}
              </button>
              
              {isListening && (
                <div className="mb-4">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    🎤 Listening... {listeningCountdown}s
                  </div>
                  <div className="bg-orange-100 rounded-2xl p-3">
                    <p className="text-orange-700 font-medium">
                      {selectedMode === 'conversation' ? 'Say something in the language!' : 
                       selectedMode === 'pronunciation' ? 'Tell me a word to practice!' :
                       'What would you like to translate?'}
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-lg text-purple-700 font-medium mb-4">
                {isListening ? "🗣️ I'm listening!" : "👆 Press to start!"}
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
            </div>
          </div>
        )}

        {/* Text Input Section */}
        {learningState === 'learning' && showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-orange-200">
              <div className="flex items-center space-x-4 max-w-lg mx-auto">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder={
                    selectedMode === 'conversation' ? 'Say hello in the language!' :
                    selectedMode === 'pronunciation' ? 'Type a word to practice...' :
                    'What do you want to translate?'
                  }
                  className="flex-1 px-6 py-4 text-lg rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none"
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim()}
                  className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Brain className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {learningState === 'processing' && (
          <div className="text-center mb-8">
            <LoadingSpinner />
            <p className="text-purple-600 mt-4 text-lg font-medium">
              🌍 Preparing your language lesson... ✨
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
                  onClick={() => setError(null)}
                  className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                >
                  Keep Learning
                </button>
                {!showTextInput && learningState === 'learning' && (
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

        {/* Language Response Display */}
        {currentResponse && learningState === 'response_ready' && (
          <div className="space-y-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-orange-200">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-purple-800 mb-4">🌟 Your Language Lesson! 🌟</h2>
                <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">
                    {languages.find(l => l.code === selectedLanguage)?.name} {currentResponse.action === 'translate' ? 'Translation' : currentResponse.action === 'teach_words' ? 'Vocabulary' : currentResponse.action === 'pronunciation_help' ? 'Pronunciation' : 'Conversation'}
                  </h3>
                </div>
              </div>

              {/* Response Text */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 max-h-64 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{currentResponse.responseText}</p>
              </div>

              <AudioPlayer 
                title={`${languages.find(l => l.code === selectedLanguage)?.name} Lesson`}
                audioUrl={currentResponse.audioUrl}
              />
              
              <div className="text-center mt-6 space-x-4">
                <button 
                  onClick={continueLesson}
                  className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Continue Learning! 📚
                </button>
                <button 
                  onClick={backToModes}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  New Activity! 🎯
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
