import type { Match } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { effectiveTeam, isLive, hasScore } from '../lib/match'
import { countdown, zoned } from '../lib/time'
import { useLiveEvents } from '../hooks/useLiveEvents'

interface Props {
  matches: Match[]
  live: LiveMap
  zone: string
  now: Date
}

const EV_ICON: Record<string, string> = { goal: '⚽', red: '🟥', 'penalty-miss': '❌' }

export function LiveTicker({ matches, live, zone, now }: Props) {
  const liveMatches = matches.filter((m) => isLive(live[m.id]))
  const events = useLiveEvents(live)

  if (liveMatches.length > 0) {
    return (
      <div className="ticker-wrap">
        <div className="ticker ticker--live" role="status" aria-live="polite" aria-label="Live matches">
          <span className="ticker__pill">● LIVE</span>
          <div className="ticker__track">
            {liveMatches.map((m) => {
              const ls = live[m.id]
              const home = effectiveTeam('home', m, ls)
              const away = effectiveTeam('away', m, ls)
              return (
                <span className="ticker__item" key={m.id}>
                  <b>{home.code}</b>{' '}
                  {hasScore(ls) ? `${ls.homeScore}–${ls.awayScore}` : 'vs'}{' '}
                  <b>{away.code}</b>
                  <em className="ticker__clock">{ls?.clock}</em>
                </span>
              )
            })}
          </div>
        </div>
        {events.length > 0 && (
          <div className="evstrip" aria-live="polite">
            <span className="evstrip__label">Latest</span>
            <div className="evstrip__track">
              {events.map((e) => (
                <span className="evstrip__item" key={e.key}>
                  <span aria-hidden>{EV_ICON[e.kind] || '•'}</span> {e.clock}{' '}
                  <b>{e.label}</b>
                  {e.team && <em> ({e.team})</em>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // No live matches — show a countdown to the next kickoff.
  const next = matches
    .filter((m) => new Date(m.utc).getTime() > now.getTime())
    .sort((a, b) => a.utc.localeCompare(b.utc))[0]

  if (!next) {
    return (
      <div className="ticker ticker--idle">
        <span className="ticker__pill ticker__pill--done">🏆 Tournament complete</span>
      </div>
    )
  }

  const home = effectiveTeam('home', next, live[next.id])
  const away = effectiveTeam('away', next, live[next.id])
  const t = zoned(next.utc, zone)
  return (
    <div className="ticker ticker--next">
      <span className="ticker__pill ticker__pill--next">NEXT KICKOFF</span>
      <div className="ticker__track">
        <span className="ticker__item">
          <b>{home.name}</b> vs <b>{away.name}</b>
          <em className="ticker__clock">
            {t.dayHeading} · {t.time} · {countdown(next.utc, now)}
          </em>
        </span>
      </div>
    </div>
  )
}
