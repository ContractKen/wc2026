export type AlertScope = 'off' | 'my' | 'all'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function permission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied'
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function fireNotification(title: string, body: string, tag: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag, icon: '/favicon.svg' })
  } catch {
    /* some browsers require a service worker for Notification; ignore */
  }
}
