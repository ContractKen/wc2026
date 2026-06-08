import { useMemo, useState } from 'react'
import type { Match } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { MatchCard, type MatchCardCommon } from './MatchCard'
import { effectiveTeam, isFinal, isLive, isToday } from '../lib/match'
import { zoned } from '../lib/time'

interface Props {
  matches: Match[]
  live: LiveMap
  zone: string
  now: Date
  card: MatchCardCommon
  openMatchId?: string | null
}

type Quick = 'all' | 'today' | 'live' | 'upcoming' | 'finished'

const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('')

export function ScheduleView({ matches, live, zone, now, card, openMatchId }: Props) {
  const [quick, setQuick] = useState<Quick>('all')
  const [group, setGroup] = useState<string>('all')
  const [stage, setStage] = useState<string>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return matches.filter((m) => {
      const ls = live[m.id]
      if (quick === 'live' && !isLive(ls)) return false
      if (quick === 'today' && !isToday(m, now)) return false
      if (quick === 'upcoming' && !(new Date(m.utc).getTime() > now.getTime() && !isLive(ls)))
        return false
      if (quick === 'finished' && !isFinal(ls)) return false
      if (group !== 'all' && m.group !== group) return false
      if (stage === 'group' && m.stage !== 'group') return false
      if (stage === 'knockout' && m.stage !== 'knockout') return false
      if (q) {
        const home = effectiveTeam('home', m, ls)
        const away = effectiveTeam('away', m, ls)
        const hay = `${home.name} ${away.name} ${m.venue ?? ''} ${m.city ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [matches, live, quick, group, stage, query, now])

  // Group by local calendar day.
  const days = useMemo(() => {
    const map = new Map<string, { heading: string; items: Match[] }>()
    for (const m of filtered) {
      const t = zoned(m.utc, zone)
      const entry = map.get(t.dayKey) || { heading: t.dayHeading, items: [] }
      entry.items.push(m)
      map.set(t.dayKey, entry)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered, zone])

  const quicks: { id: Quick; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'live', label: 'Live' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'finished', label: 'Finished' },
  ]

  return (
    <div className="schedule">
      <div className="filters">
        <div className="chips">
          {quicks.map((q) => (
            <button
              key={q.id}
              className={`chip ${quick === q.id ? 'chip--on' : ''}`}
              onClick={() => setQuick(q.id)}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="filters__selects">
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="all">All stages</option>
            <option value="group">Group stage</option>
            <option value="knockout">Knockouts</option>
          </select>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="all">All groups</option>
            {GROUP_LETTERS.map((g) => (
              <option key={g} value={g}>
                Group {g}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search team, venue…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <p className="result-count">{filtered.length} match{filtered.length === 1 ? '' : 'es'}</p>

      {days.length === 0 && <p className="empty">No matches match these filters.</p>}

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
                highlight={openMatchId === m.id}
                {...card}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
