import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchSummary, type LiveMap } from '../lib/espn'
import { aggregateKeepers, aggregateScorers, extractMatchStats } from '../lib/scorers'
import { KEYS, load, save } from '../lib/storage'
import type { MatchStats } from '../lib/types'

type Cache = Record<string, MatchStats>

// Builds tournament award data (Golden Boot scorers + Golden Glove keepers) by
// fetching each finished match's summary exactly once and caching the extracted
// stats (tiny) in localStorage. Finished matches never change, so this never
// re-fetches.
export function useTournamentStats(live: LiveMap) {
  const [cache, setCache] = useState<Cache>(() => load<Cache>(KEYS.matchStats, {}))
  const [pending, setPending] = useState(0)
  const processing = useRef<Set<string>>(new Set())
  const liveRef = useRef(live)
  liveRef.current = live

  const completedIds = useMemo(
    () => Object.keys(live).filter((id) => live[id]?.completed),
    [live],
  )

  useEffect(() => {
    let cancelled = false
    const missing = completedIds.filter((id) => !cache[id] && !processing.current.has(id))
    if (missing.length === 0) return
    missing.forEach((id) => processing.current.add(id))
    setPending((n) => n + missing.length)

    ;(async () => {
      for (const id of missing) {
        try {
          const summary = await fetchSummary(id)
          const stats = extractMatchStats(id, summary, liveRef.current[id])
          if (cancelled) return
          setCache((prev) => {
            const next = { ...prev, [id]: stats }
            save(KEYS.matchStats, next)
            return next
          })
        } catch {
          processing.current.delete(id)
        } finally {
          if (!cancelled) setPending((n) => Math.max(0, n - 1))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [completedIds, cache])

  const all = useMemo(() => Object.values(cache), [cache])
  const scorers = useMemo(() => aggregateScorers(all.flatMap((m) => m.goals)), [all])
  const keepers = useMemo(() => aggregateKeepers(all.flatMap((m) => m.keepers)), [all])

  return { scorers, keepers, loading: pending > 0, matchesCounted: all.length }
}
