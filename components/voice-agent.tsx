"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, MicOff, Volume2, VolumeX, Settings, MessageCircle, Sparkles, Phone, PhoneOff, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import UserPreferencesManager from "@/lib/user-preferences"

interface VoiceAgentProps {
  childName: string
  onSettings?: () => void
}

interface ConversationEvent {
  type: 'user_speaking' | 'ai_speaking' | 'thinking' | 'idle' | 'listening_auto'
  message?: string
  timestamp: number
}

export default function VoiceAgent({ childName, onSettings }: VoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<ConversationEvent>({ type: 'idle', timestamp: Date.now() })
  const [volume, setVolume] = useState([0.7])
  const [micSensitivity, setMicSensitivity] = useState([0.5])
  const [showSettings, setShowSettings] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [useWebSpeechAPI, setUseWebSpeechAPI] = useState(false)
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)
  const [autoMode, setAutoMode] = useState(true)
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  const [voiceActivityDetected, setVoiceActivityDetected] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const voicesLoadedRef = useRef(false)

  // Load browser voices on component mount
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        voicesLoadedRef.current = true
        console.log('Available voices:', voices.map(v => v.name))
      }
    }

    // Load voices immediately if available
    loadVoices()
    
    // Also listen for voices to be loaded (some browsers load them asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Wait for voices to load before selecting one
  const getChildFriendlyVoice = async (): Promise<SpeechSynthesisVoice | null> => {
    // Wait for voices to load if they haven't already
    if (!voicesLoadedRef.current) {
      await new Promise((resolve) => {
        const checkVoices = () => {
          const voices = speechSynthesis.getVoices()
          if (voices.length > 0) {
            voicesLoadedRef.current = true
            resolve(true)
          } else {
            setTimeout(checkVoices, 100)
          }
        }
        checkVoices()
      })
    }

    const voices = speechSynthesis.getVoices()
    let selectedVoice: SpeechSynthesisVoice | null = null
    
    // Prioritize child-friendly voices
    const preferredVoices = [
      'Samantha', 'Karen', 'Victoria', 'Serena', // macOS voices
      'Microsoft Zira', 'Microsoft Hazel', // Windows voices  
      'Google UK English Female', 'Google US English', // Chrome voices
    ]
    
    for (const voiceName of preferredVoices) {
      const foundVoice = voices.find(voice => 
        voice.name.includes(voiceName) && voice.lang.startsWith('en')
      )
      if (foundVoice) {
        selectedVoice = foundVoice
        break
      }
    }
    
    // Fallback to any female English voice
    if (!selectedVoice) {
      const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
      )
      const anyEnglishVoice = voices.find(voice => voice.lang.startsWith('en'))
      
      selectedVoice = femaleVoice || anyEnglishVoice || null
    }
    
    return selectedVoice
  }

  // Create audio cues for better UX
  const playAudioCue = useCallback((type: 'start' | 'stop' | 'ready') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Different tones for different cues
    switch (type) {
      case 'start': // Higher tone for "start speaking"
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        break
      case 'stop': // Lower tone for "processing"
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        break
      case 'ready': // Pleasant chime for "ready to listen"
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.1)
        break
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }, [])

  // Enhanced audio visualization with voice activity detection
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const normalizedLevel = average / 255
    setAudioLevel(normalizedLevel)

    // Voice activity detection
    const threshold = micSensitivity[0] * 0.3 // Adjustable threshold
    const hasVoiceActivity = normalizedLevel > threshold

    if (hasVoiceActivity) {
      setVoiceActivityDetected(true)
      // Clear any existing silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    } else if (voiceActivityDetected && isListening && autoMode) {
      // Start silence detection timer
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          console.log('Silence detected, stopping listening')
          stopListening()
          setVoiceActivityDetected(false)
        }, 2000) // 2 seconds of silence
      }
    }

    if (isListening) {
      requestAnimationFrame(updateAudioLevel)
    }
  }, [isListening, micSensitivity, voiceActivityDetected, autoMode])

  // Error recovery mechanism
  const recoverConversation = useCallback(() => {
    console.log('Recovering conversation flow...')
    setIsListening(false)
    setIsSpeaking(false)
    setIsThinking(false)
    setCurrentEvent({ type: 'idle', timestamp: Date.now() })
    
    // Clear any timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    // Restart listening if in auto mode and connected
    if (autoMode && isConnected) {
      setTimeout(() => {
        console.log('Auto-restarting listening after recovery')
        startAutoListening()
      }, 2000)
    }
  }, [autoMode, isConnected])

  // Conversation health check - ensures we don't get stuck
  useEffect(() => {
    if (!isConnected) return
    
    const healthCheck = setInterval(() => {
      const now = Date.now()
      const timeSinceLastEvent = now - currentEvent.timestamp
      
      // If stuck in thinking or speaking state for too long, recover
      if ((isThinking && timeSinceLastEvent > 15000) || 
          (isSpeaking && timeSinceLastEvent > 30000)) {
        console.warn('Conversation appears stuck, recovering...', {
          currentEvent: currentEvent.type,
          timeSinceLastEvent,
          isThinking,
          isSpeaking
        })
        recoverConversation()
      }
      
      // If idle for too long in auto mode, prompt the child
      if (autoMode && currentEvent.type === 'idle' && timeSinceLastEvent > 30000) {
        const promptMessage = `${childName}, I'm still here! What would you like to talk about?`
        setConversationHistory(prev => [...prev, `MurfKiddo: ${promptMessage}`])
        speakMessage(promptMessage)
      }
    }, 5000) // Check every 5 seconds
    
    return () => clearInterval(healthCheck)
  }, [isConnected, currentEvent, isThinking, isSpeaking, autoMode, childName, recoverConversation])

  // Initialize audio context and media stream
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000
        }
      })
      
      streamRef.current = stream
      audioContextRef.current = new AudioContext({ sampleRate: 24000 })
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.smoothingTimeConstant = 0.8
      analyserRef.current.fftSize = 1024
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Initialize browser speech recognition as fallback
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          if (transcript.trim()) {
            processTextInput(transcript.trim())
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Browser speech recognition error:', event.error)
          setIsListening(false)
          setIsThinking(false)
          setCurrentEvent({ type: 'idle', timestamp: Date.now() })
          
          // Auto-restart listening if in auto mode and it was just a temporary error
          if (autoMode && isConnected && event.error !== 'no-speech') {
            setTimeout(() => {
              if (!isSpeaking && !isThinking) {
                startAutoListening()
              }
            }, 2000)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        setSpeechRecognition(recognition)
      }
      
      return stream
    } catch (error) {
      console.error('Error accessing microphone:', error)
      throw error
    }
  }

  // Start voice conversation with auto mode
  const startConversation = async () => {
    try {
      setIsConnected(true)
      setCurrentEvent({ type: 'idle', timestamp: Date.now() })
      
      const stream = await initializeAudio()
      
      // Create media recorder for voice input
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      // Track usage
      UserPreferencesManager.trackUsage('Voice Agent', 5)

      // Add welcome message to history
      const welcomeMessage = `Hi ${childName}! I'm MurfKiddo, your voice buddy! When you hear a friendly beep, just start talking naturally. I'll listen and respond automatically! What would you like to chat about?`
      setConversationHistory(prev => [...prev, `MurfKiddo: ${welcomeMessage}`])
      
      // Speak welcome message and then start auto-listening
      await speakMessage(welcomeMessage)

    } catch (error) {
      console.error('Error starting conversation:', error)
      setIsConnected(false)
    }
  }

  // Stop voice conversation
  const stopConversation = () => {
    setIsConnected(false)
    setIsListening(false)
    setIsSpeaking(false)
    setIsThinking(false)
    setAutoMode(true) // Reset to auto mode
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (wsRef.current) {
      wsRef.current.close()
    }

    setCurrentEvent({ type: 'idle', timestamp: Date.now() })
  }

  // Auto-start listening (used after AI responses)
  const startAutoListening = () => {
    if (!isConnected || isSpeaking || isThinking) return
    
    playAudioCue('ready')
    setTimeout(() => {
      startListening()
    }, 500) // Small delay after beep
  }

  // Start listening for user input
  const startListening = () => {
    if (useWebSpeechAPI && speechRecognition) {
      // Use browser speech recognition
      setIsListening(true)
      setCurrentEvent({ type: autoMode ? 'listening_auto' : 'user_speaking', timestamp: Date.now() })
      updateAudioLevel()
      speechRecognition.start()
      playAudioCue('start')
      return
    }

    // Use audio recording for OpenAI Whisper
    if (!mediaRecorderRef.current || isListening) return

    setIsListening(true)
    setCurrentEvent({ type: autoMode ? 'listening_auto' : 'user_speaking', timestamp: Date.now() })
    
    const audioChunks: BlobPart[] = []
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorderRef.current.onstop = async () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        await processVoiceInput(audioBlob)
      }
    }

    mediaRecorderRef.current.start()
    updateAudioLevel()
    playAudioCue('start')

    // Auto-stop after 15 seconds if no voice activity detected
    if (autoMode) {
      setTimeout(() => {
        if (isListening && mediaRecorderRef.current?.state === 'recording' && !voiceActivityDetected) {
          console.log('No voice activity detected, auto-stopping')
          stopListening()
        }
      }, 15000)
    }
  }

  // Stop listening
  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (useWebSpeechAPI && speechRecognition) {
      speechRecognition.stop()
      setIsListening(false)
      playAudioCue('stop')
      return
    }

    if (!isListening || !mediaRecorderRef.current) return

    setIsListening(false)
    setIsThinking(true)
    setCurrentEvent({ type: 'thinking', timestamp: Date.now() })
    playAudioCue('stop')
    
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  // Process text input directly (for browser speech recognition fallback)
  const processTextInput = async (text: string) => {
    try {
      setIsThinking(true)
      setCurrentEvent({ type: 'thinking', timestamp: Date.now() })

      const formData = new FormData()
      formData.append('userText', text)
      formData.append('childName', childName)
      formData.append('conversationHistory', JSON.stringify(conversationHistory))

      const response = await fetch('/api/voice-agent', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        // Add user message to history
        setConversationHistory(prev => [...prev, `${childName}: ${text}`])

        // Add AI response to history
        setConversationHistory(prev => [...prev, `MurfKiddo: ${data.message}`])

        // Speak the AI response
        await speakMessage(data.message)
      } else {
        console.error('Voice processing error:', data.error)
        setIsThinking(false)
        setCurrentEvent({ type: 'idle', timestamp: Date.now() })
        // Auto-restart if in auto mode
        if (autoMode && isConnected) {
          setTimeout(startAutoListening, 2000)
        }
      }
    } catch (error) {
      console.error('Error processing text input:', error)
      setIsThinking(false)
      setCurrentEvent({ type: 'idle', timestamp: Date.now() })
      // Auto-restart if in auto mode
      if (autoMode && isConnected) {
        setTimeout(startAutoListening, 2000)
      }
    }
  }

  // Process voice input and get AI response
  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('childName', childName)
      formData.append('conversationHistory', JSON.stringify(conversationHistory))

      const response = await fetch('/api/voice-agent', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        // Add user message to history
        if (data.userMessage) {
          setConversationHistory(prev => [...prev, `${childName}: ${data.userMessage}`])
        }

        // Add AI response to history
        setConversationHistory(prev => [...prev, `MurfKiddo: ${data.message}`])

        // Speak the AI response
        await speakMessage(data.message)
      } else {
        // Check if we should fall back to browser speech recognition
        if (data.useWebSpeechAPI) {
          console.log('Falling back to browser speech recognition')
          setUseWebSpeechAPI(true)
          setIsThinking(false)
          setCurrentEvent({ type: 'idle', timestamp: Date.now() })
          // Show a message about the fallback
          const fallbackMessage = "Perfect! I'll use your browser's speech recognition. Just talk naturally when you hear the beep!"
          setConversationHistory(prev => [...prev, `MurfKiddo: ${fallbackMessage}`])
          await speakMessage(fallbackMessage)
          return
        }
        
        console.error('Voice processing error:', data.error)
        setIsThinking(false)
        setCurrentEvent({ type: 'idle', timestamp: Date.now() })
        // Auto-restart if in auto mode
        if (autoMode && isConnected) {
          setTimeout(startAutoListening, 2000)
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error)
      setIsThinking(false)
      setCurrentEvent({ type: 'idle', timestamp: Date.now() })
      // Auto-restart if in auto mode
      if (autoMode && isConnected) {
        setTimeout(startAutoListening, 2000)
      }
    }
  }

  // Speak AI message using text-to-speech
  const speakMessage = async (message: string) => {
    try {
      setIsThinking(false)
      setIsSpeaking(true)
      setCurrentEvent({ type: 'ai_speaking', message, timestamp: Date.now() })

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, voice: 'friendly' })
      })

      const data = await response.json()

      if (data.success && data.audioUrl) {
        await playAudio(data.audioUrl)
      } else {
        // Use enhanced browser TTS with kid-friendly configuration
        const config = data.browserTTSConfig || {
          rate: 0.85,
          pitch: 1.15,
          volume: 0.8
        }
        
        // Get the best child-friendly voice
        const selectedVoice = await getChildFriendlyVoice()
        
        const utterance = new SpeechSynthesisUtterance(message)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
        utterance.rate = config.rate
        utterance.pitch = config.pitch
        utterance.volume = Math.min(volume[0], config.volume)
        
        utterance.onstart = () => {
          console.log('Browser TTS started with voice:', selectedVoice?.name || 'default')
        }
        
        utterance.onend = () => {
          setIsSpeaking(false)
          setCurrentEvent({ type: 'idle', timestamp: Date.now() })
          // Auto-start listening after response if in auto mode
          if (autoMode && isConnected) {
            setTimeout(startAutoListening, 1000)
          }
        }

        utterance.onerror = (error) => {
          console.error('Browser TTS error:', error)
          setIsSpeaking(false)
          setCurrentEvent({ type: 'idle', timestamp: Date.now() })
          // Auto-start listening even if TTS fails
          if (autoMode && isConnected) {
            setTimeout(startAutoListening, 1000)
          }
        }

        // Cancel any ongoing speech and start new one
        speechSynthesis.cancel()
        setTimeout(() => {
          speechSynthesis.speak(utterance)
        }, 100) // Small delay to ensure cancel completes
      }
    } catch (error) {
      console.error('Error speaking message:', error)
      setIsSpeaking(false)
      setCurrentEvent({ type: 'idle', timestamp: Date.now() })
      // Auto-start listening if in auto mode
      if (autoMode && isConnected) {
        setTimeout(startAutoListening, 1000)
      }
    }
  }

  // Play audio from URL
  const playAudio = (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }

      const audio = new Audio(audioUrl)
      audio.volume = volume[0]
      audioElementRef.current = audio

      audio.onended = () => {
        setIsSpeaking(false)
        setCurrentEvent({ type: 'idle', timestamp: Date.now() })
        // Auto-start listening after response if in auto mode
        if (autoMode && isConnected) {
          setTimeout(startAutoListening, 1000)
        }
        resolve()
      }

      audio.onerror = reject
      audio.play().catch(reject)
    })
  }

  // Get status text based on current state
  const getStatusText = () => {
    switch (currentEvent.type) {
      case 'user_speaking':
        return "I'm listening to you..."
      case 'listening_auto':
        return useWebSpeechAPI 
          ? "🎤 Talk now! I'm listening..." 
          : "🎤 Just start talking! I'm listening..."
      case 'thinking':
        return "Let me think about that... 🤔"
      case 'ai_speaking':
        return "I'm speaking to you... 🗣️"
      default:
        return isConnected 
          ? autoMode
            ? "✨ Auto mode: I'll listen automatically after each response!"
            : "Ready to chat! Tap the mic when you want to speak."
          : "Tap the phone to start our voice conversation!"
    }
  }

  // Get status color
  const getStatusColor = () => {
    switch (currentEvent.type) {
      case 'user_speaking':
      case 'listening_auto':
        return 'text-blue-600'
      case 'thinking':
        return 'text-yellow-600'
      case 'ai_speaking':
        return 'text-green-600'
      default:
        return 'text-purple-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-orange-300">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 mb-4 shadow-lg border-2 border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-purple-800">Voice Chat with MurfKiddo</h1>
                <p className="text-purple-600">Hi {childName}! Let's have a natural voice conversation! 🎤</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-purple-50 rounded-2xl border-2 border-purple-100">
              <h3 className="font-bold text-purple-800 mb-3">Voice Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Volume</label>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Mic Sensitivity</label>
                  <Slider
                    value={micSensitivity}
                    onValueChange={setMicSensitivity}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoMode"
                    checked={autoMode}
                    onCheckedChange={setAutoMode}
                  />
                  <label htmlFor="autoMode" className="text-sm font-medium text-purple-700">
                    Auto conversation (recommended for kids)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Voice Interface */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-white/20 text-center">
          {/* Status */}
          <div className="mb-8">
            <p className={`text-lg font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {currentEvent.message && (
              <p className="text-purple-700 mt-2 text-base italic">
                "{currentEvent.message}"
              </p>
            )}
          </div>

          {/* Voice Visualization */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Voice activity indicator */}
              {voiceActivityDetected && isListening && (
                <div className="absolute inset-0 rounded-full bg-green-300 animate-pulse" style={{ transform: 'scale(2)' }} />
              )}
              
              {/* Outer pulse ring */}
              <div className={`absolute inset-0 rounded-full ${
                isListening || isSpeaking ? 'animate-pulse bg-purple-200' : ''
              }`} style={{ transform: 'scale(1.5)' }} />
              
              {/* Audio level visualization */}
              {isListening && (
                <div 
                  className="absolute inset-0 rounded-full bg-blue-300"
                  style={{ 
                    transform: `scale(${1.2 + audioLevel * 0.8})`,
                    opacity: 0.6
                  }}
                />
              )}

              {/* Main microphone button */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                isConnected
                  ? isListening
                    ? voiceActivityDetected
                      ? 'bg-green-500 hover:bg-green-600' // Green when voice detected
                      : 'bg-blue-500 hover:bg-blue-600' // Blue when listening
                    : isSpeaking
                    ? 'bg-green-500'
                    : isThinking
                    ? 'bg-yellow-500'
                    : 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-purple-500 hover:bg-purple-600'
              } text-white shadow-lg transition-all cursor-pointer`}
              onClick={!autoMode && isConnected ? (isListening ? stopListening : startListening) : undefined}>
                {!isConnected ? (
                  <Phone className="w-12 h-12" />
                ) : isListening ? (
                  <Mic className="w-12 h-12" />
                ) : isSpeaking ? (
                  <Volume2 className="w-12 h-12" />
                ) : isThinking ? (
                  <Sparkles className="w-12 h-12 animate-spin" />
                ) : (
                  autoMode ? <Play className="w-12 h-12" /> : <MicOff className="w-12 h-12" />
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-y-4">
            {!isConnected ? (
              <Button
                onClick={startConversation}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg py-6 px-12 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <Phone className="w-6 h-6 mr-2" />
                Start Voice Conversation
              </Button>
            ) : (
              <div className="flex justify-center space-x-4">
                {!autoMode && (
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isSpeaking || isThinking}
                    className={`${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-bold text-lg py-4 px-8 rounded-2xl transition-all`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        Stop Talking
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Start Talking
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={stopConversation}
                  variant="outline"
                  className="font-bold text-lg py-4 px-8 rounded-2xl border-2 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  End Call
                </Button>
              </div>
            )}
          </div>

          {/* Instructions for Kids */}
          {isConnected && (
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl text-left">
              <h4 className="font-bold text-blue-800 mb-2">🎯 How it works:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                {autoMode ? (
                  <>
                    <p>• 🔊 Listen for a friendly beep sound</p>
                    <p>• 🗣️ Start talking naturally when you hear it</p>
                    <p>• ⏰ I'll automatically know when you're done</p>
                    <p>• 🎤 Then I'll respond and listen again!</p>
                  </>
                ) : (
                  <>
                    <p>• 🔵 Click the blue button to start talking</p>
                    <p>• 🗣️ Speak clearly into your microphone</p>
                    <p>• 🔴 Click again when you're finished</p>
                    <p>• ⏳ Wait for my response, then repeat!</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Conversation History Preview */}
          {conversationHistory.length > 0 && (
            <div className="mt-8 p-4 bg-purple-50 rounded-2xl text-left max-h-40 overflow-y-auto">
              <h4 className="font-bold text-purple-800 mb-2">Conversation:</h4>
              <div className="space-y-1 text-sm">
                {conversationHistory.slice(-3).map((message, index) => (
                  <p key={index} className="text-purple-700">
                    {message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hidden audio element for playback */}
        <audio ref={audioElementRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
} 