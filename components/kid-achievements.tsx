"use client"

import { useState, useEffect } from 'react'
import { Star, Trophy, Heart, Zap, Crown, Sparkles } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

interface KidAchievementsProps {
  mode: string
  currentStats: {
    storiesCreated?: number
    questionsAsked?: number
    gamesPlayed?: number
    languagesLearned?: number
    bedtimeStories?: number
  }
}

export default function KidAchievements({ mode, currentStats }: KidAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([])

  // Define achievements for different modes
  const getAchievementsForMode = (mode: string): Achievement[] => {
    const baseAchievements: { [key: string]: Achievement[] } = {
      'Story Mode': [
        {
          id: 'first-story',
          title: 'Story Explorer! 📚',
          description: 'Created your first amazing story!',
          emoji: '📚',
          unlocked: (currentStats.storiesCreated || 0) >= 1
        },
        {
          id: 'story-master',
          title: 'Story Master! 🎭',
          description: 'Created 5 incredible stories!',
          emoji: '🎭',
          unlocked: (currentStats.storiesCreated || 0) >= 5,
          progress: currentStats.storiesCreated || 0,
          maxProgress: 5
        },
        {
          id: 'imagination-hero',
          title: 'Imagination Hero! 🌟',
          description: 'Created 10 magical stories!',
          emoji: '🌟',
          unlocked: (currentStats.storiesCreated || 0) >= 10,
          progress: currentStats.storiesCreated || 0,
          maxProgress: 10
        }
      ],
      'Tutor Mode': [
        {
          id: 'curious-kid',
          title: 'Curious Kid! 🤔',
          description: 'Asked your first question!',
          emoji: '🤔',
          unlocked: (currentStats.questionsAsked || 0) >= 1
        },
        {
          id: 'knowledge-seeker',
          title: 'Knowledge Seeker! 🧠',
          description: 'Asked 10 great questions!',
          emoji: '🧠',
          unlocked: (currentStats.questionsAsked || 0) >= 10,
          progress: currentStats.questionsAsked || 0,
          maxProgress: 10
        },
        {
          id: 'super-learner',
          title: 'Super Learner! 🎓',
          description: 'Asked 25 amazing questions!',
          emoji: '🎓',
          unlocked: (currentStats.questionsAsked || 0) >= 25,
          progress: currentStats.questionsAsked || 0,
          maxProgress: 25
        }
      ],
      'Play Mode': [
        {
          id: 'game-starter',
          title: 'Game Starter! 🎮',
          description: 'Played your first game!',
          emoji: '🎮',
          unlocked: (currentStats.gamesPlayed || 0) >= 1
        },
        {
          id: 'game-champion',
          title: 'Game Champion! 🏆',
          description: 'Played 5 fun games!',
          emoji: '🏆',
          unlocked: (currentStats.gamesPlayed || 0) >= 5,
          progress: currentStats.gamesPlayed || 0,
          maxProgress: 5
        },
        {
          id: 'ultimate-player',
          title: 'Ultimate Player! 👑',
          description: 'Played 15 awesome games!',
          emoji: '👑',
          unlocked: (currentStats.gamesPlayed || 0) >= 15,
          progress: currentStats.gamesPlayed || 0,
          maxProgress: 15
        }
      ],
      'Language Buddy': [
        {
          id: 'language-explorer',
          title: 'Language Explorer! 🌍',
          description: 'Started learning a new language!',
          emoji: '🌍',
          unlocked: (currentStats.languagesLearned || 0) >= 1
        },
        {
          id: 'polyglot-kid',
          title: 'Polyglot Kid! 🗣️',
          description: 'Learned words in 3 languages!',
          emoji: '🗣️',
          unlocked: (currentStats.languagesLearned || 0) >= 3,
          progress: currentStats.languagesLearned || 0,
          maxProgress: 3
        }
      ],
      'Bedtime Mode': [
        {
          id: 'sleepy-friend',
          title: 'Sleepy Friend! 🌙',
          description: 'Enjoyed your first bedtime story!',
          emoji: '🌙',
          unlocked: (currentStats.bedtimeStories || 0) >= 1
        },
        {
          id: 'dream-master',
          title: 'Dream Master! ✨',
          description: 'Had 5 peaceful bedtime sessions!',
          emoji: '✨',
          unlocked: (currentStats.bedtimeStories || 0) >= 5,
          progress: currentStats.bedtimeStories || 0,
          maxProgress: 5
        }
      ],

    }

    return baseAchievements[mode] || []
  }

  // Update achievements when stats change
  useEffect(() => {
    const currentAchievements = getAchievementsForMode(mode)
    const previousAchievements = achievements
    
    setAchievements(currentAchievements)

    // Check for new unlocks
    if (previousAchievements.length > 0) {
      const newlyUnlocked = currentAchievements.filter(
        (current) => 
          current.unlocked && 
          !previousAchievements.find(prev => prev.id === current.id)?.unlocked
      )
      
      if (newlyUnlocked.length > 0) {
        setNewUnlocks(newlyUnlocked)
        // Clear new unlocks after 3 seconds
        setTimeout(() => setNewUnlocks([]), 3000)
      }
    }
  }, [mode, currentStats])

  // Don't render if no achievements
  if (achievements.length === 0) return null

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length

  return (
    <div className="space-y-6">
      {/* Achievement Progress Header */}
      <div className="kid-achievement inline-block">
        <div className="flex items-center space-x-3">
          <Trophy className="w-8 h-8 text-yellow-600" />
          <span className="text-xl font-black text-orange-800">
            Achievements: {unlockedCount}/{totalCount} 🏆
          </span>
          <Trophy className="w-8 h-8 text-yellow-600" />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const progressPercent = achievement.maxProgress 
            ? Math.min(100, ((achievement.progress || 0) / achievement.maxProgress) * 100)
            : 100

          return (
            <div
              key={achievement.id}
              className={`relative overflow-hidden rounded-3xl p-6 border-4 transition-all duration-300 ${
                achievement.unlocked
                  ? 'bg-gradient-to-r from-yellow-200 to-orange-200 border-yellow-400 shadow-xl transform hover:scale-105'
                  : 'bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400 shadow-md opacity-60'
              }`}
            >
              {/* Achievement Icon */}
              <div className="text-center mb-4">
                <div className={`text-6xl mb-2 ${achievement.unlocked ? 'bounce-animation' : ''}`}>
                  {achievement.emoji}
                </div>
                <h3 className={`font-black text-lg ${
                  achievement.unlocked ? 'text-orange-800' : 'text-gray-600'
                }`}>
                  {achievement.title}
                </h3>
                <p className={`text-sm font-bold ${
                  achievement.unlocked ? 'text-orange-700' : 'text-gray-500'
                }`}>
                  {achievement.description}
                </p>
              </div>

              {/* Progress Bar (if applicable) */}
              {achievement.maxProgress && (
                <div className="mt-4">
                  <div className="bg-white/50 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-center text-sm font-bold mt-2">
                    {achievement.progress || 0} / {achievement.maxProgress}
                  </p>
                </div>
              )}

              {/* Unlock Effect */}
              {achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white rounded-full p-2 wiggle-animation">
                    <Star className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* New Achievement Popup */}
      {newUnlocks.map((achievement) => (
        <div
          key={`popup-${achievement.id}`}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bounce-animation"
        >
          <div className="bg-gradient-to-r from-yellow-300 to-orange-300 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500 text-center max-w-md">
            <div className="text-8xl mb-4 bounce-animation">🎉</div>
            <h2 className="text-3xl font-black text-orange-800 mb-2">
              NEW ACHIEVEMENT!
            </h2>
            <div className="text-6xl mb-4">{achievement.emoji}</div>
            <h3 className="text-2xl font-black text-orange-800 mb-2">
              {achievement.title}
            </h3>
            <p className="text-lg font-bold text-orange-700">
              {achievement.description}
            </p>
            <div className="flex justify-center space-x-2 mt-4">
              <Star className="w-6 h-6 text-yellow-600 wiggle-animation" />
              <Sparkles className="w-6 h-6 text-yellow-600 wiggle-animation" />
              <Star className="w-6 h-6 text-yellow-600 wiggle-animation" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 