"use client"

import { useState } from "react"
import { Wand2 } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import LoadingSpinner from "@/components/loading-spinner"

export default function StoryMode() {
  const [storyTopic, setStoryTopic] = useState("")
  const [voiceType, setVoiceType] = useState("playful")
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasStory, setHasStory] = useState(false)

  const handleGenerateStory = async () => {
    if (!storyTopic.trim()) return

    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      setHasStory(true)
    }, 2000)
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Story Mode</h1>
          <p className="text-lg text-purple-600">Tell me what you'd like your story to be about!</p>
        </div>

        {/* Story Input Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-blue-200 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-purple-800 mb-3">
                What should your story be about? ✨
              </label>
              <input
                type="text"
                value={storyTopic}
                onChange={(e) => setStoryTopic(e.target.value)}
                placeholder="e.g., a dragon and a cupcake, space adventure, magical forest..."
                className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none bg-white/90"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-purple-800 mb-3">
                How should I tell your story? 🎭
              </label>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value)}
                className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none bg-white/90"
              >
                <option value="playful">Playful & Fun 😄</option>
                <option value="calm">Calm & Gentle 😌</option>
                <option value="dramatic">Dramatic & Exciting 🎪</option>
              </select>
            </div>

            <button
              onClick={handleGenerateStory}
              disabled={!storyTopic.trim() || isGenerating}
              className="w-full kid-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Wand2 className="w-6 h-6" />
              <span>Tell Me a Story!</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isGenerating && <LoadingSpinner />}

        {/* Story Player */}
        {hasStory && !isGenerating && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-purple-800 mb-2">🌟 Your Story is Ready! 🌟</h2>
                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-4">
                  <h3 className="text-xl font-semibold text-blue-800">"The Adventure of {storyTopic}"</h3>
                </div>
              </div>

              <AudioPlayer title={`The Adventure of ${storyTopic}`} />
            </div>

            {/* Story Illustrations */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["🏰", "🐉", "🧁", "⭐"].map((emoji, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border-2 border-yellow-200"
                >
                  <div className="text-4xl mb-2">{emoji}</div>
                  <p className="text-sm text-purple-600 font-medium">Scene {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
