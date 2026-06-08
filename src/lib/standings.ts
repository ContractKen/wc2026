import type { LiveState, Match, Team } from './types'
import type { LiveMap } from './espn'

export interface Row {
  team: Team
  played: number
  win: number
  draw: number
  loss: number
  gf: number
  ga: number
  gd: number
  points: number
}

function emptyRow(team: Team): Row {
  return { team, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, points: 0 }
}

// Computes live group tables from finished group-stage results.
// Tiebreakers are simplified for v1: Points → Goal Difference → Goals For → name.
export function computeStandings(
  matches: Match[],
  teams: Team[],
  live: LiveMap,
): Record<string, Row[]> {
  const groups: Record<string, Map<string, Row>> = {}
  for (const t of teams) {
    ;(groups[t.group] ||= new Map()).set(t.code, emptyRow(t))
  }

  for (const m of matches) {
    if (m.stage !== 'group' || !m.group) continue
    const ls: LiveState | undefined = live[m.id]
    if (!ls || !ls.completed || ls.homeScore == null || ls.awayScore == null) continue
    const g = groups[m.group]
    const home = g?.get(m.home.code)
    const away = g?.get(m.away.code)
    if (!home || !away) continue
    const hs = ls.homeScore
    const as = ls.awayScore
    home.played++; away.played++
    home.gf += hs; home.ga += as
    away.gf += as; away.ga += hs
    if (hs > as) { home.win++; home.points += 3; away.loss++ }
    else if (hs < as) { away.win++; away.points += 3; home.loss++ }
    else { home.draw++; away.draw++; home.points++; away.points++ }
  }

  const out: Record<string, Row[]> = {}
  for (const [letter, map] of Object.entries(groups)) {
    const rows = [...map.values()]
    for (const r of rows) r.gd = r.gf - r.ga
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.team.name.localeCompare(b.team.name),
    )
    out[letter] = rows
  }
  // keep groups alphabetical
  return Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]])) as Record<string, Row[]>
}
