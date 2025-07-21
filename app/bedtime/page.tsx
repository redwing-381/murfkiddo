"use client"

import { useState } from "react"
import { Moon, Star } from "lucide-react"
import AudioPlayer from "@/components/audio-player"

export default function BedtimeMode() {
  const [selectedStory, setSelectedStory] = useState("")
  const [storyLength, setStoryLength] = useState("short")

  const bedtimeStories = [
    {
      id: "sleepy-forest",
      title: "The Sleepy Forest",
      description: "A gentle tale about woodland creatures getting ready for bed",
      duration: "5 min",
      emoji: "🌲",
    },
    {
      id: "moon-adventure",
      title: "Moon Adventure",
      description: "A dreamy journey to visit the friendly moon",
      duration: "7 min",
      emoji: "🌙",
    },
    {
      id: "star-wishes",
      title: "Star Wishes",
      description: "A peaceful story about making wishes on shooting stars",
      duration: "6 min",
      emoji: "⭐",
    },
    {
      id: "cozy-cottage",
      title: "The Cozy Cottage",
      description: "A warm story about a little cottage in the woods",
      duration: "8 min",
      emoji: "🏠",
    },
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 float-animation">
            <span className="text-3xl">🌙</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bedtime Mode</h1>
          <p className="text-lg text-purple-200">Sweet dreams with gentle bedtime stories</p>
        </div>

        {/* Story Length Selection */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 text-center">How long should your bedtime story be?</h2>
          <div className="flex justify-center space-x-4">
            {[
              { value: "short", label: "Short (3-5 min)", emoji: "⏰" },
              { value: "medium", label: "Medium (5-8 min)", emoji: "🕐" },
              { value: "long", label: "Long (8-12 min)", emoji: "🕕" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStoryLength(option.value)}
                className={`p-4 rounded-2xl text-center transition-all duration-200 ${
                  storyLength === option.value
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <p className="font-semibold text-sm">{option.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Story Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {bedtimeStories.map((story) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story.id)}
              className={`p-6 rounded-3xl text-left transition-all duration-200 ${
                selectedStory === story.id
                  ? "bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-xl scale-105"
                  : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{story.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{story.title}</h3>
                  <p className="text-sm opacity-90 mb-2">{story.description}</p>
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4" />
                    <span className="text-sm">{story.duration}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Story Player */}
        {selectedStory && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
            <div className="text-center mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 text-yellow-400 fill-current animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {bedtimeStories.find((s) => s.id === selectedStory)?.title}
              </h2>
              <p className="text-purple-200">Get comfortable and close your eyes...</p>
            </div>

            <div className="bg-white/20 rounded-2xl p-6">
              <AudioPlayer title={bedtimeStories.find((s) => s.id === selectedStory)?.title || "Bedtime Story"} />
            </div>

            {/* Relaxation Tips */}
            <div className="mt-6 text-center">
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-purple-200 text-sm">
                  💤 Tip: Take slow, deep breaths and imagine the story in your mind
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Stars Animation */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${Math.random() * 10 + 10}px`,
              }}
            >
              ⭐
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
