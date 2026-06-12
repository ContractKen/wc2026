import { useMemo, useState } from 'react'
import { useMatchSummary } from '../hooks/useMatchSummary'
import { usePlayerModal } from './PlayerModal'
import type { FollowedPlayer, Lineup, MatchEvent, TeamStats } from '../lib/types'

interface Props {
  eventId: string
  live: boolean
  enabled: boolean
  homeCode: string
  awayCode: string
  isFollowed: (id: string) => boolean
  onToggleFollow: (p: FollowedPlayer) => void
  followedNames: Set<string>
}

const ICON: Record<MatchEvent['kind'], string> = {
  goal: '⚽', yellow: '🟨', red: '🟥', sub: '🔁', var: '📺',
  'penalty-miss': '❌', whistle: '⏱️', other: '•',
}

// Stats to surface, in order, with friendly labels. (% stats render 0–100.)
const STAT_ROWS: { name: string; label: string; pct?: boolean }[] = [
  { name: 'possessionPct', label: 'Possession', pct: true },
  { name: 'totalShots', label: 'Shots' },
  { name: 'shotsOnTarget', label: 'On target' },
  { name: 'wonCorners', label: 'Corners' },
  { name: 'foulsCommitted', label: 'Fouls' },
  { name: 'yellowCards', label: 'Yellow cards' },
  { name: 'offsides', label: 'Offsides' },
  { name: 'saves', label: 'Saves' },
]

type Sub = 'events' | 'lineups' | 'stats' | 'h2h'

function highlight(text: string, names: Set<string>): boolean {
  if (names.size === 0) return false
  const lower = text.toLowerCase()
  for (const n of names) if (n && lower.includes(n)) return true
  return false
}

function statVal(s: TeamStats | undefined, name: string): number {
  const v = s?.stats.find((x) => x.name === name)?.value
  const n = v == null ? 0 : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function LineupCol({
  lineup, teamCode, isFollowed, onToggleFollow,
}: {
  lineup: Lineup
  teamCode: string
  isFollowed: (id: string) => boolean
  onToggleFollow: (p: FollowedPlayer) => void
}) {
  const { openPlayer } = usePlayerModal()
  const starters = lineup.players.filter((p) => p.starter)
  const subs = lineup.players.filter((p) => !p.starter)
  const render = (p: Lineup['players'][number]) => (
    <li key={p.id || p.name} className="lp">
      <span className="lp__num">{p.jersey}</span>
      <span className="lp__name">
        {p.id ? (
          <button className="linklike" onClick={() => openPlayer({ id: p.id, name: p.name, teamCode })}>
            {p.name}
          </button>
        ) : (
          p.name
        )}
        {p.subbedOut && <span className="lp__so" title="Subbed off"> ↓</span>}
        {p.subbedIn && <span className="lp__si" title="Subbed on"> ↑</span>}
      </span>
      <span className="lp__pos">{p.pos}</span>
      {p.id && (
        <button
          className="star star--sm"
          onClick={() => onToggleFollow({ id: p.id, name: p.name, teamCode })}
          aria-label={`Follow ${p.name}`}
        >
          {isFollowed(p.id) ? '★' : '☆'}
        </button>
      )}
    </li>
  )
  return (
    <div className="lineup">
      <div className="lineup__head">
        <strong>{lineup.teamName}</strong>
        {lineup.formation && <span className="lineup__form">{lineup.formation}</span>}
      </div>
      <ul className="lp-list">{starters.map(render)}</ul>
      {subs.length > 0 && (
        <>
          <div className="lineup__subs">Substitutes</div>
          <ul className="lp-list lp-list--subs">{subs.map(render)}</ul>
        </>
      )}
    </div>
  )
}

export function MatchDetail({
  eventId, live, enabled, homeCode, awayCode, isFollowed, onToggleFollow, followedNames,
}: Props) {
  const { summary, status } = useMatchSummary(eventId, enabled, live)
  const [sub, setSub] = useState<Sub>('events')

  const home = useMemo(() => summary?.stats.find((s) => s.homeAway === 'home'), [summary])
  const away = useMemo(() => summary?.stats.find((s) => s.homeAway === 'away'), [summary])

  if (status === 'loading' && !summary) return <p className="ev-loading">Loading match details…</p>
  if (status === 'error' && !summary) return <p className="ev-loading">Details unavailable.</p>
  if (!summary) return null

  const events = [...summary.events].reverse()
  const commentary = [...summary.commentary].sort((a, b) => b.sequence - a.sequence).slice(0, 14)
  const hasLineups = summary.lineups.length > 0
  const hasStats = (home?.stats.length ?? 0) > 0
  const hasH2H = summary.h2h.length > 0
  const empty = events.length === 0 && commentary.length === 0 && !hasLineups && !hasStats && !hasH2H
  if (empty) return <p className="ev-loading">No match details yet — check back after kickoff.</p>

  const allTabs: { id: Sub; label: string; show: boolean }[] = [
    { id: 'events', label: 'Events', show: events.length > 0 || commentary.length > 0 },
    { id: 'lineups', label: 'Lineups', show: hasLineups },
    { id: 'stats', label: 'Stats', show: hasStats },
    { id: 'h2h', label: 'H2H', show: hasH2H },
  ]
  const tabs = allTabs.filter((t) => t.show)
  const active = tabs.some((t) => t.id === sub) ? sub : tabs[0]?.id

  return (
    <div className="mdetail">
      <div className="mdetail__tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`mdetail__tab ${active === t.id ? 'mdetail__tab--on' : ''}`}
            onClick={() => setSub(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'events' && (
        <div className="events">
          {events.length > 0 && (
            <div className="events__col">
              <h4 className="events__title">Key events</h4>
              <ul className="ev-list">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className={`ev ev--${e.kind} ${e.kind === 'goal' ? 'ev--big' : ''} ${
                      highlight(e.text, followedNames) ? 'ev--followed' : ''
                    }`}
                  >
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
                  <li key={c.sequence} className={`ev ev--comm ${highlight(c.text, followedNames) ? 'ev--followed' : ''}`}>
                    {c.clock && <span className="ev__clock">{c.clock}</span>}
                    <span className="ev__text">{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {active === 'lineups' && (
        <div className="lineups">
          {summary.lineups.map((l) => (
            <LineupCol
              key={l.homeAway}
              lineup={l}
              teamCode={l.homeAway === 'home' ? homeCode : awayCode}
              isFollowed={isFollowed}
              onToggleFollow={onToggleFollow}
            />
          ))}
        </div>
      )}

      {active === 'stats' && (
        <div className="statbars">
          <div className="statbars__teams">
            <span>{home?.teamName}</span>
            <span>{away?.teamName}</span>
          </div>
          {STAT_ROWS.map((row) => {
            const h = statVal(home, row.name)
            const a = statVal(away, row.name)
            const total = h + a || 1
            const hPct = row.pct ? h : (h / total) * 100
            return (
              <div className="statbar" key={row.name}>
                <span className="statbar__h">{row.pct ? `${h}%` : h}</span>
                <div className="statbar__track">
                  <div className="statbar__fill" style={{ width: `${row.pct ? h : hPct}%` }} />
                </div>
                <span className="statbar__label">{row.label}</span>
                <div className="statbar__track statbar__track--r">
                  <div className="statbar__fill" style={{ width: `${row.pct ? a : 100 - hPct}%` }} />
                </div>
                <span className="statbar__a">{row.pct ? `${a}%` : a}</span>
              </div>
            )
          })}
        </div>
      )}

      {active === 'h2h' && (
        <ul className="h2h">
          {summary.h2h.map((g, i) => (
            <li key={i} className="h2h__row">
              <span className="h2h__date">{g.date ? g.date.slice(0, 10) : ''}</span>
              <span className="h2h__score">{g.score}</span>
              <span className="h2h__comp">{g.competition}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
