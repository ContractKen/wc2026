import { useMemo } from 'react'
import type { Match, Team } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { MatchCard } from './MatchCard'
import { involves } from '../lib/match'
import { zoned } from '../lib/time'
import { downloadICS, matchesToICS } from '../lib/ics'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]

interface Props {
  matches: Match[]
  live: LiveMap
  zone: string
  favorites: Set<string>
  isFav: (code: string) => boolean
  toggleFav: (code: string) => void
}

export function FavoritesView({ matches, live, zone, favorites, isFav, toggleFav }: Props) {
  const favTeams = TEAMS.filter((t) => favorites.has(t.code))

  const myMatches = useMemo(
    () =>
      matches
        .filter((m) => [...favorites].some((code) => involves(m, code, live)))
        .sort((a, b) => a.utc.localeCompare(b.utc)),
    [matches, favorites, live],
  )

  const days = useMemo(() => {
    const map = new Map<string, { heading: string; items: Match[] }>()
    for (const m of myMatches) {
      const t = zoned(m.utc, zone)
      const entry = map.get(t.dayKey) || { heading: t.dayHeading, items: [] }
      entry.items.push(m)
      map.set(t.dayKey, entry)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [myMatches, zone])

  function exportFavorites() {
    downloadICS('wc2026-my-matches.ics', matchesToICS(myMatches, live, 'WC 2026 — My Matches'))
  }
  function exportAll() {
    downloadICS('wc2026-all-matches.ics', matchesToICS(matches, live, 'FIFA World Cup 2026'))
  }

  return (
    <div className="favorites">
      <div className="fav-toolbar">
        <div className="fav-teams">
          {favTeams.length === 0 ? (
            <span className="muted">
              No favorite teams yet — tap the ☆ on any team to pin their matches here.
            </span>
          ) : (
            favTeams.map((t) => (
              <button key={t.code} className="fav-chip" onClick={() => toggleFav(t.code)}>
                <img className="flag flag--sm" src={t.flag} alt="" /> {t.name} ✕
              </button>
            ))
          )}
        </div>
        <div className="fav-actions">
          {myMatches.length > 0 && (
            <button className="btn" onClick={exportFavorites}>
              📅 Export my matches (.ics)
            </button>
          )}
          <button className="btn btn--ghost" onClick={exportAll}>
            📅 Export all 104
          </button>
        </div>
      </div>

      {days.length === 0 && favTeams.length > 0 && (
        <p className="empty">No upcoming matches found for your teams.</p>
      )}

      {days.map(([key, { heading, items }]) => (
        <section className="day" key={key}>
          <h2 className="day__heading">{heading}</h2>
          <div className="day__matches">
            {items.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                live={live[m.id]}
                zone={zone}
                isFav={isFav}
                toggleFav={toggleFav}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
