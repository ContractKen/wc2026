import { useMemo } from 'react'
import { usePlayerModal } from './PlayerModal'
import type { ScorerRow, Team } from '../lib/types'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]

interface Props {
  scorers: ScorerRow[]
  loading: boolean
  matchesCounted: number
}

export function TopScorers({ scorers, loading, matchesCounted }: Props) {
  const { openPlayer } = usePlayerModal()

  const flagByName = useMemo(() => new Map(TEAMS.map((t) => [t.name, t.flag])), [])
  const top = scorers.filter((s) => s.goals > 0).slice(0, 15)

  if (matchesCounted === 0 && !loading) return null

  return (
    <section className="scorers">
      <h3 className="scorers__title">
        🥇 Golden Boot race {loading && <span className="scorers__loading">updating…</span>}
      </h3>
      {top.length === 0 ? (
        <p className="muted">No goals counted yet.</p>
      ) : (
        <table className="scorers__table">
          <thead>
            <tr><th>#</th><th className="col-team">Player</th><th>Team</th><th>G</th><th>A</th></tr>
          </thead>
          <tbody>
            {top.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td className="col-team">
                  <button className="linklike" onClick={() => openPlayer({ id: s.id, name: s.name })}>
                    {s.name}
                  </button>
                </td>
                <td>
                  {flagByName.get(s.team) && (
                    <img className="flag flag--sm" src={flagByName.get(s.team)} alt="" loading="lazy" />
                  )}
                </td>
                <td className="pts">{s.goals}</td>
                <td>{s.assists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="scorers__note">Built from {matchesCounted} finished match{matchesCounted === 1 ? '' : 'es'}.</p>
    </section>
  )
}
