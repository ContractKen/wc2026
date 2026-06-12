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

interface Result {
  home: string
  away: string
  hs: number
  as: number
}

function emptyRow(team: Team): Row {
  return { team, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, points: 0 }
}

// Points among a tied subset, counting only matches played between those teams.
function headToHead(codes: string[], results: Result[]) {
  const set = new Set(codes)
  const mini = new Map(codes.map((c) => [c, { pts: 0, gd: 0, gf: 0 }]))
  for (const r of results) {
    if (!set.has(r.home) || !set.has(r.away)) continue
    const h = mini.get(r.home)!
    const a = mini.get(r.away)!
    h.gf += r.hs; a.gf += r.as
    h.gd += r.hs - r.as; a.gd += r.as - r.hs
    if (r.hs > r.as) h.pts += 3
    else if (r.hs < r.as) a.pts += 3
    else { h.pts++; a.pts++ }
  }
  return mini
}

// Group results into per-group base rows + the completed results for H2H.
function buildGroups(matches: Match[], teams: Team[], live: LiveMap) {
  const rows: Record<string, Map<string, Row>> = {}
  const results: Record<string, Result[]> = {}
  for (const t of teams) (rows[t.group] ||= new Map()).set(t.code, emptyRow(t))

  for (const m of matches) {
    if (m.stage !== 'group' || !m.group) continue
    const ls: LiveState | undefined = live[m.id]
    if (!ls || !ls.completed || ls.homeScore == null || ls.awayScore == null) continue
    const g = rows[m.group]
    const home = g?.get(m.home.code)
    const away = g?.get(m.away.code)
    if (!home || !away) continue
    const hs = ls.homeScore
    const as = ls.awayScore
    ;(results[m.group] ||= []).push({ home: m.home.code, away: m.away.code, hs, as })
    home.played++; away.played++
    home.gf += hs; home.ga += as
    away.gf += as; away.ga += hs
    if (hs > as) { home.win++; home.points += 3; away.loss++ }
    else if (hs < as) { away.win++; away.points += 3; home.loss++ }
    else { home.draw++; away.draw++; home.points++; away.points++ }
  }
  return { rows, results }
}

// FIFA order (simplified): overall Pts → GD → GF, then head-to-head Pts → GD → GF
// among the tied teams, then name. (Fair-play points and drawing of lots omitted.)
function sortGroup(rows: Row[], results: Result[]): Row[] {
  const sorted = [...rows]
  for (const r of sorted) r.gd = r.gf - r.ga

  sorted.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)

  // Resolve ties with a mini-league among equal (points, gd, gf) groups.
  const out: Row[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    while (
      j < sorted.length &&
      sorted[j].points === sorted[i].points &&
      sorted[j].gd === sorted[i].gd &&
      sorted[j].gf === sorted[i].gf
    )
      j++
    const tied = sorted.slice(i, j)
    if (tied.length > 1) {
      const h2h = headToHead(tied.map((r) => r.team.code), results)
      tied.sort((a, b) => {
        const A = h2h.get(a.team.code)!
        const B = h2h.get(b.team.code)!
        return B.pts - A.pts || B.gd - A.gd || B.gf - A.gf || a.team.name.localeCompare(b.team.name)
      })
    }
    out.push(...tied)
    i = j
  }
  return out
}

export function computeStandings(
  matches: Match[],
  teams: Team[],
  live: LiveMap,
): Record<string, Row[]> {
  const { rows, results } = buildGroups(matches, teams, live)
  const out: Record<string, Row[]> = {}
  for (const [letter, map] of Object.entries(rows)) {
    out[letter] = sortGroup([...map.values()], results[letter] || [])
  }
  return Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]])) as Record<string, Row[]>
}

export type QualStatus = 'advanced' | 'thirdRace' | 'eliminated' | 'contention'

// Conservative qualification status — only declares a guaranteed outcome.
// 'advanced' = clinched a top-2 spot; 'thirdRace' = can't make top 2 but still
// alive via the best-third route; 'eliminated' = group done and out (4th).
export function computeQualification(standings: Record<string, Row[]>): Record<string, QualStatus> {
  const out: Record<string, QualStatus> = {}
  for (const rows of Object.values(standings)) {
    const complete = rows.length > 0 && rows.every((r) => r.played === 3)
    rows.forEach((row, i) => {
      if (complete) {
        out[row.team.code] = i < 2 ? 'advanced' : i === 3 ? 'eliminated' : 'thirdRace'
        return
      }
      const maxPts = row.points + 3 * (3 - row.played)
      const reachOrPass = rows.filter(
        (o) => o !== row && o.points + 3 * (3 - o.played) >= row.points,
      ).length
      const strictlyAbove = rows.filter((o) => o !== row && o.points > maxPts).length
      out[row.team.code] =
        reachOrPass <= 1 ? 'advanced' : strictlyAbove >= 2 ? 'thirdRace' : 'contention'
    })
  }
  return out
}

export interface ThirdRow {
  group: string
  row: Row
  rank: number
  qualified: boolean
}

// The 8 best third-placed teams advance in the 2026 format. Rank all 12 by the
// same overall criteria; top 8 qualify.
export function computeBestThirds(standings: Record<string, Row[]>): ThirdRow[] {
  const thirds: { group: string; row: Row }[] = []
  for (const [group, rows] of Object.entries(standings)) {
    if (rows[2]) thirds.push({ group, row: rows[2] })
  }
  thirds.sort(
    (a, b) =>
      b.row.points - a.row.points ||
      b.row.gd - a.row.gd ||
      b.row.gf - a.row.gf ||
      a.row.team.name.localeCompare(b.row.team.name),
  )
  return thirds.map((t, i) => ({ ...t, rank: i + 1, qualified: i < 8 }))
}
