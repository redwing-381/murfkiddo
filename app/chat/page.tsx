"use client"

import { useState } from "react"
import { MessageCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import SimpleVoiceAgent from "@/components/simple-voice-agent"

export default function Chat() {
  const [childName, setChildName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)

  const startVoiceChat = () => {
    if (childName.trim()) {
      setShowNameInput(false)
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
              <h1 className="text-3xl font-bold text-purple-800 mb-2">Simple Voice Chat!</h1>
              <p className="text-purple-600">
                I'm MurfKiddo! We'll have an easy voice conversation - just hold a button and talk! 
                What's your name?
              </p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Type your name here..."
                className="w-full p-4 rounded-2xl border-2 border-purple-200 text-lg font-medium focus:border-purple-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && startVoiceChat()}
              />
              
              <Button
                onClick={startVoiceChat}
                disabled={!childName.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg py-6 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Simple Voice Chat!
              </Button>
              
              <div className="mt-4 p-4 bg-purple-50 rounded-2xl text-left">
                <h3 className="font-bold text-purple-800 mb-2">🎤 Super Simple Voice Chat:</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Hold the big button to talk (like a walkie-talkie)</li>
                  <li>• Release the button when you're done</li>
                  <li>• I'll respond with my voice automatically</li>
                  <li>• That's it - super easy! 🎉</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Simple voice chat interface
  return <SimpleVoiceAgent childName={childName} />
} 