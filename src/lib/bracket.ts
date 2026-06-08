import type { Match, Team, TeamRef } from './types'
import type { LiveMap } from './espn'
import type { Row, ThirdRow } from './standings'

// Has every match in a group finished? (6 group matches per group.)
export function groupComplete(group: string, matches: Match[], live: LiveMap): boolean {
  const gm = matches.filter((m) => m.stage === 'group' && m.group === group)
  return gm.length > 0 && gm.every((m) => live[m.id]?.completed)
}

export interface SlotResolution {
  team?: Team
  provisional: boolean // true while the group isn't finished yet
  label: string
  thirdCandidates?: { group: string; team: Team; qualified: boolean }[]
}

const POS = /^([12])([A-L])$/ // e.g. "1C" = winner Group C, "2F" = runner-up Group F

// Resolve a Round-of-32 placeholder slot to a (possibly provisional) team using
// the current standings. Third-place slots show their candidate groups instead.
export function resolveSlot(
  ref: TeamRef,
  standings: Record<string, Row[]>,
  thirds: ThirdRow[],
  matches: Match[],
  live: LiveMap,
): SlotResolution {
  if (!ref.placeholder) {
    return { team: undefined, provisional: false, label: ref.name }
  }

  const m = POS.exec(ref.code)
  if (m) {
    const pos = Number(m[1]) // 1 winner, 2 runner-up
    const group = m[2]
    const rows = standings[group]
    const row = rows?.[pos - 1]
    const complete = groupComplete(group, matches, live)
    const label = pos === 1 ? `Winner Group ${group}` : `Runner-up Group ${group}`
    if (row && row.played > 0) {
      return { team: row.team, provisional: !complete, label }
    }
    return { provisional: true, label }
  }

  // Third-place slot, e.g. name "Third Place Group A/B/C/D/F"
  const groupsMatch = /Group\s+([A-L/]+)/i.exec(ref.name)
  if (groupsMatch) {
    const cand = groupsMatch[1].split('/').map((g) => g.trim()).filter(Boolean)
    const byGroup = new Map(thirds.map((t) => [t.group, t]))
    const thirdCandidates = cand
      .map((g) => {
        const t = byGroup.get(g)
        return t ? { group: g, team: t.row.team, qualified: t.qualified } : null
      })
      .filter((x): x is { group: string; team: Team; qualified: boolean } => x !== null)
    return {
      provisional: true,
      label: `3rd: ${cand.join('/')}`,
      thirdCandidates,
    }
  }

  return { provisional: true, label: ref.name }
}
