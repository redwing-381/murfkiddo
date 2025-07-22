import { NextRequest, NextResponse } from 'next/server'

// In a real app, this would be stored in a database
// For now, we'll simulate it with a simple in-memory store
let parentalSettings = {
  timeLimit: 60, // minutes
  contentFiltering: 'moderate', // strict, moderate, relaxed
  voiceRecording: false,
  notifications: true,
  lastUpdated: new Date().toISOString()
}

// Mock usage data - in real app this would come from analytics/database
let usageData = {
  todayMinutes: 23,
  weekTotal: 156,
  favoriteMode: 'Story Mode',
  storiesHeard: 8,
  questionsAsked: 15,
  gamesPlayed: 12,
  languagesExplored: 3,
  bedtimeStories: 5,
  lastActivity: new Date().toISOString()
}

let recentActivity = [
  { time: '2:30 PM', mode: 'Story Mode', activity: 'Listened to "The Magic Garden"', duration: '8 min', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { time: '1:45 PM', mode: 'Tutor Mode', activity: 'Asked "Why do birds fly?"', duration: '5 min', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { time: '12:15 PM', mode: 'Play Mode', activity: 'Played riddles game', duration: '10 min', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { time: '11:30 AM', mode: 'Language Buddy', activity: 'Learned Spanish greetings', duration: '12 min', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) }
]

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')

    if (type === 'settings') {
      return NextResponse.json({
        success: true,
        settings: parentalSettings
      })
    } else if (type === 'usage') {
      return NextResponse.json({
        success: true,
        usage: usageData
      })
    } else if (type === 'activity') {
      return NextResponse.json({
        success: true,
        activity: recentActivity
      })
    } else {
      // Return everything
      return NextResponse.json({
        success: true,
        settings: parentalSettings,
        usage: usageData,
        activity: recentActivity
      })
    }
  } catch (error) {
    console.error('Error fetching parental data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parental data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, settings, activityUpdate } = await request.json()

    if (action === 'updateSettings') {
      // Update settings
      parentalSettings = {
        ...parentalSettings,
        ...settings,
        lastUpdated: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        settings: parentalSettings
      })
    } else if (action === 'addActivity') {
      // Add new activity (would be called by the app when child uses features)
      recentActivity.unshift({
        ...activityUpdate,
        timestamp: new Date()
      })

      // Keep only last 10 activities
      recentActivity = recentActivity.slice(0, 10)

      // Update usage stats
      const durationMinutes = parseInt(activityUpdate.duration.replace(' min', ''))
      usageData.todayMinutes += durationMinutes
      usageData.weekTotal += durationMinutes

      // Update mode-specific counters
      if (activityUpdate.mode === 'Story Mode') {
        usageData.storiesHeard += 1
      } else if (activityUpdate.mode === 'Tutor Mode') {
        usageData.questionsAsked += 1
      } else if (activityUpdate.mode === 'Play Mode') {
        usageData.gamesPlayed += 1
      } else if (activityUpdate.mode === 'Language Buddy') {
        usageData.languagesExplored += 1
      } else if (activityUpdate.mode === 'Bedtime Mode') {
        usageData.bedtimeStories += 1
      }

      return NextResponse.json({
        success: true,
        message: 'Activity logged successfully',
        usage: usageData
      })
    } else if (action === 'resetData') {
      // Reset usage data (for demo purposes)
      usageData = {
        todayMinutes: 0,
        weekTotal: 0,
        favoriteMode: 'Story Mode',
        storiesHeard: 0,
        questionsAsked: 0,
        gamesPlayed: 0,
        languagesExplored: 0,
        bedtimeStories: 0,
        lastActivity: new Date().toISOString()
      }
      recentActivity = []

      return NextResponse.json({
        success: true,
        message: 'Usage data reset successfully',
        usage: usageData
      })
    } else if (action === 'simulateUsage') {
      // Simulate some usage for demo
      const mockActivities = [
        { time: '2:30 PM', mode: 'Story Mode', activity: 'Listened to "The Dragon\'s Secret"', duration: '12 min', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { time: '1:45 PM', mode: 'Tutor Mode', activity: 'Asked "How do flowers bloom?"', duration: '6 min', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { time: '12:15 PM', mode: 'Play Mode', activity: 'Played word association', duration: '8 min', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        { time: '11:30 AM', mode: 'Language Buddy', activity: 'Learned French numbers', duration: '10 min', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
        { time: '10:45 AM', mode: 'Bedtime Mode', activity: 'Listened to a lullaby', duration: '5 min', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      ]

      recentActivity = mockActivities
      usageData = {
        todayMinutes: 41,
        weekTotal: 287,
        favoriteMode: 'Story Mode',
        storiesHeard: 12,
        questionsAsked: 18,
        gamesPlayed: 15,
        languagesExplored: 4,
        bedtimeStories: 7,
        lastActivity: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        message: 'Demo usage data generated',
        usage: usageData,
        activity: recentActivity
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating parental data:', error)
    return NextResponse.json(
      { error: 'Failed to update parental data' },
      { status: 500 }
    )
  }
} 