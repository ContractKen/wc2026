import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchSummary, type LiveMap } from '../lib/espn'
import { aggregateScorers, extractGoals } from '../lib/scorers'
import { KEYS, load, save } from '../lib/storage'
import type { Goal } from '../lib/types'

type Cache = Record<string, Goal[]>

// Builds the Golden Boot leaderboard by fetching each finished match's summary
// exactly once, caching the extracted goals (tiny) in localStorage. Finished
// matches never change, so this trickles in and never re-fetches.
export function useTopScorers(live: LiveMap) {
  const [cache, setCache] = useState<Cache>(() => load<Cache>(KEYS.goalsCache, {}))
  const [pending, setPending] = useState(0)
  const processing = useRef<Set<string>>(new Set())

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

    // Fetch sequentially to stay gentle on the unofficial API.
    ;(async () => {
      for (const id of missing) {
        try {
          const summary = await fetchSummary(id)
          const goals = extractGoals(id, summary)
          if (cancelled) return
          setCache((prev) => {
            const next = { ...prev, [id]: goals }
            save(KEYS.goalsCache, next)
            return next
          })
        } catch {
          /* leave it un-cached; we'll retry on a later render */
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

  const scorers = useMemo(() => aggregateScorers(Object.values(cache).flat()), [cache])
  return { scorers, loading: pending > 0, matchesCounted: Object.keys(cache).length }
}
