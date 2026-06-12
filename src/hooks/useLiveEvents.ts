import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchSummary, type LiveMap } from '../lib/espn'
import type { MatchEvent } from '../lib/types'

export interface StripEvent {
  key: string
  matchId: string
  kind: MatchEvent['kind']
  clock: string
  minute: number
  team: string
  label: string
}

function minuteOf(clock: string): number {
  const m = clock.match(/(\d+)(?:'\+(\d+))?/)
  if (!m) return 0
  return Number(m[1]) + (m[2] ? Number(m[2]) : 0)
}

const SHOWN: MatchEvent['kind'][] = ['goal', 'red', 'penalty-miss']

// For matches currently in play, pulls recent notable events (goals, reds) and
// returns them newest-first for a scrolling strip in the ticker.
export function useLiveEvents(live: LiveMap) {
  const [events, setEvents] = useState<StripEvent[]>([])
  const mounted = useRef(true)

  const liveIds = useMemo(
    () => Object.keys(live).filter((id) => live[id]?.state === 'in'),
    [live],
  )
  const liveKey = liveIds.join(',')

  useEffect(() => {
    mounted.current = true
    if (liveIds.length === 0) {
      setEvents([])
      return
    }
    let timer: ReturnType<typeof setInterval> | undefined

    const pull = async () => {
      const all: StripEvent[] = []
      for (const id of liveIds) {
        try {
          const s = await fetchSummary(id)
          for (const e of s.events) {
            if (!SHOWN.includes(e.kind)) continue
            all.push({
              key: `${id}-${e.id}`,
              matchId: id,
              kind: e.kind,
              clock: e.clock,
              minute: minuteOf(e.clock),
              team: e.team,
              label: e.scorer?.name || e.text,
            })
          }
        } catch {
          /* skip this match this round */
        }
      }
      if (!mounted.current) return
      all.sort((a, b) => b.minute - a.minute)
      setEvents(all.slice(0, 8))
    }

    pull()
    timer = setInterval(pull, 20_000)
    return () => {
      mounted.current = false
      if (timer) clearInterval(timer)
    }
  }, [liveKey])

  return events
}
