import { useAppStore } from '@/stores/appStore'
import { useCallback } from 'react'

export const useNotifications = () => {
  const {
    notifications,
    addNotification,
    markNotificationRead,
    clearNotifications,
  } = useAppStore()

  const notifySuccess = useCallback((title: string, message: string) => {
    addNotification({
      type: 'success',
      title,
      message,
    })
  }, [addNotification])

  const notifyError = useCallback((title: string, message: string) => {
    addNotification({
      type: 'error',
      title,
      message,
    })
  }, [addNotification])

  const notifyWarning = useCallback((title: string, message: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
    })
  }, [addNotification])

  const notifyInfo = useCallback((title: string, message: string) => {
    addNotification({
      type: 'info',
      title,
      message,
    })
  }, [addNotification])

  const unreadCount = notifications.filter(n => !n.read).length
  const recentNotifications = notifications.slice(0, 5)

  return {
    notifications,
    recentNotifications,
    unreadCount,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    markAsRead: markNotificationRead,
    clearAll: clearNotifications,
  }
}