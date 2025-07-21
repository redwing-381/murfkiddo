"use client"

import { useState } from "react"
import { Play, Pause, Volume2 } from "lucide-react"

interface AudioPlayerProps {
  title?: string
  audioUrl?: string
}

export default function AudioPlayer({ title = "Story Audio", audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // In a real app, this would control actual audio playback
    console.log(isPlaying ? "Pausing audio" : "Playing audio", audioUrl)
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200">
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
        </button>

        <div className="flex-1">
          <h3 className="font-bold text-purple-800 text-lg">{title}</h3>
          <div className="flex items-center space-x-2 mt-2">
            <Volume2 className="w-4 h-4 text-purple-600" />
            <div className="flex-1 bg-purple-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
