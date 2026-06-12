import type { Goal, MatchEvent, MatchSummary, ScorerRow } from './types'

// Pull the goals (with scorer/assist) out of a finished match's summary.
export function extractGoals(matchId: string, summary: MatchSummary): Goal[] {
  const goals: Goal[] = []
  for (const e of summary.events) {
    if (!e.scoringPlay || !e.scorer) continue
    const lower = `${e.typeText} ${e.text}`.toLowerCase()
    goals.push({
      matchId,
      scorerId: e.scorer.id,
      scorerName: e.scorer.name,
      team: e.team,
      assistName: e.assist?.name,
      ownGoal: lower.includes('own goal'),
      penalty: lower.includes('penalt'),
    })
  }
  return goals
}

// Build the Golden Boot leaderboard from a flat list of goals.
// Own goals don't count toward a scorer's tally.
export function aggregateScorers(goals: Goal[]): ScorerRow[] {
  const byId = new Map<string, ScorerRow>()
  const assistById = new Map<string, number>()

  for (const g of goals) {
    if (g.ownGoal) continue
    const row = byId.get(g.scorerId) || {
      id: g.scorerId,
      name: g.scorerName,
      team: g.team,
      goals: 0,
      assists: 0,
    }
    row.goals++
    byId.set(g.scorerId, row)
  }
  for (const g of goals) {
    if (!g.assistName) continue
    // Assists are keyed by name (assist athlete id isn't always resolvable to a row).
    assistById.set(g.assistName, (assistById.get(g.assistName) || 0) + 1)
  }
  for (const row of byId.values()) {
    row.assists = assistById.get(row.name) || 0
  }

  return [...byId.values()].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name),
  )
}

export function eventKey(e: MatchEvent): string {
  return `${e.id}`
}
