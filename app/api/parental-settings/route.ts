import { NextRequest, NextResponse } from 'next/server'

// In-memory store for parental settings (now matches frontend structure)
let parentalSettings = {
  maxSessionTime: 30,
  allowedModes: ['Story Mode', 'Tutor Mode', 'Play Mode', 'Language Mode', 'Bedtime Mode'],
  bedtimeSchedule: {
    enabled: false,
    startTime: '20:00',
    endTime: '07:00',
  },
  contentFiltering: {
    level: 'moderate',
  },
  voiceSettings: {
    speed: 1.0,
    volume: 0.8,
  },
  lastUpdated: new Date().toISOString(),
}

interface RecentActivity {
  timestamp: string | Date;
  mode: string;
  duration: number;
  content: string;
}

let recentActivityStore: RecentActivity[] = [];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      settings: parentalSettings,
      activity: recentActivityStore,
      needsClientData: true,
    })
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
      parentalSettings = {
        ...parentalSettings,
        ...settings,
        lastUpdated: new Date().toISOString(),
      }
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        settings: parentalSettings,
      })
    } else if (action === 'addActivity') {
      recentActivityStore.unshift({
        ...activityUpdate,
        timestamp: new Date(),
      })
      recentActivityStore = recentActivityStore.slice(0, 10)
      return NextResponse.json({
        success: true,
        message: 'Activity logged successfully',
        activity: recentActivityStore,
      })
    } else if (action === 'resetData') {
      recentActivityStore = []
      return NextResponse.json({
        success: true,
        message: 'Server activity data reset',
        clearClientData: true,
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