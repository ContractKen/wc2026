import { useEffect, useRef, useState } from 'react'
import type { FollowedPlayer, LiveState, Match, TeamRef } from '../lib/types'
import { effectiveTeam, hasScore, isFinal, isLive, matchStatus } from '../lib/match'
import { zoned } from '../lib/time'
import { VENUES } from '../data/venues'
import { MatchDetail } from './MatchDetail'
import { watchOptions, type Region } from '../data/broadcasts'
import { shareUrl } from '../lib/url'
import { gradePrediction, type Prediction } from '../lib/predictions'

// Shared per-card handlers/state, bundled so views can forward them in one prop.
export interface MatchCardCommon {
  region: Region
  isFav: (code: string) => boolean
  toggleFav: (code: string) => void
  isFollowed: (id: string) => boolean
  toggleFollow: (p: FollowedPlayer) => void
  followedNames: Set<string>
  getPrediction: (matchId: string) => Prediction | undefined
  setPrediction: (matchId: string, home: number, away: number) => void
}

type Props = MatchCardCommon & {
  match: Match
  live?: LiveState
  zone: string
  highlight?: boolean
}

function Flag({ team }: { team: TeamRef }) {
  if (team.placeholder || !team.flag) {
    return <span className="flag flag--ph" aria-hidden>🏳️</span>
  }
  return <img className="flag" src={team.flag} alt="" loading="lazy" />
}

export function MatchCard({
  match, live, zone, region, isFav, toggleFav, isFollowed, toggleFollow, followedNames,
  getPrediction, setPrediction, highlight,
}: Props) {
  const [open, setOpen] = useState(false)
  const [showDetail, setShowDetail] = useState(!!highlight)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const pred = getPrediction(match.id)
  const [ph, setPh] = useState(pred?.home != null ? String(pred.home) : '')
  const [pa, setPa] = useState(pred?.away != null ? String(pred.away) : '')
  function savePred(h: string, a: string) {
    setPh(h); setPa(a)
    const hn = parseInt(h, 10), an = parseInt(a, 10)
    if (hn >= 0 && an >= 0 && hn <= 20 && an <= 20) setPrediction(match.id, hn, an)
  }

  const live_ = isLive(live)
  const hasDetail = live_ || isFinal(live)
  const home = effectiveTeam('home', match, live)
  const away = effectiveTeam('away', match, live)
  const t = zoned(match.utc, zone)
  const status = matchStatus(live)
  const showScore = hasScore(live)
  const venue = match.venueId ? VENUES[match.venueId] : undefined
  const favHome = isFav(home.code)
  const favAway = isFav(away.code)
  const tag = match.stage === 'group' ? `Group ${match.group} · MD${match.matchday}` : match.round
  const watch = watchOptions(region, match.broadcast)
  const canPredict = status.kind === 'scheduled' && !home.placeholder && !away.placeholder
  const predResult = pred ? gradePrediction(pred, live) : null
  const mapsUrl = venue
    ? `https://www.google.com/maps/search/${encodeURIComponent(`${venue.name} ${venue.city}`)}`
    : ''

  useEffect(() => {
    if (highlight && ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlight])

  function share() {
    const url = shareUrl(match.id)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
    }
  }

  return (
    <article ref={ref} className={`match status-${status.kind} ${highlight ? 'match--hl' : ''}`}>
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
            aria-label={`${favHome ? 'Unfollow' : 'Follow'} ${home.name}`}
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
            aria-label={`${favAway ? 'Unfollow' : 'Follow'} ${away.name}`}
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
          <button className="venue-link" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            🏟 {venue.name}, {venue.city} {open ? '▲' : '▼'}
          </button>
        )}
        {hasDetail && (
          <button
            className={`venue-link commentary-link ${live_ ? 'commentary-link--live' : ''}`}
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
          >
            💬 {live_ ? 'Live details' : 'Details'} {showDetail ? '▲' : '▼'}
          </button>
        )}
        <button className="venue-link" onClick={share} aria-label="Copy share link">
          {copied ? '✓ Copied' : '🔗 Share'}
        </button>
        <span className="watch" title="Official broadcasters — availability/4K indicative for 2026">
          📺
          {watch.map((b) => (
            <a
              key={b.name}
              className="watch__link"
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              title={b.note || b.name}
            >
              {b.name}
              {b.free && <span className="wbadge wbadge--free">FREE</span>}
              {b.uhd && <span className="wbadge wbadge--uhd">4K</span>}
              {!b.free && <span className="wbadge wbadge--sub">$</span>}
            </a>
          ))}
        </span>
      </div>

      {canPredict && (
        <div className="predict">
          <span className="predict__label">🔮 Predict</span>
          <span className="predict__code">{home.code}</span>
          <input className="predict__in" type="number" min="0" max="20" inputMode="numeric"
            value={ph} onChange={(e) => savePred(e.target.value, pa)} aria-label={`${home.name} score`} />
          <span className="predict__dash">–</span>
          <input className="predict__in" type="number" min="0" max="20" inputMode="numeric"
            value={pa} onChange={(e) => savePred(ph, e.target.value)} aria-label={`${away.name} score`} />
          <span className="predict__code">{away.code}</span>
          {pred && <span className="predict__saved">saved ✓</span>}
        </div>
      )}
      {pred && predResult && (
        <div className={`predict-result predict-result--${predResult}`}>
          🔮 You predicted {pred.home}–{pred.away} ·{' '}
          {predResult === 'exact' ? 'Exact score! +3' : predResult === 'result' ? 'Right result +1' : 'Missed'}
        </div>
      )}

      {open && venue && (
        <div className="venue-tidbit">
          <strong>{venue.name}{venue.altName ? ` · ${venue.altName}` : ''}</strong>
          <span className="venue-cap">Capacity ~{venue.capacity.toLocaleString()}</span>
          <p>{venue.tidbit}</p>
          <a className="venue-map" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            📍 View on map
          </a>
        </div>
      )}

      {showDetail && hasDetail && (
        <MatchDetail
          eventId={match.id}
          live={live_}
          enabled={showDetail}
          homeCode={home.code}
          awayCode={away.code}
          isFollowed={isFollowed}
          onToggleFollow={toggleFollow}
          followedNames={followedNames}
        />
      )}
    </article>
  )
}
