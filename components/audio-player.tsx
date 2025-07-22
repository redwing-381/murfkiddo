"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, Download } from "lucide-react"

interface AudioPlayerProps {
  title?: string
  audioUrl?: string
}

export default function AudioPlayer({ title = "Story Audio", audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      const current = audio.currentTime
      const total = audio.duration
      setCurrentTime(current)
      if (total > 0) {
        setProgress((current / total) * 100)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }

    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      }
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || duration === 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickProgress = clickX / rect.width
    const newTime = clickProgress * duration
    
    audio.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(clickProgress * 100)
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    if (!audioUrl) return
    
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!audioUrl) {
    return (
      <div className="bg-gray-100 rounded-2xl p-6 text-center">
        <p className="text-gray-500">No audio available</p>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          ) : isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-purple-800 text-lg truncate">{title}</h3>
            <button
              onClick={handleDownload}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-full transition-colors"
              title="Download story"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div 
              className="flex-1 bg-purple-200 rounded-full h-3 cursor-pointer hover:bg-purple-300 transition-colors"
              onClick={handleProgressClick}
            >
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-purple-600 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
