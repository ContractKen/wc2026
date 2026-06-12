// Minimal offline cache. Same-origin GETs use stale-while-revalidate so the app
// shell + bundled schedule work offline after the first visit. Cross-origin
// requests (ESPN live data) always go to the network — scores must stay fresh,
// and the app already falls back to its bundled schedule when offline.
const CACHE = 'wc2026-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // let ESPN/cross-origin pass through

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})

// ---- Web Push (background alerts) ----
// The Cloudflare Worker sends a JSON payload: { title, body, tag, url }.
self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data ? e.data.json() : {}
  } catch {
    data = { title: 'World Cup 2026', body: e.data ? e.data.text() : '' }
  }
  const title = data.title || 'World Cup 2026'
  e.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag || 'wc2026',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { url: data.url || './' },
      renotify: true,
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = (e.notification.data && e.notification.data.url) || './'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.navigate(target).catch(() => {})
          return c.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
