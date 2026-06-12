import type {
  Goal,
  KeeperLine,
  KeeperRow,
  LiveState,
  MatchEvent,
  MatchStats,
  MatchSummary,
  ScorerRow,
} from './types'

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

// Starting goalkeepers + their clean-sheet/saves/conceded for one finished match.
function extractKeepers(summary: MatchSummary, ls: LiveState | undefined): KeeperLine[] {
  if (!ls || ls.homeScore == null || ls.awayScore == null) return []
  const out: KeeperLine[] = []
  for (const lineup of summary.lineups) {
    const gk =
      lineup.players.find((p) => p.starter && p.pos === 'G') ||
      lineup.players.find((p) => p.pos === 'G')
    if (!gk?.id) continue
    const conceded = lineup.homeAway === 'home' ? ls.awayScore : ls.homeScore
    const savesStr = summary.stats
      .find((s) => s.homeAway === lineup.homeAway)
      ?.stats.find((x) => x.name === 'saves')?.value
    out.push({
      id: gk.id,
      name: gk.name,
      team: lineup.teamName,
      conceded,
      saves: savesStr ? parseInt(savesStr, 10) || 0 : 0,
      cleanSheet: conceded === 0,
    })
  }
  return out
}

export function extractMatchStats(
  matchId: string,
  summary: MatchSummary,
  ls: LiveState | undefined,
): MatchStats {
  return { goals: extractGoals(matchId, summary), keepers: extractKeepers(summary, ls) }
}

// Golden Glove tracker: rank keepers by clean sheets, then fewest conceded, then saves.
export function aggregateKeepers(keepers: KeeperLine[]): KeeperRow[] {
  const byId = new Map<string, KeeperRow>()
  for (const k of keepers) {
    const row = byId.get(k.id) || { id: k.id, name: k.name, team: k.team, matches: 0, cleanSheets: 0, conceded: 0, saves: 0 }
    row.matches++
    row.cleanSheets += k.cleanSheet ? 1 : 0
    row.conceded += k.conceded
    row.saves += k.saves
    byId.set(k.id, row)
  }
  return [...byId.values()].sort(
    (a, b) =>
      b.cleanSheets - a.cleanSheets ||
      a.conceded - b.conceded ||
      b.saves - a.saves ||
      a.name.localeCompare(b.name),
  )
}
