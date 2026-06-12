import { TopScorers } from './TopScorers'
import type { ScorerRow } from '../lib/types'

interface Props {
  scorers: ScorerRow[]
  scorersLoading: boolean
  matchesCounted: number
}

export function StatsView({ scorers, scorersLoading, matchesCounted }: Props) {
  return (
    <div className="stats-view">
      <p className="stats-view__hint">
        Tournament stats, updated live as matches finish. Tap any player for their profile.
      </p>
      {matchesCounted === 0 && !scorersLoading ? (
        <p className="empty">No finished matches yet — leaders appear once games are played.</p>
      ) : (
        <TopScorers scorers={scorers} loading={scorersLoading} matchesCounted={matchesCounted} />
      )}
    </div>
  )
}
