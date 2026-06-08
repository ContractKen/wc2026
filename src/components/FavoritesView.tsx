import { useMemo, useState } from 'react'
import type { Match, Team } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { MatchCard } from './MatchCard'
import { CountryPicker } from './CountryPicker'
import { involves } from '../lib/match'
import { zoned } from '../lib/time'
import { downloadICS, matchesToICS } from '../lib/ics'
import { sortByRank } from '../data/countryRank'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]

const REMINDER_OPTIONS: { label: string; minutes: number }[] = [
  { label: '1 week before', minutes: 10080 },
  { label: '1 day before', minutes: 1440 },
  { label: '3 hours before', minutes: 180 },
  { label: '1 hour before', minutes: 60 },
  { label: '15 min before', minutes: 15 },
  { label: 'At kickoff', minutes: 0 },
]

interface Props {
  matches: Match[]
  live: LiveMap
  zone: string
  favorites: Set<string>
  isFav: (code: string) => boolean
  toggleFav: (code: string) => void
  setMany: (codes: string[], selected: boolean) => void
}

export function FavoritesView({ matches, live, zone, favorites, isFav, toggleFav, setMany }: Props) {
  const [pickerOpen, setPickerOpen] = useState(favorites.size === 0)
  const [alarms, setAlarms] = useState<number[]>([1440, 60]) // 1 day + 1 hour by default

  const favTeams = useMemo(() => sortByRank(TEAMS.filter((t) => favorites.has(t.code))), [favorites])

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

  function toggleAlarm(min: number) {
    setAlarms((prev) => (prev.includes(min) ? prev.filter((m) => m !== min) : [...prev, min]))
  }

  function exportFavorites() {
    downloadICS(
      'wc2026-my-matches.ics',
      matchesToICS(myMatches, live, { label: 'WC 2026 — My Countries', alarms }),
    )
  }
  function exportAll() {
    downloadICS(
      'wc2026-all-matches.ics',
      matchesToICS(matches, live, { label: 'FIFA World Cup 2026', alarms }),
    )
  }

  return (
    <div className="favorites">
      {/* Selected countries + picker toggle */}
      <div className="fav-toolbar">
        <div className="fav-teams">
          {favTeams.length === 0 ? (
            <span className="muted">
              Pick the countries you want to follow — their matches and reminders go here.
            </span>
          ) : (
            favTeams.map((t) => (
              <button key={t.code} className="fav-chip" onClick={() => toggleFav(t.code)} title="Remove">
                <img className="flag flag--sm" src={t.flag} alt="" /> {t.name} ✕
              </button>
            ))
          )}
        </div>
        <button className="btn btn--ghost" onClick={() => setPickerOpen((v) => !v)}>
          {pickerOpen ? 'Done choosing' : `＋ Choose countries`}
        </button>
      </div>

      {pickerOpen && (
        <CountryPicker teams={TEAMS} isSelected={isFav} onToggle={toggleFav} onSelectMany={setMany} />
      )}

      {/* Reminders + calendar export */}
      <div className="reminders">
        <div className="reminders__row">
          <span className="reminders__label">⏰ Remind me</span>
          {REMINDER_OPTIONS.map((o) => (
            <label key={o.minutes} className={`pill-check ${alarms.includes(o.minutes) ? 'pill-check--on' : ''}`}>
              <input type="checkbox" checked={alarms.includes(o.minutes)} onChange={() => toggleAlarm(o.minutes)} />
              {o.label}
            </label>
          ))}
        </div>
        <div className="reminders__actions">
          <button className="btn" disabled={myMatches.length === 0} onClick={exportFavorites}>
            📅 Add my countries’ matches ({myMatches.length})
          </button>
          <button className="btn btn--ghost" onClick={exportAll}>
            📅 Add all 104 matches
          </button>
        </div>
        <p className="reminders__hint">
          Downloads an <code>.ics</code> file with {alarms.length || 'no'} reminder
          {alarms.length === 1 ? '' : 's'} per match. Open it to import into Google, Apple, or Outlook
          Calendar — reminders come along automatically.
        </p>
      </div>

      {favTeams.length > 0 && days.length === 0 && (
        <p className="empty">No upcoming matches found for your countries.</p>
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
