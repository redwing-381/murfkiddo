// User preferences and local storage management for MurfKiddo

export interface UserPreferences {
  childName: string
  favoriteVoiceType: 'friendly' | 'cheerful' | 'calm' | 'playful'
  autoPlayAudio: boolean
  preferredLanguage: string
  favoriteGameType: string
  bedtimePreferences: {
    favoriteThings: string
    preferredContentType: string
  }
  accessibilitySettings: {
    highContrast: boolean
    largeText: boolean
    reducedMotion: boolean
    screenReaderMode: boolean
  }
  parentalSettings: {
    timeLimit: number
    contentFiltering: 'strict' | 'moderate' | 'relaxed'
    voiceRecording: boolean
    notifications: boolean
  }
  usage: {
    totalTimeSpent: number
    favoriteMode: string
    lastVisit: string
    streakDays: number
  }
}

export const defaultPreferences: UserPreferences = {
  childName: '',
  favoriteVoiceType: 'friendly',
  autoPlayAudio: true,
  preferredLanguage: 'spanish',
  favoriteGameType: 'riddle',
  bedtimePreferences: {
    favoriteThings: '',
    preferredContentType: 'bedtime_story'
  },
  accessibilitySettings: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderMode: false
  },
  parentalSettings: {
    timeLimit: 60,
    contentFiltering: 'moderate',
    voiceRecording: false,
    notifications: true
  },
  usage: {
    totalTimeSpent: 0,
    favoriteMode: 'Story Mode',
    lastVisit: new Date().toISOString(),
    streakDays: 0
  }
}

class UserPreferencesManager {
  private static readonly STORAGE_KEY = 'murfkiddo_preferences'
  private static readonly DAILY_USAGE_KEY = 'murfkiddo_daily_usage'

  /**
   * Load user preferences from localStorage
   */
  static loadPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return defaultPreferences
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure all properties exist
        return { ...defaultPreferences, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
    }

    return defaultPreferences
  }

  /**
   * Save user preferences to localStorage
   */
  static savePreferences(preferences: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') return

    try {
      const current = this.loadPreferences()
      const updated = { ...current, ...preferences }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }

  /**
   * Update specific preference section
   */
  static updatePreferences<K extends keyof UserPreferences>(
    section: K,
    updates: Partial<UserPreferences[K]>
  ): void {
    const current = this.loadPreferences()
    const currentSection = current[section]
    const updatedSection = typeof currentSection === 'object' && currentSection !== null 
      ? { ...currentSection, ...updates }
      : updates
    this.savePreferences({ [section]: updatedSection } as Partial<UserPreferences>)
  }

  /**
   * Track daily usage
   */
  static trackUsage(mode: string, minutes: number): void {
    if (typeof window === 'undefined') return

    try {
      const today = new Date().toDateString()
      const storedUsage = localStorage.getItem(this.DAILY_USAGE_KEY)
      let dailyUsage: { [date: string]: { [mode: string]: number } } = {}

      if (storedUsage) {
        dailyUsage = JSON.parse(storedUsage)
      }

      if (!dailyUsage[today]) {
        dailyUsage[today] = {}
      }

      if (!dailyUsage[today][mode]) {
        dailyUsage[today][mode] = 0
      }

      dailyUsage[today][mode] += minutes

      // Keep only last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      Object.keys(dailyUsage).forEach(date => {
        if (new Date(date) < thirtyDaysAgo) {
          delete dailyUsage[date]
        }
      })

      localStorage.setItem(this.DAILY_USAGE_KEY, JSON.stringify(dailyUsage))

      // Update user preferences with total time
      const totalTime = Object.values(dailyUsage).reduce((total, dayUsage) => {
        return total + Object.values(dayUsage).reduce((sum, minutes) => sum + minutes, 0)
      }, 0)

      this.updatePreferences('usage', {
        totalTimeSpent: totalTime,
        lastVisit: new Date().toISOString()
      })

    } catch (error) {
      console.warn('Failed to track usage:', error)
    }
  }

  /**
   * Get usage statistics
   */
  static getUsageStats(): {
    todayMinutes: number
    weekMinutes: number
    monthMinutes: number
    favoriteMode: string
  } {
    if (typeof window === 'undefined') {
      return { todayMinutes: 0, weekMinutes: 0, monthMinutes: 0, favoriteMode: 'Story Mode' }
    }

    try {
      const storedUsage = localStorage.getItem(this.DAILY_USAGE_KEY)
      if (!storedUsage) {
        return { todayMinutes: 0, weekMinutes: 0, monthMinutes: 0, favoriteMode: 'Story Mode' }
      }

      const dailyUsage: { [date: string]: { [mode: string]: number } } = JSON.parse(storedUsage)
      const today = new Date()
      const todayStr = today.toDateString()
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)

      let todayMinutes = 0
      let weekMinutes = 0
      let monthMinutes = 0
      const modeUsage: { [mode: string]: number } = {}

      Object.entries(dailyUsage).forEach(([date, dayUsage]) => {
        const dateObj = new Date(date)
        const dayTotal = Object.values(dayUsage).reduce((sum, minutes) => sum + minutes, 0)

        if (date === todayStr) {
          todayMinutes = dayTotal
        }

        if (dateObj >= weekAgo) {
          weekMinutes += dayTotal
        }

        if (dateObj >= monthAgo) {
          monthMinutes += dayTotal
          Object.entries(dayUsage).forEach(([mode, minutes]) => {
            modeUsage[mode] = (modeUsage[mode] || 0) + minutes
          })
        }
      })

      const favoriteMode = Object.entries(modeUsage).reduce((favorite, [mode, minutes]) => {
        return minutes > (modeUsage[favorite] || 0) ? mode : favorite
      }, 'Story Mode')

      return { todayMinutes, weekMinutes, monthMinutes, favoriteMode }
    } catch (error) {
      console.warn('Failed to get usage stats:', error)
      return { todayMinutes: 0, weekMinutes: 0, monthMinutes: 0, favoriteMode: 'Story Mode' }
    }
  }

  /**
   * Clear all stored data (for privacy/reset)
   */
  static clearAllData(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.DAILY_USAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear user data:', error)
    }
  }

  /**
   * Export user data (for backup)
   */
  static exportData(): string {
    if (typeof window === 'undefined') return '{}'

    try {
      const preferences = localStorage.getItem(this.STORAGE_KEY) || '{}'
      const usage = localStorage.getItem(this.DAILY_USAGE_KEY) || '{}'
      
      return JSON.stringify({
        preferences: JSON.parse(preferences),
        usage: JSON.parse(usage),
        exportDate: new Date().toISOString()
      }, null, 2)
    } catch (error) {
      console.warn('Failed to export user data:', error)
      return '{}'
    }
  }

  /**
   * Import user data (from backup)
   */
  static importData(dataString: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      const data = JSON.parse(dataString)
      
      if (data.preferences) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.preferences))
      }
      
      if (data.usage) {
        localStorage.setItem(this.DAILY_USAGE_KEY, JSON.stringify(data.usage))
      }
      
      return true
    } catch (error) {
      console.warn('Failed to import user data:', error)
      return false
    }
  }

  /**
   * Check if user has been away for a while and show welcome back message
   */
  static checkStreakAndWelcome(): { isReturningUser: boolean; daysAway: number; shouldShowWelcome: boolean } {
    const preferences = this.loadPreferences()
    const lastVisit = new Date(preferences.usage.lastVisit)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))

    const isReturningUser = preferences.childName.length > 0
    const shouldShowWelcome = daysDiff > 1 || !isReturningUser

    return {
      isReturningUser,
      daysAway: daysDiff,
      shouldShowWelcome
    }
  }
}

export default UserPreferencesManager 