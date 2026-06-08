import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAll, fetchWindow, type LiveMap } from '../lib/espn'

type Status = 'idle' | 'loading' | 'ok' | 'error'

const FAST_MS = 12_000 // while a match is in play
const SLOW_MS = 45_000 // otherwise

function anyLive(map: LiveMap): boolean {
  for (const id in map) if (map[id].state === 'in') return true
  return false
}

// Loads a full tournament snapshot once, then polls a ±1 day window. Polls fast
// (~12s) while a match is live, slow (~45s) otherwise.
export function useLiveScores() {
  const [live, setLive] = useState<LiveMap>({})
  const [status, setStatus] = useState<Status>('idle')
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const mounted = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const liveRef = useRef(false)

  const merge = useCallback((incoming: LiveMap) => {
    if (!mounted.current) return
    setLive((prev) => {
      const next = { ...prev, ...incoming }
      liveRef.current = anyLive(next)
      return next
    })
    setUpdatedAt(Date.now())
  }, [])

  const poll = useCallback(async () => {
    try {
      merge(await fetchWindow(new Date()))
      if (mounted.current) setStatus('ok')
    } catch {
      if (mounted.current) setStatus((s) => (s === 'ok' ? 'ok' : 'error'))
    }
  }, [merge])

  useEffect(() => {
    mounted.current = true
    setStatus('loading')

    const loop = async () => {
      await poll()
      if (!mounted.current) return
      timer.current = setTimeout(loop, liveRef.current ? FAST_MS : SLOW_MS)
    }

    fetchAll()
      .then((all) => {
        merge(all)
        if (mounted.current) setStatus('ok')
      })
      .catch(() => mounted.current && setStatus('error'))
      .finally(() => {
        if (mounted.current) timer.current = setTimeout(loop, liveRef.current ? FAST_MS : SLOW_MS)
      })

    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [merge, poll])

  return { live, status, updatedAt, refresh: poll }
}
