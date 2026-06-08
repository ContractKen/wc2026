import type { LiveState, Match, TeamRef } from './types'
import type { LiveMap } from './espn'

// For knockout fixtures the static data has placeholders ("Group A 2nd Place").
// Once ESPN reports the real team, prefer that. Group fixtures always have real teams.
export function effectiveTeam(side: 'home' | 'away', m: Match, ls?: LiveState): TeamRef {
  const resolved = ls?.[side]
  if (resolved && resolved.code && !resolved.placeholder) return resolved
  return m[side]
}

export function isLive(ls?: LiveState): boolean {
  return ls?.state === 'in'
}

export function isFinal(ls?: LiveState): boolean {
  return ls?.state === 'post' || !!ls?.completed
}

export interface MatchStatus {
  kind: 'live' | 'final' | 'scheduled'
  text: string // e.g. "LIVE 67'", "FT", "Scheduled"
}

export function matchStatus(ls?: LiveState): MatchStatus {
  if (isLive(ls)) return { kind: 'live', text: `LIVE ${ls?.clock || ''}`.trim() }
  if (isFinal(ls)) return { kind: 'final', text: 'FT' }
  return { kind: 'scheduled', text: 'Scheduled' }
}

export function hasScore(ls?: LiveState): boolean {
  return !!ls && ls.homeScore != null && ls.awayScore != null && ls.state !== 'pre'
}

// True if the match is being played or kicks off within the next ~3 hours / earlier today.
export function isToday(m: Match, now: Date): boolean {
  const t = new Date(m.utc).getTime()
  const diff = t - now.getTime()
  return diff > -3 * 3600_000 && diff < 18 * 3600_000
}

// A team is involved in this match (by code), honoring resolved knockout teams.
export function involves(m: Match, code: string, live: LiveMap): boolean {
  const ls = live[m.id]
  return (
    effectiveTeam('home', m, ls).code === code || effectiveTeam('away', m, ls).code === code
  )
}
