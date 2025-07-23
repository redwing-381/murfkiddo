"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, Download } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string
  title?: string
  autoPlay?: boolean
}

export default function AudioPlayer({ audioUrl, title = "Audio", autoPlay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Accessibility: Announce when audio is ready
    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(audio.duration)
      if (autoPlay) {
        playAudio()
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      // Announce completion for screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = `${title} has finished playing`
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }

    const handleError = () => {
      setError("Sorry, there was a problem playing the audio")
      setIsLoading(false)
      setIsPlaying(false)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null)
    }

    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [audioUrl, autoPlay, title])

  const playAudio = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error("Error playing audio:", error)
      setError("Couldn't play audio. Please try again!")
    }
  }

  const pauseAudio = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    audio.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(percentage * 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const audio = audioRef.current
    if (!audio) return

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault()
        togglePlayPause()
        break
      case 'ArrowLeft':
        e.preventDefault()
        audio.currentTime = Math.max(0, audio.currentTime - 10)
        break
      case 'ArrowRight':
        e.preventDefault()
        audio.currentTime = Math.min(duration, audio.currentTime + 10)
        break
      case '0':
        e.preventDefault()
        audio.currentTime = 0
        break
    }
  }

  const downloadAudio = () => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div 
        className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
        role="alert"
        aria-describedby="audio-error"
      >
        <p id="audio-error" className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-red-600 underline hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div 
      className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg border-2 border-purple-200"
      role="region"
      aria-label={`Audio player for ${title}`}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        aria-describedby="audio-description"
      />

      {/* Screen reader description */}
      <div id="audio-description" className="sr-only">
        Audio player for {title}. Use space or enter to play/pause. 
        Use left and right arrow keys to skip backward or forward 10 seconds. 
        Press 0 to restart from beginning.
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-2"
            aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
            aria-describedby="play-button-help"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Play className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
          
          {/* Hidden help text for screen readers */}
          <div id="play-button-help" className="sr-only">
            {isLoading ? "Loading audio..." : isPlaying ? "Click to pause" : "Click to play"}
          </div>

          <div className="flex items-center space-x-2 text-purple-600">
            <Volume2 className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium text-lg" aria-live="polite">
              {title}
            </span>
          </div>
        </div>

        <button
          onClick={downloadAudio}
          className="bg-white text-purple-600 p-3 rounded-full shadow hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-2"
          aria-label={`Download ${title}`}
          title="Download audio file"
        >
          <Download className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          className="w-full bg-white/50 rounded-full h-3 cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300"
          onClick={handleProgressClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const rect = e.currentTarget.getBoundingClientRect()
              const centerX = rect.width / 2
              const fakeEvent = {
                currentTarget: e.currentTarget,
                clientX: rect.left + centerX
              } as React.MouseEvent<HTMLDivElement>
              handleProgressClick(fakeEvent)
            }
          }}
          tabIndex={0}
          role="slider"
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        >
          <div
            className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="flex justify-between text-sm text-purple-600" aria-live="polite">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <details className="mt-4">
        <summary className="text-sm text-purple-600 cursor-pointer hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">
          Keyboard Shortcuts
        </summary>
        <div className="mt-2 text-xs text-purple-500 space-y-1">
          <p><kbd className="bg-white px-2 py-1 rounded">Space/Enter</kbd> - Play/Pause</p>
          <p><kbd className="bg-white px-2 py-1 rounded">←</kbd> - Skip back 10s</p>
          <p><kbd className="bg-white px-2 py-1 rounded">→</kbd> - Skip forward 10s</p>
          <p><kbd className="bg-white px-2 py-1 rounded">0</kbd> - Restart from beginning</p>
        </div>
      </details>
    </div>
  )
}
