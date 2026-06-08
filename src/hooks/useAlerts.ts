import { useEffect, useRef } from 'react'
import type { Match } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { effectiveTeam, involves } from '../lib/match'
import { fireNotification } from '../lib/alerts'
import type { AlertScope } from '../lib/alerts'

// Watches the live map for transitions and fires foreground notifications:
// kickoff, goals, and full-time. Scope limits which matches alert.
export function useAlerts(
  live: LiveMap,
  matches: Match[],
  favorites: Set<string>,
  scope: AlertScope,
) {
  const prev = useRef<LiveMap>({})
  const byId = useRef(new Map<string, Match>())
  byId.current = new Map(matches.map((m) => [m.id, m]))

  useEffect(() => {
    if (scope === 'off') {
      prev.current = live
      return
    }
    for (const id of Object.keys(live)) {
      const cur = live[id]
      const old = prev.current[id]
      if (!old) continue
      const m = byId.current.get(id)
      if (!m) continue

      const inScope =
        scope === 'all' || [...favorites].some((code) => involves(m, code, live))
      if (!inScope) continue

      const home = effectiveTeam('home', m, cur)
      const away = effectiveTeam('away', m, cur)
      const tag = `m-${id}`

      if (old.state === 'pre' && cur.state === 'in') {
        fireNotification('Kick-off! ⚽', `${home.name} vs ${away.name} has started`, tag)
      }
      if (
        cur.homeScore != null &&
        cur.awayScore != null &&
        old.homeScore != null &&
        old.awayScore != null &&
        (cur.homeScore > old.homeScore || cur.awayScore > old.awayScore)
      ) {
        const scorer = cur.homeScore > old.homeScore ? home.name : away.name
        fireNotification(
          `GOAL! ${scorer} ⚽`,
          `${home.name} ${cur.homeScore}–${cur.awayScore} ${away.name}`,
          tag,
        )
      }
      if (old.state !== 'post' && cur.state === 'post') {
        fireNotification(
          'Full time',
          `${home.name} ${cur.homeScore ?? ''}–${cur.awayScore ?? ''} ${away.name}`,
          tag,
        )
      }
    }
    prev.current = live
  }, [live, scope, favorites])
}
