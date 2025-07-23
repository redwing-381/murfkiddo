"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Trophy, Star, Gamepad2, Brain, Keyboard, RefreshCw, Heart } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"
import UserPreferencesManager from "@/lib/user-preferences"
import KidAchievements from "@/components/kid-achievements"

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
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [selectedGameType, setSelectedGameType] = useState<string>("")
  const [listeningCountdown, setListeningCountdown] = useState(20) // Longer for kids
  const [score, setScore] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [currentGameContext, setCurrentGameContext] = useState("")
  const [aiMessage, setAiMessage] = useState("Hey there, super player! 🎮✨ I'm your fun game buddy! Let's play amazing games together! Pick a game below or tell me what you want to play - riddles, word games, trivia, or anything fun! What sounds AWESOME to you?")

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
              handleGameAction(finalTranscript.trim())
              recognition.stop()
            }
          }, 2000) as unknown as number // Wait 2 seconds for more speech
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        
        if (event.error === 'no-speech') {
          // Auto-restart for kids, but with attempts limit
          if (restartAttempts.current < 3 && gameState === 'playing') {
            restartAttempts.current++
            setAiMessage("I didn't hear anything! Let's try again! Press the big microphone and speak clearly! 📢✨")
            setTimeout(() => {
              if (!isListening) {
                startListening()
              }
            }, 1000)
          } else {
            setError("I'm having trouble hearing you! Try using the typing option instead! 😊")
            setAiMessage("No problem! Click 'Switch to Typing' and type your answer instead! ⌨️🌟")
          }
        } else {
          setError(`Having trouble with voice recognition. Let's try typing instead! 😊`)
          setAiMessage("Let's try typing your answer instead! Click the typing button! 💻✨")
        }
        
        setIsListening(false)
        setGameState('playing')
        clearCountdown()
      }

      recognition.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
        clearCountdown()
        
        // If we got a transcript, process it
        if (transcript.trim()) {
          handleGameAction(transcript.trim())
        }
      }

      setRecognition(recognition)
    }

    return () => {
      clearCountdown()
      clearTimeout(listeningTimeoutRef.current)
    }
  }, [transcript, gameState])

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
      setAiMessage("I'm listening super carefully! Give me your awesome answer! 🎧✨")
      restartAttempts.current = 0
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      clearCountdown()
      clearTimeout(listeningTimeoutRef.current)
      setAiMessage("Ready for your next amazing move! 🌟")
    }
  }

  const handleTextInput = () => {
    if (textInput.trim()) {
      handleGameAction(textInput.trim())
      setTextInput("")
    }
  }

  const startGame = (gameType: string) => {
    setSelectedGameType(gameType)
    setGameState('processing')
    setCurrentGameContext("")
    setAiMessage(`AWESOME choice! 🎉 Let me set up a super fun ${gameType} game for you! This is going to be AMAZING! ✨`)
    handleGameAction(`start ${gameType}`)
  }

  const handleGameAction = async (action: string) => {
    console.log("Game action:", action)
    setGameState('processing')
    setIsProcessing(true)
    clearCountdown()
    
    try {
      const response = await fetch('/api/play-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          gameType: selectedGameType,
          context: currentGameContext,
        }),
      })

      const data: GameResponse = await response.json()

      if (data.success) {
        setCurrentResponse(data)
        setGameState('response_ready')
        setCurrentGameContext(currentGameContext + "\n" + action + "\n" + data.responseText)
        
        if (data.action === 'score') {
          setScore(prev => prev + 1)
          setAiMessage("🎉 AMAZING JOB! 🎉 You got it right! You're so smart! Want to keep playing or try a different game? 🌟")
        } else {
          setAiMessage("Great try! 😊 Here's what happens next in our game! Want to keep playing? 🎮✨")
        }
        
        setGamesPlayed(prev => prev + 1)
        
        // Track usage - estimate 10 minutes per game session
        UserPreferencesManager.trackUsage('Play Mode', 10)
    } else {
        setError(data.error || 'Hmm, something went wrong with our game, but that\'s okay!')
        setGameState('playing')
        setAiMessage("Oops! Our game got a little confused, but don't worry! Can you try again or pick a different game? 😊🌈")
      }
      setIsProcessing(false)
    } catch (err) {
      setError('Something went wrong, but let\'s keep playing!')
      setGameState('playing')
      setAiMessage("No worries! Sometimes games get a little mixed up. What other fun thing would you like to play? 🌟")
      setIsProcessing(false)
      console.error('Error:', err)
    }
  }

  const resetGame = () => {
    stopListening()
    setGameState('menu')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setSelectedGameType("")
    setCurrentGameContext("")
    setShowTextInput(false)
    restartAttempts.current = 0
    setAiMessage("What other SUPER FUN game would you like to play? I have so many awesome games for amazing kids like you! 🎮✨")
  }

  const continueGame = () => {
    setGameState('playing')
    setCurrentResponse(null)
    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setTextInput("")
    setAiMessage("What's your next awesome move? I'm so excited to see what you'll do! 🎉")
  }

  const toggleInputMode = () => {
    stopListening()
    setShowTextInput(!showTextInput)
    setError(null)
    if (!showTextInput) {
      setAiMessage("Perfect! Type your amazing answer here! This is going to be so much fun! ⌨️🌟")
    } else {
      setAiMessage("Great! Press the BIG microphone button and tell me your answer out loud! 🎤✨")
    }
  }

  const gameTypes = [
    { 
      name: "Riddles", 
      emoji: "🧩", 
      description: "Brain teasers and fun puzzles!",
      color: "from-purple-400 to-pink-400"
    },
    { 
      name: "Word Games", 
      emoji: "📝", 
      description: "Rhymes, spelling, and word fun!",
      color: "from-blue-400 to-cyan-400"
    },
    { 
      name: "Trivia", 
      emoji: "🎯", 
      description: "Cool questions about everything!",
      color: "from-green-400 to-emerald-400"
    },
    { 
      name: "Story Games", 
      emoji: "📚", 
      description: "Create adventures together!",
      color: "from-orange-400 to-red-400"
    },
    { 
      name: "Number Fun", 
      emoji: "🔢", 
      description: "Math games that are super fun!",
      color: "from-indigo-400 to-purple-400"
    },
    { 
      name: "Animal Quiz", 
      emoji: "🐾", 
      description: "Learn about amazing animals!",
      color: "from-teal-400 to-green-400"
    }
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100">
      <div className="max-w-5xl mx-auto">
        {/* Super Friendly Header */}
        <div className="text-center mb-12">
          <div className="w-40 h-40 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-8 float-animation shadow-2xl">
            <span className="text-8xl">🎮</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-purple-800 mb-6 rainbow-text">
            Game Time! 🎉
          </h1>
        </div>

        {/* Kid Achievements System */}
        <div className="mb-12">
          <KidAchievements 
            mode="Play Mode"
            currentStats={{
              gamesPlayed: gamesPlayed
            }}
          />
        </div>

        {/* AI Game Master Speech Bubble */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-3xl rounded-bl-lg p-8 max-w-4xl mx-auto shadow-2xl border-4 border-white/30">
            <div className="flex items-center mb-6">
              <span className="text-6xl mr-6 bounce-animation">🎮</span>
              <span className="font-black text-3xl">Game Master MurfKiddo</span>
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

        {/* Game Menu */}
        {gameState === 'menu' && (
          <div className="space-y-12">
            <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
              <Gamepad2 className="inline w-10 h-10 mr-3 text-orange-500 bounce-animation" />
              Pick Your Super Fun Game! 🌟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameTypes.map((game, index) => (
                <button
                  key={index}
                  onClick={() => startGame(game.name)}
                  className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-white/70 hover:border-orange-300 transform hover:scale-105 transition-all text-center"
                >
                  <div className={`w-24 h-24 bg-gradient-to-r ${game.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <span className="text-5xl">{game.emoji}</span>
                  </div>
                  <h3 className="text-2xl font-black text-purple-800 mb-3">{game.name}</h3>
                  <p className="text-lg text-purple-600 font-bold">{game.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Mode Toggle - During Game */}
        {(gameState === 'playing' || gameState === 'response_ready') && (
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
        {gameState === 'playing' && !showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              {/* Giant Microphone Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`kid-mic-button mx-auto mb-8 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 pulse-animation' 
                    : 'bg-gradient-to-r from-orange-400 to-red-400 wiggle-animation'
                }`}
              >
                {isListening ? <MicOff className="w-24 h-24" /> : <Mic className="w-24 h-24" />}
              </button>

              {/* Listening Status - Kid Friendly */}
              {isListening && (
              <div className="mb-6">
                  <div className="bg-gradient-to-r from-green-200 to-blue-200 rounded-3xl p-6 shadow-lg">
                    <p className="text-2xl font-black text-green-800 mb-4">
                      🎧 I'm Listening for Your Answer! ({listeningCountdown}s)
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
                    🗣️ Your Answer:
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    "{transcript || interimTranscript}"
                  </p>
              </div>
              )}
              
              <p className="text-xl text-purple-600 font-bold">
                💡 Think carefully and give me your best answer!
              </p>
            </div>
          </div>
        )}

        {/* Text Input Section - Much Bigger */}
        {gameState === 'playing' && showTextInput && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-3xl mx-auto">
              <div className="flex flex-col space-y-6">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  placeholder="Type your awesome answer here..."
                  className="kid-input"
                  disabled={isProcessing}
                />
                  <button
                  onClick={handleTextInput}
                  disabled={!textInput.trim() || isProcessing}
                  className="kid-button mx-auto"
                >
                  <Brain className="w-8 h-8 mr-4" />
                  That's My Answer! 🎯
                  </button>
              </div>
              <p className="text-xl text-purple-600 font-bold mt-6">
                💡 Take your time and think about it!
              </p>
            </div>
          </div>
        )}

        {/* Loading State - Fun for Kids */}
        {gameState === 'processing' && (
          <div className="text-center mb-12">
            <div className="kid-message-box max-w-2xl mx-auto">
              <div className="text-8xl mb-6 kid-loading">🎮</div>
              <p className="text-3xl font-black text-purple-600 mb-4">
                ✨ Game Magic Happening! ✨
              </p>
              <p className="text-xl font-bold text-purple-500">
                🎯 Checking your answer... 🎪 Adding more fun... 🎉 Almost ready!
              </p>
              <LoadingSpinner />
            </div>
            </div>
          )}

        {/* Game Response Ready */}
        {gameState === 'response_ready' && currentResponse && (
          <div className="space-y-8">
            {/* Audio Player */}
            <div className="max-w-4xl mx-auto">
              <AudioPlayer 
                audioUrl={currentResponse.audioUrl} 
                title={`Playing: ${currentResponse.gameType}`}
                autoPlay={true}
              />
            </div>

            {/* Game Response Display */}
            <div className="kid-message-box max-w-4xl mx-auto">
              <h3 className="text-3xl font-black text-purple-800 mb-6">🎮 {currentResponse.gameType}</h3>
              <div className="text-xl leading-relaxed text-purple-700 font-semibold">
                {currentResponse.responseText}
              </div>
        </div>

            {/* Score Display */}
            {score > 0 && (
              <div className="text-center">
                <div className="kid-success max-w-2xl mx-auto">
                  <div className="text-6xl mb-4 bounce-animation">🏆</div>
                  <h3 className="text-3xl font-black text-green-800 mb-2">
                    Your Score: {score} Points!
                  </h3>
                  <p className="text-xl font-bold text-green-700">
                    You're doing AMAZING! 🌟
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center space-y-6">
              <button
                onClick={continueGame}
                className="kid-button mr-4"
              >
                <Star className="w-8 h-8 mr-4" />
                Keep Playing! 🎯
              </button>
            <button
                onClick={resetGame}
                className="kid-button"
              >
                <RefreshCw className="w-8 h-8 mr-4" />
                New Game! 🎮
            </button>
            </div>
        </div>
        )}
      </div>
    </div>
  )
}
