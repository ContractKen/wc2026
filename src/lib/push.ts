import { PUSH_API_URL, VAPID_PUBLIC_KEY, pushConfigured } from '../config'

export type PushScope = 'my' | 'all'

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

// True if this device currently has an active push subscription.
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    return !!(await reg.pushManager.getSubscription())
  } catch {
    return false
  }
}

export async function enablePush(scope: PushScope, teams: string[]): Promise<void> {
  if (!pushConfigured()) throw new Error('Background push isn’t configured yet.')
  if (!pushSupported()) throw new Error('This browser doesn’t support push.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notification permission was denied.')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }
  const res = await fetch(`${PUSH_API_URL}/subscribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ subscription: sub, scope, teams }),
  })
  if (!res.ok) throw new Error('Could not register with the push server.')
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  if (pushConfigured()) {
    try {
      await fetch(`${PUSH_API_URL}/unsubscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
    } catch {
      /* best effort */
    }
  }
  await sub.unsubscribe()
}
