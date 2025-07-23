"use client"

import { useState, useEffect } from "react"
import { Shield, Clock, Star, Settings, Download, Upload, RotateCcw, BarChart3, Calendar, Trophy, Heart, Sparkles } from "lucide-react"
import LoadingSpinner from "@/components/loading-spinner"
import UserPreferencesManager from "@/lib/user-preferences"

interface ParentalSettings {
  maxSessionTime: number
  allowedModes: string[]
  bedtimeSchedule: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  contentFiltering: {
    level: 'strict' | 'moderate' | 'relaxed'
  }
  voiceSettings: {
    speed: number
    volume: number
  }
}

interface UsageStats {
  today: { [mode: string]: number }
  thisWeek: { [mode: string]: number }
  thisMonth: { [mode: string]: number }
  totalMinutes: number
  favoriteMode: string
  streak: number
}

interface RecentActivity {
  timestamp: string
  mode: string
  duration: number
  content: string
}

export default function ParentalGuidance() {
  const [settings, setSettings] = useState<ParentalSettings>({
    maxSessionTime: 30,
    allowedModes: ['Story Mode', 'Tutor Mode', 'Play Mode', 'Language Mode', 'Bedtime Mode'],
    bedtimeSchedule: {
      enabled: false,
      startTime: '20:00',
      endTime: '07:00'
    },
    contentFiltering: {
      level: 'moderate'
    },
    voiceSettings: {
      speed: 1.0,
      volume: 0.8
    }
  })

  const [usageStats, setUsageStats] = useState<UsageStats>({
    today: {},
    thisWeek: {},
    thisMonth: {},
    totalMinutes: 0,
    favoriteMode: 'Story Mode',
    streak: 0
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load settings from API
      const settingsResponse = await fetch('/api/parental-settings')
      const settingsData = await settingsResponse.json()
      
      if (settingsData.settings) {
        setSettings(settingsData.settings)
      }

      // Load real usage data from localStorage
      const realStats = UserPreferencesManager.getUsageStats()
      const userPrefs = UserPreferencesManager.loadPreferences()
      
      // Load daily usage data
      const dailyUsageKey = 'murfkiddo_daily_usage'
      const storedUsage = localStorage.getItem(dailyUsageKey)
      let dailyUsage: { [date: string]: { [mode: string]: number } } = {}
      
      if (storedUsage) {
        dailyUsage = JSON.parse(storedUsage)
      }
      
      // Calculate today's usage by mode
      const today = new Date().toDateString()
      const todayUsage = dailyUsage[today] || {}
      
      // Calculate this week's usage by mode
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeekUsage: { [mode: string]: number } = {}
      
      Object.entries(dailyUsage).forEach(([date, dayData]) => {
        const dateObj = new Date(date)
        if (dateObj >= weekAgo) {
          Object.entries(dayData).forEach(([mode, minutes]) => {
            thisWeekUsage[mode] = (thisWeekUsage[mode] || 0) + (minutes as number)
          })
        }
      })
      
      // Map the data to match our interface
      const mappedStats: UsageStats = {
        today: todayUsage,
        thisWeek: thisWeekUsage,
        thisMonth: { 'Total': realStats.monthMinutes },
        totalMinutes: realStats.monthMinutes,
        favoriteMode: realStats.favoriteMode,
        streak: userPrefs.usage.streakDays || 0
      }
      setUsageStats(mappedStats)

      // Load recent activity from localStorage
      const activities: RecentActivity[] = []
      
      // Convert daily usage data to recent activities
      Object.entries(dailyUsage).forEach(([date, dayData]) => {
        Object.entries(dayData).forEach(([mode, minutes]) => {
          if ((minutes as number) > 0) {
            activities.push({
              timestamp: date,
              mode,
              duration: minutes as number,
              content: `Used ${mode} for ${minutes} minutes`
            })
          }
        })
      })

      // Sort by date and take recent ones
      setRecentActivity(activities.slice(-10))
      
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage('Error loading data')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      
      const response = await fetch('/api/parental-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_settings',
          settings: settings
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage('Settings saved successfully! 🎉')
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage('Error saving settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const exportData = () => {
    const data = UserPreferencesManager.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `murfkiddo-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage('Data exported successfully! 📄')
    setTimeout(() => setMessage(null), 3000)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        UserPreferencesManager.importData(data)
        loadData()
        setMessage('Data imported successfully! 📥')
        setTimeout(() => setMessage(null), 3000)
      } catch (error) {
        console.error('Error importing data:', error)
        setMessage('Error importing data')
      }
    }
    reader.readAsText(file)
  }

  const resetAllData = async () => {
    if (confirm('Are you sure you want to reset all usage data? This cannot be undone.')) {
      try {
        UserPreferencesManager.clearAllData()
        
        const response = await fetch('/api/parental-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'resetData'
          }),
        })

        await response.json()
        await loadData()
        setMessage('All data has been reset! 🔄')
        setTimeout(() => setMessage(null), 3000)
      } catch (error) {
        console.error('Error resetting data:', error)
        setMessage('Error resetting data')
      }
    }
  }

  const allModes = ['Story Mode', 'Tutor Mode', 'Play Mode', 'Language Mode', 'Bedtime Mode', 'Chat Mode']

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-xl text-purple-600 font-bold mt-4">Loading parental dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <div className="max-w-6xl mx-auto">
        {/* Super Friendly Header */}
        <div className="text-center mb-12">
          <div className="w-40 h-40 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-8 float-animation shadow-2xl">
            <span className="text-8xl">👨‍👩‍👧‍👦</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-purple-800 mb-6 rainbow-text">
            Parent Dashboard! 📊
          </h1>
          <p className="text-2xl text-purple-600 font-bold">
            Keep track of your child's amazing learning journey! 🌟
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className="kid-success max-w-2xl mx-auto mb-8">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">🎉</span>
              <span className="text-2xl font-black">Great!</span>
            </div>
            <p className="text-xl font-bold">{message}</p>
          </div>
        )}

        {/* Usage Statistics */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
            <BarChart3 className="inline w-10 h-10 mr-3 text-green-500 bounce-animation" />
            Your Child's Learning Stats! 📈
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 rounded-3xl p-6 shadow-lg border-4 border-green-200 text-center">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-xl font-black text-purple-800 mb-2">Today</h3>
              <p className="text-3xl font-black text-green-600">
                {Object.values(usageStats.today).reduce((sum, val) => sum + val, 0)} min
              </p>
            </div>

            <div className="bg-white/90 rounded-3xl p-6 shadow-lg border-4 border-blue-200 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-black text-purple-800 mb-2">This Week</h3>
              <p className="text-3xl font-black text-blue-600">
                {Object.values(usageStats.thisWeek).reduce((sum, val) => sum + val, 0)} min
              </p>
            </div>

            <div className="bg-white/90 rounded-3xl p-6 shadow-lg border-4 border-purple-200 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-black text-purple-800 mb-2">Favorite</h3>
              <p className="text-lg font-black text-purple-600">{usageStats.favoriteMode}</p>
            </div>

            <div className="bg-white/90 rounded-3xl p-6 shadow-lg border-4 border-orange-200 text-center">
              <div className="text-4xl mb-3">🔥</div>
              <h3 className="text-xl font-black text-purple-800 mb-2">Streak</h3>
              <p className="text-3xl font-black text-orange-600">{usageStats.streak} days</p>
            </div>
          </div>

          {/* Mode Usage Breakdown */}
          <div className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-white/70">
            <h3 className="text-2xl font-black text-purple-800 mb-6 text-center">
              <Sparkles className="inline w-8 h-8 mr-2 text-yellow-500" />
              Learning Time by Mode This Week
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allModes.map((mode) => {
                const minutes = usageStats.thisWeek[mode] || 0
            return (
                  <div key={mode} className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-800">{mode}</span>
                      <span className="text-2xl font-black text-purple-600">{minutes}m</span>
                    </div>
                    <div className="mt-2 bg-white rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                        style={{ width: `${Math.min((minutes / Math.max(...Object.values(usageStats.thisWeek), 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
            <Settings className="inline w-10 h-10 mr-3 text-blue-500 bounce-animation" />
            Safety & Learning Settings! ⚙️
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Settings */}
            <div className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-white/70">
              <h3 className="text-2xl font-black text-purple-800 mb-6">
                <Clock className="inline w-8 h-8 mr-2 text-green-500" />
                Time Controls
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-bold text-purple-700 mb-3">
                    Max Session Time (minutes)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={settings.maxSessionTime}
                    onChange={(e) => setSettings({...settings, maxSessionTime: parseInt(e.target.value)})}
                    className="w-full h-3 bg-purple-200 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-2">
                    <span className="text-2xl font-black text-purple-600">{settings.maxSessionTime} minutes</span>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-purple-700 mb-3">
                    Bedtime Schedule
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.bedtimeSchedule.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          bedtimeSchedule: {...settings.bedtimeSchedule, enabled: e.target.checked}
                        })}
                        className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="font-bold text-purple-800">Enable bedtime schedule</span>
                    </label>
                    
                    {settings.bedtimeSchedule.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-purple-700 mb-1">Sleep Time</label>
                          <input
                            type="time"
                            value={settings.bedtimeSchedule.startTime}
                            onChange={(e) => setSettings({
                              ...settings,
                              bedtimeSchedule: {...settings.bedtimeSchedule, startTime: e.target.value}
                            })}
                            className="w-full p-3 border-2 border-purple-200 rounded-xl font-bold text-purple-800"
                          />
                  </div>
                  <div>
                          <label className="block text-sm font-bold text-purple-700 mb-1">Wake Time</label>
                          <input
                            type="time"
                            value={settings.bedtimeSchedule.endTime}
                            onChange={(e) => setSettings({
                              ...settings,
                              bedtimeSchedule: {...settings.bedtimeSchedule, endTime: e.target.value}
                            })}
                            className="w-full p-3 border-2 border-purple-200 rounded-xl font-bold text-purple-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content & Mode Settings */}
            <div className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-white/70">
              <h3 className="text-2xl font-black text-purple-800 mb-6">
                <Shield className="inline w-8 h-8 mr-2 text-blue-500" />
                Content Controls
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-bold text-purple-700 mb-3">
                    Content Filtering Level
                  </label>
                  <div className="space-y-2">
                    {(['strict', 'moderate', 'relaxed'] as const).map((level) => (
                      <label key={level} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="contentLevel"
                          value={level}
                          checked={settings.contentFiltering.level === level}
                          onChange={(e) => setSettings({
                            ...settings,
                            contentFiltering: {level: e.target.value as 'strict' | 'moderate' | 'relaxed'}
                          })}
                          className="w-5 h-5 text-purple-600"
                        />
                        <span className="font-bold text-purple-800 capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
        </div>

                <div>
                  <label className="block text-lg font-bold text-purple-700 mb-3">
                    Allowed Learning Modes
                  </label>
                  <div className="space-y-3">
                    {allModes.map((mode) => (
                      <label key={mode} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.allowedModes.includes(mode)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettings({...settings, allowedModes: [...settings.allowedModes, mode]})
                            } else {
                              setSettings({...settings, allowedModes: settings.allowedModes.filter(m => m !== mode)})
                            }
                          }}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="font-bold text-purple-800">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Settings Button */}
          <div className="text-center mt-8">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="kid-button"
            >
              <Settings className="w-8 h-8 mr-4" />
              {isSaving ? 'Saving...' : 'Save All Settings!'} 💾
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
            <Calendar className="inline w-10 h-10 mr-3 text-orange-500 bounce-animation" />
            Recent Learning Adventures! 🎯
          </h2>

          <div className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-white/70">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-purple-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-purple-800">{activity.mode}</p>
                        <p className="text-sm text-purple-600">{activity.content}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-600">{new Date(activity.timestamp).toLocaleDateString()}</p>
                      <p className="font-bold text-purple-800">{activity.duration}m</p>
              </div>
            </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎈</div>
                <p className="text-xl font-bold text-purple-600">No recent activity yet!</p>
                <p className="text-lg text-purple-500">Your child's learning adventures will appear here!</p>
              </div>
            )}
          </div>
            </div>

        {/* Data Management */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-purple-800 text-center mb-8">
            <Trophy className="inline w-10 h-10 mr-3 text-yellow-500 bounce-animation" />
            Data Management! 📁
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={exportData}
              className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-green-200 hover:border-green-400 transform hover:scale-105 transition-all text-center"
            >
              <Download className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-black text-purple-800 mb-2">Export Data</h3>
              <p className="text-purple-600 font-bold">Download your child's progress!</p>
            </button>

            <label className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-blue-200 hover:border-blue-400 transform hover:scale-105 transition-all text-center cursor-pointer">
              <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-black text-purple-800 mb-2">Import Data</h3>
              <p className="text-purple-600 font-bold">Restore previous progress!</p>
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>

            <button
              onClick={resetAllData}
              className="bg-white/90 rounded-3xl p-8 shadow-lg border-4 border-red-200 hover:border-red-400 transform hover:scale-105 transition-all text-center"
            >
              <RotateCcw className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-black text-purple-800 mb-2">Reset Data</h3>
              <p className="text-purple-600 font-bold">Start fresh (careful!)</p>
            </button>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-yellow-200 to-orange-200 rounded-3xl p-8 shadow-lg border-4 border-yellow-300 max-w-4xl mx-auto">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-2xl font-black text-orange-800 mb-4">Parenting Tips!</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-white/50 rounded-2xl p-4">
                <p className="font-bold text-orange-800">🎯 Balance is key! Mix different learning modes throughout the week.</p>
              </div>
              <div className="bg-white/50 rounded-2xl p-4">
                <p className="font-bold text-orange-800">⏰ Short, regular sessions work better than long ones!</p>
              </div>
              <div className="bg-white/50 rounded-2xl p-4">
                <p className="font-bold text-orange-800">🌟 Celebrate your child's progress and achievements!</p>
              </div>
              <div className="bg-white/50 rounded-2xl p-4">
                <p className="font-bold text-orange-800">💤 Use bedtime mode to create peaceful sleep routines!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
