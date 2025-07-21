"use client"

import { useState } from "react"
import { Send, Mic, MicOff } from "lucide-react"

export default function TutorMode() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm your learning buddy. What would you like to learn about today?",
      sender: "murf",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isListening, setIsListening] = useState(false)

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "kid" as const,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInputText("")

    // Simulate AI response
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        text: "That's a great question! Let me explain that in a fun way...",
        sender: "murf" as const,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, response])
    }, 1000)
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // In a real app, this would start/stop speech recognition
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Tutor Mode</h1>
          <p className="text-lg text-purple-600">Let's learn something new together!</p>
        </div>

        {/* Chat Interface */}
        <div
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-green-200 overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e0f2fe' fillOpacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "kid" ? "justify-end" : "justify-start"}`}>
                <div className={message.sender === "kid" ? "chat-bubble-kid" : "chat-bubble-murf"}>
                  <p className="text-sm md:text-base">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/90 border-t-2 border-green-200">
            <div className="flex space-x-3">
              <button
                onClick={toggleListening}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
                } text-white shadow-lg hover:shadow-xl`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me anything you want to learn!"
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-lg"
              />

              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Learning Topics */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: "🔢", topic: "Math" },
            { emoji: "🔬", topic: "Science" },
            { emoji: "📖", topic: "Reading" },
            { emoji: "🌍", topic: "Geography" },
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => setInputText(`Tell me about ${item.topic}`)}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <div className="text-3xl mb-2">{item.emoji}</div>
              <p className="text-purple-800 font-semibold">{item.topic}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
