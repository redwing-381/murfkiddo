"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Send, Volume2, VolumeX, Settings, MessageCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import AudioPlayer from "@/components/audio-player"

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  audioUrl?: string
}

// Speech recognition type checking handled inline

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [childName, setChildName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)
  const [voiceType, setVoiceType] = useState('friendly')
  const [showSettings, setShowSettings] = useState(false)
  const [autoPlayAudio, setAutoPlayAudio] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  
  const recognitionRef = useRef<any>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece
          } else {
            interimText += transcriptPiece
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          setInputMessage(prev => prev + finalTranscript)
          setInterimTranscript('')
        } else {
          setInterimTranscript(interimText)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimTranscript('')
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputMessage.trim()
    if (!message || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setTranscript('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          childName,
          voiceType,
          chatHistory: messages
        }),
      })

      const data = await response.json()

      if (data.success) {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: data.timestamp,
          audioUrl: data.audioUrl
        }

        setMessages(prev => [...prev, aiMessage])

        // Auto-play audio if enabled
        if (autoPlayAudio && data.audioUrl) {
          setTimeout(() => {
            playAudio(data.audioUrl)
          }, 500)
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Oops! I'm having trouble right now. Can you try asking me again? 🤖",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const playAudio = (audioUrl: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
    }
    
    const audio = new Audio(audioUrl)
    currentAudioRef.current = audio
    audio.play().catch(console.error)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startChat = () => {
    if (childName.trim()) {
      setShowNameInput(false)
      // Send welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hi ${childName}! 🌟 I'm MurfKiddo, your friendly AI companion! I'm super excited to chat with you today! You can ask me anything - tell me stories, ask questions about the world, play games, or just have a fun conversation! What would you like to talk about first? 😊`,
        timestamp: new Date().toISOString()
      }
      setMessages([welcomeMessage])
    }
  }

  // Name input screen
  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-orange-300 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-white/20 text-center mt-20">
            <div className="mb-6">
              <MessageCircle className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <h1 className="text-3xl font-bold text-purple-800 mb-2">Let's Chat!</h1>
              <p className="text-purple-600">I'm MurfKiddo, your friendly AI buddy! What's your name?</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Type your name here..."
                className="w-full p-4 rounded-2xl border-2 border-purple-200 text-lg font-medium focus:border-purple-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && startChat()}
              />
              
              <Button
                onClick={startChat}
                disabled={!childName.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg py-6 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Chatting!
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
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
                <h1 className="text-2xl font-bold text-purple-800">Chat with MurfKiddo</h1>
                <p className="text-purple-600">Hi {childName}! Ask me anything! 😊</p>
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
              <h3 className="font-bold text-purple-800 mb-3">Chat Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Voice Type</label>
                  <select
                    value={voiceType}
                    onChange={(e) => setVoiceType(e.target.value)}
                    className="w-full p-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="cheerful">Cheerful</option>
                    <option value="calm">Calm</option>
                    <option value="playful">Playful</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoPlay"
                    checked={autoPlayAudio}
                    onChange={(e) => setAutoPlayAudio(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="autoPlay" className="text-sm font-medium text-purple-700">
                    Auto-play responses
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-white/20 mb-4"
          style={{ height: '60vh', overflowY: 'auto' }}
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
                } p-4 rounded-3xl shadow-lg`}>
                  <p className="text-sm md:text-base">{message.content}</p>
                  {message.audioUrl && (
                    <div className="mt-3">
                      <Button
                        onClick={() => playAudio(message.audioUrl!)}
                        size="sm"
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Volume2 className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-3xl shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">MurfKiddo is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-white/20">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                value={inputMessage + interimTranscript}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or speak using the microphone..."
                className="min-h-[50px] max-h-[120px] border-2 border-purple-200 rounded-2xl resize-none focus:border-purple-500"
                disabled={isLoading}
              />
              {interimTranscript && (
                <p className="text-xs text-purple-500 mt-1">
                  Listening: {interimTranscript}
                </p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={isListening ? stopListening : startListening}
                variant="outline"
                size="lg"
                className={`rounded-2xl border-2 ${
                  isListening 
                    ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                    : 'border-purple-300 text-purple-600 hover:bg-purple-100'
                }`}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <Button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-6"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 