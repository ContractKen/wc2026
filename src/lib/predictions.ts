import type { LiveState } from './types'
import type { LiveMap } from './espn'

export interface Prediction {
  home: number
  away: number
}

export type PredResult = 'exact' | 'result' | 'wrong'

// Grade one prediction against the final score (null if not finished).
export function gradePrediction(p: Prediction, ls: LiveState | undefined): PredResult | null {
  if (!ls || !ls.completed || ls.homeScore == null || ls.awayScore == null) return null
  if (p.home === ls.homeScore && p.away === ls.awayScore) return 'exact'
  const predOutcome = Math.sign(p.home - p.away)
  const actualOutcome = Math.sign(ls.homeScore - ls.awayScore)
  return predOutcome === actualOutcome ? 'result' : 'wrong'
}

export const POINTS: Record<PredResult, number> = { exact: 3, result: 1, wrong: 0 }

export interface PredSummary {
  total: number
  graded: number
  exact: number
  result: number
  wrong: number
  points: number
}

export function summarize(preds: Record<string, Prediction>, live: LiveMap): PredSummary {
  const s: PredSummary = { total: 0, graded: 0, exact: 0, result: 0, wrong: 0, points: 0 }
  for (const [id, p] of Object.entries(preds)) {
    s.total++
    const r = gradePrediction(p, live[id])
    if (!r) continue
    s.graded++
    s[r]++
    s.points += POINTS[r]
  }
  return s
}
