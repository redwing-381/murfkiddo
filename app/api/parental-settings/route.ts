import { NextRequest, NextResponse } from 'next/server'

// In-memory store for parental settings (in production, use a database)
let parentalSettings = {
  timeLimit: 60, // minutes
  contentFiltering: 'moderate', // strict, moderate, relaxed
  voiceRecording: false,
  notifications: true,
  lastUpdated: new Date().toISOString()
}

// In-memory store for activity tracking (in production, use a database)
let recentActivityStore: Array<{
  time: string
  mode: string
  activity: string
  duration: string
  timestamp: Date
}> = []

// Helper function to get real usage data from localStorage (client-side data)
// This simulates what would be database queries in production
function getUsageDataFromClient(request: NextRequest): any {
  // Since we can't access localStorage on server side, we'll return structure for client to fill
  // In production, this would be actual database queries
  return {
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
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    
    // Get usage data (in production this would be from database)
    const usageData = getUsageDataFromClient(request)

    if (type === 'settings') {
      return NextResponse.json({
        success: true,
        settings: parentalSettings
      })
    } else if (type === 'usage') {
      return NextResponse.json({
        success: true,
        usage: usageData,
        needsClientData: true // Flag to indicate client should load from localStorage
      })
    } else if (type === 'activity') {
      return NextResponse.json({
        success: true,
        activity: recentActivityStore,
        needsClientData: true // Flag to indicate client should load from localStorage
      })
    } else {
      // Return everything
      return NextResponse.json({
        success: true,
        settings: parentalSettings,
        usage: usageData,
        activity: recentActivityStore,
        needsClientData: true // Flag to indicate client should load from localStorage
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

    if (action === 'update_settings') {
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
      recentActivityStore.unshift({
        ...activityUpdate,
        timestamp: new Date()
      })

      // Keep only last 10 activities
      recentActivityStore = recentActivityStore.slice(0, 10)

      return NextResponse.json({
        success: true,
        message: 'Activity logged successfully - real tracking handled client-side',
        activity: recentActivityStore
      })
    } else if (action === 'resetData') {
      // Reset server-side activity data (real data is handled client-side)
      recentActivityStore = []

      return NextResponse.json({
        success: true,
        message: 'Server activity data reset - client should clear localStorage',
        clearClientData: true
      })
    } else if (action === 'simulateUsage') {
      // Simulate some usage for demo (populate server-side store)
      const mockActivities = [
        { time: '2:30 PM', mode: 'Story Mode', activity: 'Listened to "The Dragon\'s Secret"', duration: '12 min', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { time: '1:45 PM', mode: 'Tutor Mode', activity: 'Asked "How do flowers bloom?"', duration: '6 min', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { time: '12:15 PM', mode: 'Play Mode', activity: 'Played word association', duration: '8 min', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        { time: '11:30 AM', mode: 'Language Buddy', activity: 'Learned French numbers', duration: '10 min', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
        { time: '10:45 AM', mode: 'Bedtime Mode', activity: 'Listened to a lullaby', duration: '5 min', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      ]

      recentActivityStore = mockActivities

      return NextResponse.json({
        success: true,
        message: 'Demo usage data generated - check client localStorage for real data',
        activity: recentActivityStore,
        simulateDemoData: true
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