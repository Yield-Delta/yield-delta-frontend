import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  
  // User Preferences
  preferredTimeframe: '1h' | '1d' | '7d' | '30d'
  riskTolerance: 'low' | 'medium' | 'high'
  autoRebalance: boolean
  slippageTolerance: number
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: number
    read: boolean
  }>
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setPreferredTimeframe: (timeframe: '1h' | '1d' | '7d' | '30d') => void
  setRiskTolerance: (tolerance: 'low' | 'medium' | 'high') => void
  setAutoRebalance: (enabled: boolean) => void
  setSlippageTolerance: (tolerance: number) => void
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  devtools(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (set, _get) => ({
      // Initial state
      sidebarOpen: false,
      theme: 'dark',
      preferredTimeframe: '1d',
      riskTolerance: 'medium',
      autoRebalance: true,
      slippageTolerance: 0.5,
      notifications: [],
      
      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setPreferredTimeframe: (timeframe) => set({ preferredTimeframe: timeframe }),
      setRiskTolerance: (tolerance) => set({ riskTolerance: tolerance }),
      setAutoRebalance: (enabled) => set({ autoRebalance: enabled }),
      setSlippageTolerance: (tolerance) => set({ slippageTolerance: tolerance }),
      
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
        })),
      
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'app-store',
    }
  )
)