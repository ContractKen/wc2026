import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAll, fetchWindow, type LiveMap } from '../lib/espn'

type Status = 'idle' | 'loading' | 'ok' | 'error'

const POLL_MS = 45_000

// Loads a full tournament snapshot once, then polls a ±1 day window so live
// scores/statuses refresh without re-downloading everything each time.
export function useLiveScores() {
  const [live, setLive] = useState<LiveMap>({})
  const [status, setStatus] = useState<Status>('idle')
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const mounted = useRef(true)

  const merge = useCallback((incoming: LiveMap) => {
    if (!mounted.current) return
    setLive((prev) => ({ ...prev, ...incoming }))
    setUpdatedAt(Date.now())
  }, [])

  const poll = useCallback(async () => {
    try {
      const win = await fetchWindow(new Date())
      merge(win)
      if (mounted.current) setStatus('ok')
    } catch {
      if (mounted.current) setStatus((s) => (s === 'ok' ? 'ok' : 'error'))
    }
  }, [merge])

  useEffect(() => {
    mounted.current = true
    setStatus('loading')
    fetchAll()
      .then((all) => {
        merge(all)
        if (mounted.current) setStatus('ok')
      })
      .catch(() => mounted.current && setStatus('error'))

    const id = setInterval(poll, POLL_MS)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [merge, poll])

  return { live, status, updatedAt, refresh: poll }
}
