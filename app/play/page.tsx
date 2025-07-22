"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Trophy, Star, Gamepad2, Brain, Keyboard, RefreshCw } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"

interface GameResponse {
  success: boolean
  gameType: string
  responseText: string
  audioUrl: string
  action: string
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

export default function PlayMode() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'processing' | 'response_ready'>('menu')
  const [currentResponse, setCurrentResponse] = useState<GameResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [selectedGameType, setSelectedGameType] = useState<string>("")
  const [listeningCountdown, setListeningCountdown] = useState(15)
  const [score, setScore] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [currentGameContext, setCurrentGameContext] = useState("")
  const [aiMessage, setAiMessage] = useState("Hey there! I'm your game buddy! 🎮 Pick a fun game to play together - I love riddles, word games, and trivia!")

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
            console.log("Game response:", finalTranscript)
            setTranscript(finalTranscript)
            stopListening()
            handleGameResponse(finalTranscript)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          clearCountdown()
          
          if (event.error === 'not-allowed') {
            setError("I need microphone permission to play voice games! 🎤 Please allow microphone access.")
            setShowTextInput(true)
          } else if (event.error === 'no-speech') {
            if (restartAttempts.current < 2) {
              restartAttempts.current++
              window.setTimeout(() => {
                if (gameState === 'playing') {
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
          
          if (gameState === 'playing' && restartAttempts.current < 3) {
            restartAttempts.current++
            window.setTimeout(() => {
              if (gameState === 'playing') {
                console.log("Restarting recognition, attempt:", restartAttempts.current)
                recognition.start()
              }
            }, 300)
          }
        }
        
        setRecognition(recognition)
      } else {
        setShowTextInput(true)
        setAiMessage("Hi! Your browser doesn't support voice, but you can type to play games with me! 💬")
      }
    }
  }, [gameState])

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
      handleGameResponse(textInput.trim())
      setTextInput("")
    }
  }

  const startNewGame = async (gameType: string) => {
    setSelectedGameType(gameType)
    setGameState('processing')
    setError(null)
    setAiMessage("Getting a fun game ready for you... 🎲")
    clearCountdown()
    
    try {
      const response = await fetch('/api/play-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_game',
          gameType: gameType,
        }),
      })

      const data: GameResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setCurrentGameContext(data.responseText)
        setGameState('response_ready')
        setGamesPlayed(gamesPlayed + 1)
        setAiMessage("Game ready! 🎉 Listen to the challenge and give me your answer!")
      } else {
        setError(data.error || 'Failed to start game')
        setGameState('menu')
        setAiMessage("Hmm, I had trouble starting that game. Pick another one to try! 🎮")
      }
    } catch (err) {
      setError('Something went wrong. Please try another game!')
      setGameState('menu')
      setAiMessage("Oops! Something went wrong. What game would you like to play? 😊")
      console.error('Error:', err)
    }
  }

  const handleGameResponse = async (userResponse: string) => {
    console.log("Game response received:", userResponse)
    setGameState('processing')
    setAiMessage("Let me check your answer... 🤔")
    clearCountdown()
    
    try {
      const response = await fetch('/api/play-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'respond_to_game',
          gameType: selectedGameType,
          userResponse: userResponse,
          gameState: currentGameContext,
        }),
      })

      const data: GameResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setCurrentGameContext(data.responseText)
        setGameState('response_ready')
        setAiMessage("Great response! 🌟 Listen to my feedback and keep playing!")
      } else {
        setError(data.error || 'Failed to process your response')
        setGameState('playing')
        setAiMessage("I didn't catch that. Can you try your answer again? 🎮")
      }
    } catch (err) {
      setError('Something went wrong. Please try again!')
      setGameState('playing')
      setAiMessage("Oops! Can you repeat your answer? 😊")
      console.error('Error:', err)
    }
  }

  const continueGame = () => {
    setGameState('playing')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setAiMessage("I'm listening for your next answer! 👂 You can speak or type your response!")
  }

  const backToMenu = () => {
    stopListening()
    setGameState('menu')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setSelectedGameType("")
    setShowTextInput(false)
    restartAttempts.current = 0
    setCurrentGameContext("")
    setAiMessage("What game should we play next? I'm ready for more fun! 🎮")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Type your answer here! I'm excited to see what you say! ⌨️")
    } else {
      setAiMessage("Press the microphone to tell me your answer! 🎤")
    }
  }

  const gameTypes = [
    { 
      id: "riddle", 
      name: "Riddles", 
      emoji: "🧩", 
      description: "I'll ask you fun riddles to solve!",
      color: "from-purple-400 to-pink-400"
    },
    { 
      id: "word_game", 
      name: "Word Games", 
      emoji: "🎯", 
      description: "Rhyming, spelling, and word fun!",
      color: "from-blue-400 to-cyan-400"
    },
    { 
      id: "trivia", 
      name: "Fun Facts", 
      emoji: "🌟", 
      description: "Cool trivia questions about everything!",
      color: "from-green-400 to-emerald-400"
    },
    { 
      id: "guessing_game", 
      name: "Guessing Games", 
      emoji: "🤔", 
      description: "I'm thinking of something... can you guess?",
      color: "from-yellow-400 to-orange-400"
    },
    { 
      id: "story_game", 
      name: "Story Building", 
      emoji: "📚", 
      description: "Let's create a fun story together!",
      color: "from-red-400 to-pink-400"
    },
    { 
      id: "math_game", 
      name: "Number Fun", 
      emoji: "🔢", 
      description: "Fun math puzzles and number games!",
      color: "from-indigo-400 to-purple-400"
    },
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="max-w-4xl mx-auto">
        {/* Friendly Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-lg">
            <span className="text-6xl">🎮</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">Let's Play Games!</h1>
          
          {/* Score Display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto shadow-lg border-2 border-yellow-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="font-bold text-purple-800">Games Played: {gamesPlayed}</span>
              </div>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.min(gamesPlayed, 3) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Game Master Speech Bubble */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-3xl rounded-bl-lg p-6 max-w-2xl mx-auto shadow-lg">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">🎲</span>
              <span className="font-bold text-xl">Game Master MurfKiddo</span>
            </div>
            <p className="text-lg leading-relaxed">{aiMessage}</p>
          </div>
        </div>

        {/* Game Selection Menu */}
        {gameState === 'menu' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-purple-800 text-center mb-6">
              <Gamepad2 className="inline w-8 h-8 mr-2 text-purple-600" />
              Choose Your Game!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameTypes.map((game) => (
                <button
                  key={game.id}
                  onClick={() => startNewGame(game.id)}
                  className={`bg-gradient-to-r ${game.color} hover:shadow-xl transform hover:scale-105 text-white rounded-3xl p-6 transition-all duration-200 shadow-lg`}
                >
                  <div className="text-4xl mb-3">{game.emoji}</div>
                  <h3 className="font-bold text-xl mb-2">{game.name}</h3>
                  <p className="text-sm opacity-90">{game.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Mode Toggle */}
        {gameState === 'playing' && (
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
        {gameState === 'playing' && !showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 animate-pulse' 
                    : 'bg-gradient-to-r from-purple-400 to-pink-400'
                }`}
              >
                {isListening ? <MicOff className="w-16 h-16" /> : <Mic className="w-16 h-16" />}
              </button>
              
              {isListening && (
                <div className="mb-4">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    🎤 Listening... {listeningCountdown}s
                  </div>
                  <div className="bg-purple-100 rounded-2xl p-3">
                    <p className="text-purple-700 font-medium">Give me your answer! I'm listening for {listeningCountdown} more seconds...</p>
                  </div>
                </div>
              )}
              
              <p className="text-lg text-purple-700 font-medium mb-4">
                {isListening ? "🗣️ Tell me your answer!" : "👆 Press to give your answer!"}
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
                    <span className="font-bold">Your answer:</span> "{transcript}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Input Section */}
        {gameState === 'playing' && showTextInput && (
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
              <div className="flex items-center space-x-4 max-w-lg mx-auto">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="Type your answer here..."
                  className="flex-1 px-6 py-4 text-lg rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none"
                />
                <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim()}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Brain className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {gameState === 'processing' && (
          <div className="text-center mb-8">
            <LoadingSpinner />
            <p className="text-purple-600 mt-4 text-lg font-medium">
              🎮 Processing your response... ✨
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
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                >
                  Keep Playing
                </button>
                {!showTextInput && gameState === 'playing' && (
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

        {/* Game Response Display */}
        {currentResponse && gameState === 'response_ready' && (
          <div className="space-y-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-purple-800 mb-4">🎉 Game Response! 🎉</h2>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">{gameTypes.find(g => g.id === selectedGameType)?.name}</h3>
                </div>
              </div>

              {/* Response Text */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 max-h-48 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed text-lg">{currentResponse.responseText}</p>
              </div>

              <AudioPlayer 
                title={`Playing: ${gameTypes.find(g => g.id === selectedGameType)?.name}`}
                audioUrl={currentResponse.audioUrl}
              />
              
              <div className="text-center mt-6 space-x-4">
                <button 
                  onClick={continueGame}
                  className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Keep Playing! 🎮
                </button>
                <button 
                  onClick={backToMenu}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  New Game! 🎲
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
