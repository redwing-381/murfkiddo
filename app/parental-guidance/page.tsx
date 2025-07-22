"use client"

import { useState } from "react"
import { Shield, Eye, Volume2, Clock, Users, Heart, Settings, BarChart3, BookOpen, Brain, Gamepad2, Globe, Moon, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ParentalGuidance() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'safety' | 'settings' | 'activity'>('dashboard')
  const [timeLimit, setTimeLimit] = useState(60) // minutes
  const [contentFiltering, setContentFiltering] = useState('moderate')
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // Mock data for demonstration - in real app this would come from backend
  const usageStats = {
    todayMinutes: 23,
    weekTotal: 156,
    favoriteMode: 'Story Mode',
    storiesHeard: 8,
    questionsAsked: 15,
    gamesPlayed: 12,
    languagesExplored: 3,
    bedtimeStories: 5
  }

  const recentActivity = [
    { time: '2:30 PM', mode: 'Story Mode', activity: 'Listened to "The Magic Garden"', duration: '8 min' },
    { time: '1:45 PM', mode: 'Tutor Mode', activity: 'Asked "Why do birds fly?"', duration: '5 min' },
    { time: '12:15 PM', mode: 'Play Mode', activity: 'Played riddles game', duration: '10 min' },
    { time: '11:30 AM', mode: 'Language Buddy', activity: 'Learned Spanish greetings', duration: '12 min' }
  ]

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

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-green-200 mb-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
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
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-blue-200 text-center">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-800">{usageStats.todayMinutes} min</div>
                <div className="text-purple-600">Today</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-green-200 text-center">
                <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-800">{usageStats.weekTotal} min</div>
                <div className="text-purple-600">This Week</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-purple-200 text-center">
                <Heart className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <div className="text-lg font-bold text-purple-800">{usageStats.favoriteMode}</div>
                <div className="text-purple-600">Favorite Mode</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-orange-200 text-center">
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
              <h2 className="text-2xl font-bold text-purple-800 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all">
                  Set Time Limit
                </button>
                <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all">
                  Review Content
                </button>
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all">
                  Safety Check
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
              <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all">
                Save Settings
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
