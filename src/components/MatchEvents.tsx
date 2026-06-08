import { useMatchSummary } from '../hooks/useMatchSummary'
import type { MatchEvent } from '../lib/types'

interface Props {
  eventId: string
  live: boolean
  enabled: boolean
}

const ICON: Record<MatchEvent['kind'], string> = {
  goal: '⚽',
  yellow: '🟨',
  red: '🟥',
  sub: '🔁',
  var: '📺',
  'penalty-miss': '❌',
  whistle: '⏱️',
  other: '•',
}

export function MatchEvents({ eventId, live, enabled }: Props) {
  const { summary, status } = useMatchSummary(eventId, enabled, live)

  if (status === 'loading' && !summary) return <p className="ev-loading">Loading commentary…</p>
  if (status === 'error' && !summary) return <p className="ev-loading">Commentary unavailable.</p>
  if (!summary) return null

  const events = [...summary.events].reverse() // newest first
  const commentary = [...summary.commentary].sort((a, b) => b.sequence - a.sequence).slice(0, 14)

  if (events.length === 0 && commentary.length === 0) {
    return <p className="ev-loading">No commentary yet — check back after kickoff.</p>
  }

  return (
    <div className="events">
      {events.length > 0 && (
        <div className="events__col">
          <h4 className="events__title">Key events</h4>
          <ul className="ev-list">
            {events.map((e) => (
              <li key={e.id} className={`ev ev--${e.kind} ${e.kind === 'goal' ? 'ev--big' : ''}`}>
                <span className="ev__clock">{e.clock || `${e.period}H`}</span>
                <span className="ev__icon" aria-hidden>{ICON[e.kind]}</span>
                <span className="ev__text">{e.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {commentary.length > 0 && (
        <div className="events__col">
          <h4 className="events__title">
            Commentary {live && <span className="ev-live-dot" aria-label="live" />}
          </h4>
          <ul className="ev-list ev-list--comm">
            {commentary.map((c) => (
              <li key={c.sequence} className="ev ev--comm">
                {c.clock && <span className="ev__clock">{c.clock}</span>}
                <span className="ev__text">{c.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
