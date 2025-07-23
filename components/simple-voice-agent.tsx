"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, Phone, PhoneOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserPreferencesManager from "@/lib/user-preferences"

interface SimpleVoiceAgentProps {
  childName: string
}

type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking'

const SYSTEM_PROMPT = `You are MurfKiddo, a friendly, cheerful AI voice companion for children aged 5-12. Keep responses short, positive, and ask a follow-up question.`

export default function SimpleVoiceAgent({ childName }: SimpleVoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [state, setState] = useState<ConversationState>('idle')
  const [conversationHistory, setConversationHistory] = useState<{sender: 'user'|'ai', text: string}[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [error, setError] = useState('')
  const [instructions, setInstructions] = useState(SYSTEM_PROMPT)
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)

  const speechRecognitionRef = useRef<any>(null)
  const isProcessingRef = useRef(false)

  useEffect(() => { return () => { cleanup() } }, [])

  const cleanup = () => {
    if (speechRecognitionRef.current) { try { speechRecognitionRef.current.stop() } catch {} }
    if (speechSynthesis.speaking) speechSynthesis.cancel()
    isProcessingRef.current = false
  }

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Your browser does not support speech recognition. Use Chrome or Safari.')
      return false
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1
    recognition.onresult = (event: any) => {
      if (isProcessingRef.current) return
      const transcript = event.results[0][0].transcript.trim()
      setLastTranscript(transcript)
      if (transcript) processUserInput(transcript)
      else {
        setState('idle')
        setCurrentMessage('I did not hear anything. Try again!')
      }
    }
    recognition.onerror = (event: any) => {
      isProcessingRef.current = false
      setState('idle')
      if (event.error === 'not-allowed') setError('Please allow microphone access!')
      else if (event.error === 'no-speech') setCurrentMessage('No speech detected. Try again!')
      else setCurrentMessage('Speech recognition error. Try again!')
    }
    recognition.onend = () => {
      if (state === 'listening' && !isProcessingRef.current) {
        setState('idle')
        setCurrentMessage('Ready! Hold the microphone to talk.')
      }
    }
    speechRecognitionRef.current = recognition
    return true
  }

  const startConversation = async () => {
    setError('')
    if (!initializeSpeechRecognition()) return
    setIsConnected(true)
    setState('idle')
    UserPreferencesManager.trackUsage('Simple Voice Agent', 3)
    const welcomeMessage = `Hi ${childName}! I'm MurfKiddo! Just hold the big microphone button and talk to me, then let go when you're done. What would you like to chat about?`
    setConversationHistory([{sender: 'ai', text: welcomeMessage}])
    setCurrentMessage('Starting...')
    await speakMessage(welcomeMessage)
  }

  const stopConversation = () => {
    cleanup()
    setIsConnected(false)
    setState('idle')
    setConversationHistory([])
    setCurrentMessage('')
    setError('')
    setLastTranscript(null)
  }

  const startListening = () => {
    if (state !== 'idle' || !speechRecognitionRef.current || isProcessingRef.current) return
    setError('')
    setState('listening')
    setCurrentMessage('🎤 I\'m listening - speak now!')
    setLastTranscript(null)
    try { speechRecognitionRef.current.start() } catch (e) {
      setState('idle')
      setCurrentMessage('Error starting microphone. Try again!')
    }
  }

  const stopListening = () => {
    if (state !== 'listening' || !speechRecognitionRef.current) return
    setState('processing')
    setCurrentMessage('Processing... please wait!')
    try { speechRecognitionRef.current.stop() } catch (e) {
      setState('idle')
      setCurrentMessage('Ready! Hold the microphone to talk.')
    }
  }

  const processUserInput = async (userText: string) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    try {
      setState('processing')
      setCurrentMessage('Thinking...')
      setConversationHistory(prev => [...prev, {sender: 'user', text: userText}])
      const newHistory = [...conversationHistory, {sender: 'user', text: userText}]
      // Send to OpenAI backend
      const formData = new FormData()
      formData.append('userText', userText)
      formData.append('childName', childName)
      formData.append('conversationHistory', JSON.stringify(newHistory.map(m => `${m.sender === 'user' ? childName : 'MurfKiddo'}: ${m.text}`)))
      formData.append('instructions', instructions)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch('/api/voice-agent', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()
      if (data.success && data.message) {
        setConversationHistory(prev => [...prev, {sender: 'ai', text: data.message}])
        await speakMessage(data.message)
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      let errorMessage = "Sorry, I had trouble understanding. Can you try again?"
      if (error.name === 'AbortError') errorMessage = "That took too long. Let's try again!"
      else if (error.message?.includes('Server error')) errorMessage = "I'm having connection issues. Try again in a moment!"
      setConversationHistory(prev => [...prev, {sender: 'ai', text: errorMessage}])
      await speakMessage(errorMessage)
    } finally {
      isProcessingRef.current = false
    }
  }

  const speakMessage = async (message: string) => {
    setState('speaking')
    setCurrentMessage('🗣️ I\'m talking to you...')
    try {
      await useBrowserTTS(message)
    } catch {
      setState('idle')
      setCurrentMessage('Hold the microphone to talk to me!')
    }
  }

  const useBrowserTTS = (message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      speechSynthesis.cancel()
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(message)
        const voices = speechSynthesis.getVoices()
        const goodVoice = voices.find(voice => voice.lang.startsWith('en') && (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen')))
          || voices.find(voice => voice.lang.startsWith('en'))
        if (goodVoice) utterance.voice = goodVoice
        utterance.rate = 0.9
        utterance.pitch = 1.1
        utterance.volume = 0.8
        utterance.onend = () => {
          setState('idle')
          setCurrentMessage('Hold the microphone button to talk to me!')
          resolve()
        }
        utterance.onerror = (error) => {
          setState('idle')
          setCurrentMessage('Hold the microphone button to talk to me!')
          reject(error)
        }
        setTimeout(() => {
          if (state === 'speaking') {
            setState('idle')
            setCurrentMessage('Hold the microphone button to talk to me!')
            resolve()
          }
        }, 8000)
        speechSynthesis.speak(utterance)
      }, 200)
    })
  }

  const getButtonColor = () => {
    switch (state) {
      case 'listening': return 'bg-red-500 hover:bg-red-600 scale-110 shadow-red-300'
      case 'processing': return 'bg-yellow-500 cursor-not-allowed'
      case 'speaking': return 'bg-green-500 cursor-not-allowed'
      default: return 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
    }
  }
  const getButtonIcon = () => {
    switch (state) {
      case 'listening': return <Mic className="w-16 h-16" />
      case 'processing': return <Loader2 className="w-16 h-16 animate-spin" />
      case 'speaking': return <Volume2 className="w-16 h-16" />
      default: return <MicOff className="w-16 h-16" />
    }
  }
  const getStatusMessage = () => {
    if (error) return `❌ ${error}`
    if (!isConnected) return "Ready to start our voice conversation!"
    switch (state) {
      case 'listening': return "🎤 I'm listening - keep talking!"
      case 'processing': return "🤔 Processing what you said..."
      case 'speaking': return "🗣️ I'm talking to you now..."
      default: return "👆 Hold the microphone button and talk to me!"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-orange-300">
      <div className="max-w-4xl mx-auto p-4">
        {/* Instruction Panel */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-lg border-2 border-white/20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-purple-800 mb-2">Talk with MurfKiddo</h1>
            <p className="text-purple-600 text-lg mb-2">Hi {childName}! Let's have a simple voice chat! 🎤</p>
            <div className="mb-2 text-sm text-purple-700">
              <p>1. Press and hold the big microphone button</p>
              <p>2. Talk clearly while holding the button</p>
              <p>3. Release the button when you're done</p>
              <p>4. Wait for my response and repeat!</p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-purple-700 mb-1">System Prompt (AI Instructions):</label>
              <textarea
                className="w-full p-2 rounded border border-purple-200 text-sm"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
        {/* Status/Error Banner */}
        <div className="mb-4">
          <div className={`rounded-xl px-4 py-2 text-center font-semibold text-lg ${error ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{getStatusMessage()}</div>
          {currentMessage && !error && (
            <div className="text-purple-600 text-base italic text-center mt-1">{currentMessage}</div>
          )}
          {lastTranscript && state === 'processing' && (
            <div className="text-blue-700 text-sm text-center mt-1">Heard: <span className="font-mono">{lastTranscript}</span></div>
          )}
        </div>
        {/* Chat Bubbles */}
        <div className="mb-8 max-h-72 overflow-y-auto px-2">
          {conversationHistory.length > 0 && (
            <div className="flex flex-col gap-2">
              {conversationHistory.slice(-10).map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 max-w-[70%] shadow ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-200 text-purple-900'}`}>{msg.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Mic Button and End Chat */}
        <div className="mb-8 flex flex-col items-center gap-4">
          {!isConnected ? (
            <Button
              onClick={startConversation}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl py-8 px-16 rounded-full hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Phone className="w-8 h-8 mr-3" />
              Start Voice Chat
            </Button>
          ) : (
            <div className="relative">
              <button
                className={`w-48 h-48 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-200 ${getButtonColor()}`}
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={state === 'listening' ? stopListening : undefined}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                disabled={state === 'processing' || state === 'speaking'}
              >
                {getButtonIcon()}
              </button>
              {state === 'listening' && (
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
              )}
            </div>
          )}
          {isConnected && (
            <Button
              onClick={stopConversation}
              variant="outline"
              className="font-bold text-lg py-3 px-8 rounded-2xl border-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Chat
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 