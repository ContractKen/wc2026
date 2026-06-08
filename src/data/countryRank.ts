import type { Team } from '../lib/types'

// Footballing-pedigree priority so the strongest nations surface first in the
// country picker. Codes not present in the field are simply ignored; any team
// not listed here falls below these, sorted alphabetically.
export const TOP_NATIONS: string[] = [
  'ARG', 'FRA', 'ESP', 'ENG', 'BRA', 'POR', 'NED', 'GER', 'BEL', 'CRO',
  'URU', 'COL', 'MAR', 'USA', 'MEX', 'SUI', 'JPN', 'SEN', 'KOR', 'ECU',
]

const RANK = new Map(TOP_NATIONS.map((code, i) => [code, i]))

export function isTopNation(code: string): boolean {
  return RANK.has(code)
}

// Top nations (in ranked order) first, then everyone else A→Z by name.
export function sortByRank(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    const ra = RANK.has(a.code) ? RANK.get(a.code)! : Infinity
    const rb = RANK.has(b.code) ? RANK.get(b.code)! : Infinity
    if (ra !== rb) return ra - rb
    return a.name.localeCompare(b.name)
  })
}
