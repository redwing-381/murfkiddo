"use client"

import { useState, useEffect } from "react"
import { Shield, Eye, Volume2, Clock, Users, Heart, Settings, BarChart3, BookOpen, Brain, Gamepad2, Globe, Moon, AlertCircle, CheckCircle2, RefreshCw, Save, Trash2 } from "lucide-react"

export default function ParentalGuidance() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'safety' | 'settings' | 'activity'>('dashboard')
  const [timeLimit, setTimeLimit] = useState(60) // minutes
  const [contentFiltering, setContentFiltering] = useState('moderate')
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [notifications, setNotifications] = useState(true)
  
  // API state management
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Dynamic data from API
  const [usageStats, setUsageStats] = useState({
    todayMinutes: 0,
    weekTotal: 0,
    favoriteMode: 'Story Mode',
    storiesHeard: 0,
    questionsAsked: 0,
    gamesPlayed: 0,
    languagesExplored: 0,
    bedtimeStories: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<Array<{
    time: string
    mode: string
    activity: string
    duration: string
    timestamp?: Date
  }>>([])

  // Load data from API
  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/parental-settings')
      const data = await response.json()
      
      if (data.success) {
        // Update settings
        if (data.settings) {
          setTimeLimit(data.settings.timeLimit)
          setContentFiltering(data.settings.contentFiltering)
          setVoiceRecording(data.settings.voiceRecording)
          setNotifications(data.settings.notifications)
        }
        
        // Update usage stats
        if (data.usage) {
          setUsageStats(data.usage)
        }
        
        // Update recent activity
        if (data.activity) {
          setRecentActivity(data.activity)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showMessage('error', 'Failed to load parental data')
    } finally {
      setLoading(false)
    }
  }

  // Save settings to API
  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/parental-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateSettings',
          settings: {
            timeLimit,
            contentFiltering,
            voiceRecording,
            notifications
          }
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showMessage('success', 'Settings saved successfully!')
      } else {
        showMessage('error', 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showMessage('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Quick actions
  const handleQuickAction = async (action: string) => {
    try {
      setLoading(true)
      let response
      
      if (action === 'resetData') {
        response = await fetch('/api/parental-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resetData' })
        })
      } else if (action === 'simulateUsage') {
        response = await fetch('/api/parental-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'simulateUsage' })
        })
      } else if (action === 'setTimeLimit') {
        setActiveTab('settings')
        return
      }
      
      if (response) {
        const data = await response.json()
        if (data.success) {
          if (action === 'resetData') {
            showMessage('success', 'Usage data reset successfully')
            setUsageStats(data.usage)
            setRecentActivity([])
          } else if (action === 'simulateUsage') {
            showMessage('success', 'Demo usage data generated')
            setUsageStats(data.usage)
            setRecentActivity(data.activity)
          }
        } else {
          showMessage('error', 'Action failed')
        }
      }
    } catch (error) {
      console.error('Error executing action:', error)
      showMessage('error', 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const safetyFeatures = [
    {
      icon: Shield,
      title: "Content Safety",
      description: "All AI responses filtered for age-appropriate content (5-12 years)",
      status: "active"
    },
    {
      icon: Eye,
      title: "Privacy Protection", 
      description: "No personal data stored, voice processed locally when possible",
      status: "active"
    },
    {
      icon: Volume2,
      title: "Voice Privacy",
      description: "Audio not recorded or stored, processed for interaction only",
      status: "active"
    },
    {
      icon: Clock,
      title: "Time Management",
      description: "Built-in usage tracking with customizable time limits",
      status: "configurable"
    },
    {
      icon: AlertCircle,
      title: "Content Monitoring",
      description: "All interactions logged for parental review",
      status: "active"
    },
    {
      icon: CheckCircle2,
      title: "Educational Focus",
      description: "All content designed for learning and development",
      status: "active"
    }
  ]

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'activity', name: 'Activity', icon: Clock },
    { id: 'safety', name: 'Safety', icon: Shield },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  const getModeIcon = (mode: string) => {
    switch(mode) {
      case 'Story Mode': return '📚'
      case 'Tutor Mode': return '🧠'
      case 'Play Mode': return '🎮'
      case 'Language Buddy': return '🌍'
      case 'Bedtime Mode': return '🌙'
      default: return '🎤'
    }
  }

  const getModeColor = (mode: string) => {
    switch(mode) {
      case 'Story Mode': return 'text-blue-600 bg-blue-100'
      case 'Tutor Mode': return 'text-green-600 bg-green-100'
      case 'Play Mode': return 'text-purple-600 bg-purple-100'
      case 'Language Buddy': return 'text-orange-600 bg-orange-100'
      case 'Bedtime Mode': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">Parental Dashboard</h1>
          <p className="text-lg text-purple-600">Monitor, control, and ensure your child's safe learning experience</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border-2 ${
            message.type === 'success' 
              ? 'bg-green-100 border-green-300 text-green-700' 
              : 'bg-red-100 border-red-300 text-red-700'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-green-200 mb-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-purple-700 hover:bg-green-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="hidden sm:block">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-blue-200 text-center relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                )}
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-800">{usageStats.todayMinutes} min</div>
                <div className="text-purple-600">Today</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-green-200 text-center relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-green-500" />
                  </div>
                )}
                <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-800">{usageStats.weekTotal} min</div>
                <div className="text-purple-600">This Week</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-purple-200 text-center relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                )}
                <Heart className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <div className="text-lg font-bold text-purple-800">{usageStats.favoriteMode}</div>
                <div className="text-purple-600">Favorite Mode</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-orange-200 text-center relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                )}
                <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-800">{usageStats.storiesHeard}</div>
                <div className="text-purple-600">Stories Heard</div>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <Brain className="w-8 h-8 mr-3 text-purple-600" />
                Learning Progress
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-2xl font-bold text-blue-600">{usageStats.storiesHeard}</div>
                  <div className="text-purple-600">Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🧠</div>
                  <div className="text-2xl font-bold text-green-600">{usageStats.questionsAsked}</div>
                  <div className="text-purple-600">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎮</div>
                  <div className="text-2xl font-bold text-purple-600">{usageStats.gamesPlayed}</div>
                  <div className="text-purple-600">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🌍</div>
                  <div className="text-2xl font-bold text-orange-600">{usageStats.languagesExplored}</div>
                  <div className="text-purple-600">Languages</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-purple-800">Quick Actions</h2>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleQuickAction('setTimeLimit')}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Clock className="w-5 h-5" />
                  <span>Set Time Limit</span>
                </button>
                <button 
                  onClick={() => handleQuickAction('simulateUsage')}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Demo Usage Data</span>
                </button>
                <button 
                  onClick={() => handleQuickAction('resetData')}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Reset Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <Clock className="w-8 h-8 mr-3 text-blue-600" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-purple-200">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getModeIcon(activity.mode)}</div>
                      <div>
                        <div className="font-semibold text-purple-800">{activity.activity}</div>
                        <div className="text-sm text-purple-600">{activity.mode} • {activity.time}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getModeColor(activity.mode)}`}>
                      {activity.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-6">Weekly Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { mode: 'Story Mode', time: 45, icon: '📚', color: 'bg-blue-500' },
                  { mode: 'Tutor Mode', time: 38, icon: '🧠', color: 'bg-green-500' },
                  { mode: 'Play Mode', time: 32, icon: '🎮', color: 'bg-purple-500' },
                  { mode: 'Language Buddy', time: 25, icon: '🌍', color: 'bg-orange-500' },
                  { mode: 'Bedtime Mode', time: 16, icon: '🌙', color: 'bg-indigo-500' }
                ].map((mode, index) => (
                  <div key={index} className="text-center p-4 bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-gray-200">
                    <div className="text-3xl mb-2">{mode.icon}</div>
                    <div className="font-bold text-purple-800">{mode.mode}</div>
                    <div className="text-2xl font-bold text-purple-600 mb-2">{mode.time}m</div>
                    <div className={`h-2 ${mode.color} rounded-full`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {safetyFeatures.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-green-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-purple-800">{feature.title}</h3>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        feature.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {feature.status === 'active' ? 'Active' : 'Configurable'}
                      </div>
                    </div>
                    <p className="text-purple-600">{feature.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Privacy Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-6">Privacy & Data Protection</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-800">No Data Storage</h4>
                    <p className="text-purple-600">Voice interactions are processed in real-time and not stored on our servers.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-800">Local Processing</h4>
                    <p className="text-purple-600">Speech recognition happens in your browser when possible for maximum privacy.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-800">Content Filtering</h4>
                    <p className="text-purple-600">All AI responses are filtered for age-appropriate, educational content only.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-800">COPPA Compliant</h4>
                    <p className="text-purple-600">Fully compliant with Children's Online Privacy Protection Act requirements.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Time Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <Clock className="w-8 h-8 mr-3 text-blue-600" />
                Time Management
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-purple-700 font-medium mb-2">Daily Time Limit</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="15"
                      max="180"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-purple-800 font-bold text-lg w-16">{timeLimit} min</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl">
                  <p className="text-purple-700">Current limit: <strong>{timeLimit} minutes per day</strong></p>
                  <p className="text-sm text-purple-600 mt-1">The app will remind your child to take breaks and will pause at the daily limit.</p>
                </div>
              </div>
            </div>

            {/* Content Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-green-600" />
                Content Controls
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-purple-700 font-medium mb-3">Content Filtering Level</label>
                  <div className="space-y-2">
                    {[
                      { value: 'strict', label: 'Strict', desc: 'Only basic educational content' },
                      { value: 'moderate', label: 'Moderate', desc: 'Educational + gentle stories & games' },
                      { value: 'relaxed', label: 'Relaxed', desc: 'Full age-appropriate content' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center p-3 bg-green-50 rounded-2xl cursor-pointer hover:bg-green-100 transition-all">
                        <input
                          type="radio"
                          value={option.value}
                          checked={contentFiltering === option.value}
                          onChange={(e) => setContentFiltering(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-purple-800">{option.label}</div>
                          <div className="text-sm text-purple-600">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <Eye className="w-8 h-8 mr-3 text-purple-600" />
                Privacy Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                  <div>
                    <h4 className="font-medium text-purple-800">Voice Recording</h4>
                    <p className="text-sm text-purple-600">Allow temporary voice processing for better interactions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={voiceRecording}
                      onChange={(e) => setVoiceRecording(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                  <div>
                    <h4 className="font-medium text-purple-800">Usage Notifications</h4>
                    <p className="text-sm text-purple-600">Get updates on your child's learning progress</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

                         {/* Save Settings */}
             <div className="text-center">
               <button 
                 onClick={saveSettings}
                 disabled={saving || loading}
                 className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto"
               >
                 {saving ? (
                   <RefreshCw className="w-5 h-5 animate-spin" />
                 ) : (
                   <Save className="w-5 h-5" />
                 )}
                 <span>{saving ? 'Saving...' : 'Save Settings'}</span>
               </button>
             </div>
          </div>
        )}

        {/* Contact & Support */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-purple-200 text-center mt-8">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Need Help or Have Concerns?</h2>
          <p className="text-purple-600 mb-6">
            We're here to ensure your child has the safest and best learning experience possible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
              <div className="text-2xl mb-2">📧</div>
              <div className="font-bold text-purple-800">Email Support</div>
              <div className="text-purple-600">support@murfkiddo.com</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
              <div className="text-2xl mb-2">📞</div>
              <div className="font-bold text-purple-800">Phone Support</div>
              <div className="text-purple-600">1-800-MURF-KIDS</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <div className="text-2xl mb-2">⏰</div>
              <div className="font-bold text-purple-800">Support Hours</div>
              <div className="text-purple-600">Mon-Fri, 9 AM - 6 PM EST</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
