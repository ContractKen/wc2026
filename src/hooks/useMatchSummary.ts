import { useEffect, useRef, useState } from 'react'
import { fetchSummary } from '../lib/espn'
import type { MatchSummary } from '../lib/types'

type Status = 'idle' | 'loading' | 'ok' | 'error'

// Loads a match's key events + commentary. When `live` is true it re-polls so an
// in-progress match's feed stays fresh; otherwise it fetches once.
export function useMatchSummary(eventId: string, enabled: boolean, live: boolean) {
  const [summary, setSummary] = useState<MatchSummary | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!enabled) return

    let timer: ReturnType<typeof setInterval> | undefined
    const run = () => {
      setStatus((s) => (s === 'ok' ? s : 'loading'))
      fetchSummary(eventId)
        .then((s) => {
          if (!mounted.current) return
          setSummary(s)
          setStatus('ok')
        })
        .catch(() => mounted.current && setStatus('error'))
    }
    run()
    if (live) timer = setInterval(run, 30_000)

    return () => {
      mounted.current = false
      if (timer) clearInterval(timer)
    }
  }, [eventId, enabled, live])

  return { summary, status }
}
