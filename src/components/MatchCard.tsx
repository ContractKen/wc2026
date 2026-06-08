import { useState } from 'react'
import type { LiveState, Match, TeamRef } from '../lib/types'
import { effectiveTeam, hasScore, matchStatus } from '../lib/match'
import { zoned } from '../lib/time'
import { VENUES } from '../data/venues'

interface Props {
  match: Match
  live?: LiveState
  zone: string
  isFav: (code: string) => boolean
  toggleFav: (code: string) => void
}

function Flag({ team }: { team: TeamRef }) {
  if (team.placeholder || !team.flag) {
    return <span className="flag flag--ph" aria-hidden>🏳️</span>
  }
  return <img className="flag" src={team.flag} alt="" loading="lazy" />
}

export function MatchCard({ match, live, zone, isFav, toggleFav }: Props) {
  const [open, setOpen] = useState(false)
  const home = effectiveTeam('home', match, live)
  const away = effectiveTeam('away', match, live)
  const t = zoned(match.utc, zone)
  const status = matchStatus(live)
  const showScore = hasScore(live)
  const venue = match.venueId ? VENUES[match.venueId] : undefined
  const favHome = isFav(home.code)
  const favAway = isFav(away.code)
  const tag = match.stage === 'group' ? `Group ${match.group} · MD${match.matchday}` : match.round

  return (
    <article className={`match status-${status.kind}`}>
      <div className="match__time">
        <div className="match__clock">{t.time}</div>
        <div className={`tod tod--${t.tod.key}`} title={`${t.tod.label} (${zone})`}>
          <span aria-hidden>{t.tod.icon}</span> {t.tod.label}
        </div>
      </div>

      <div className="match__teams">
        <div className={`team ${favHome ? 'team--fav' : ''}`}>
          <button
            className="star"
            onClick={() => !home.placeholder && toggleFav(home.code)}
            disabled={home.placeholder}
            title={favHome ? 'Unfavorite' : 'Favorite'}
            aria-label={`Favorite ${home.name}`}
          >
            {favHome ? '★' : '☆'}
          </button>
          <Flag team={home} />
          <span className="team__name">{home.name}</span>
        </div>
        <div className="team__score-wrap">
          {showScore ? (
            <span className="score">
              {live!.homeScore}<span className="score__sep">–</span>{live!.awayScore}
            </span>
          ) : (
            <span className="vs">vs</span>
          )}
        </div>
        <div className={`team ${favAway ? 'team--fav' : ''}`}>
          <button
            className="star"
            onClick={() => !away.placeholder && toggleFav(away.code)}
            disabled={away.placeholder}
            title={favAway ? 'Unfavorite' : 'Favorite'}
            aria-label={`Favorite ${away.name}`}
          >
            {favAway ? '★' : '☆'}
          </button>
          <Flag team={away} />
          <span className="team__name">{away.name}</span>
        </div>
      </div>

      <div className="match__meta">
        <span className={`badge badge--${status.kind}`}>{status.text}</span>
        <span className="tag">{tag}</span>
        {venue && (
          <button className="venue-link" onClick={() => setOpen((v) => !v)}>
            🏟 {venue.name}, {venue.city} {open ? '▲' : '▼'}
          </button>
        )}
        {match.broadcast.length > 0 && (
          <span className="broadcast">📺 {match.broadcast.join(', ')}</span>
        )}
      </div>

      {open && venue && (
        <div className="venue-tidbit">
          <strong>{venue.name}{venue.altName ? ` · ${venue.altName}` : ''}</strong>
          <span className="venue-cap">Capacity ~{venue.capacity.toLocaleString()}</span>
          <p>{venue.tidbit}</p>
        </div>
      )}
    </article>
  )
}
