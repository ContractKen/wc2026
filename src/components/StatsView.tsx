import { useMemo, type ReactNode } from 'react'
import { usePlayerModal } from './PlayerModal'
import type { KeeperRow, ScorerRow, Team } from '../lib/types'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]

interface Props {
  scorers: ScorerRow[]
  keepers: KeeperRow[]
  loading: boolean
  matchesCounted: number
}

function AwardCard({
  icon, title, official, children,
}: {
  icon: string
  title: string
  official: string
  children: ReactNode
}) {
  return (
    <section className="award">
      <div className="award__head">
        <span className="award__icon" aria-hidden>{icon}</span>
        <div>
          <h3 className="award__title">{title}</h3>
          <p className="award__note">{official}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function StatsView({ scorers, keepers, loading, matchesCounted }: Props) {
  const { openPlayer } = usePlayerModal()
  const flagByName = useMemo(() => new Map(TEAMS.map((t) => [t.name, t.flag])), [])
  const Flag = ({ team }: { team: string }) =>
    flagByName.get(team) ? <img className="flag flag--sm" src={flagByName.get(team)} alt="" loading="lazy" /> : null

  const topScorers = scorers.filter((s) => s.goals > 0).slice(0, 12)
  const goldenBall = useMemo(
    () =>
      [...scorers]
        .sort((a, b) => b.goals + b.assists - (a.goals + a.assists) || b.goals - a.goals)
        .filter((s) => s.goals + s.assists > 0)
        .slice(0, 10),
    [scorers],
  )
  const topKeepers = keepers.filter((k) => k.matches > 0).slice(0, 10)

  if (matchesCounted === 0 && !loading) {
    return (
      <div className="stats-view">
        <p className="empty">No finished matches yet — award races appear once games are played.</p>
      </div>
    )
  }

  return (
    <div className="stats-view">
      <p className="stats-view__hint">
        The four individual FIFA awards. Only the Golden Boot is purely statistical — the others are
        decided by FIFA / a media vote and announced after the final, so these are <em>live indicators</em>.
        Tap a player for their profile.{loading && ' · updating…'}
      </p>

      <AwardCard icon="🏆" title="Golden Ball" official="Best player — media vote, announced after the final. Indicator: goal involvements (G+A).">
        {goldenBall.length === 0 ? (
          <p className="muted">No goal involvements yet.</p>
        ) : (
          <table className="award__table">
            <thead><tr><th>#</th><th className="col-team">Player</th><th></th><th>G</th><th>A</th><th>G+A</th></tr></thead>
            <tbody>
              {goldenBall.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="col-team"><button className="linklike" onClick={() => openPlayer({ id: s.id, name: s.name })}>{s.name}</button></td>
                  <td><Flag team={s.team} /></td>
                  <td>{s.goals}</td><td>{s.assists}</td><td className="pts">{s.goals + s.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AwardCard>

      <AwardCard icon="🥇" title="Golden Boot" official="Top scorer of the tournament (most goals, then most assists, then fewest minutes).">
        {topScorers.length === 0 ? (
          <p className="muted">No goals yet.</p>
        ) : (
          <table className="award__table">
            <thead><tr><th>#</th><th className="col-team">Player</th><th></th><th>G</th><th>A</th></tr></thead>
            <tbody>
              {topScorers.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="col-team"><button className="linklike" onClick={() => openPlayer({ id: s.id, name: s.name })}>{s.name}</button></td>
                  <td><Flag team={s.team} /></td>
                  <td className="pts">{s.goals}</td><td>{s.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AwardCard>

      <AwardCard icon="🧤" title="Golden Glove" official="Best goalkeeper — FIFA's panel. Indicator: clean sheets, then fewest goals conceded, then saves.">
        {topKeepers.length === 0 ? (
          <p className="muted">No goalkeeper data yet.</p>
        ) : (
          <table className="award__table">
            <thead><tr><th>#</th><th className="col-team">Goalkeeper</th><th></th><th title="Matches">M</th><th title="Clean sheets">CS</th><th title="Goals conceded">GA</th><th title="Saves">Sv</th></tr></thead>
            <tbody>
              {topKeepers.map((k, i) => (
                <tr key={k.id}>
                  <td>{i + 1}</td>
                  <td className="col-team"><button className="linklike" onClick={() => openPlayer({ id: k.id, name: k.name })}>{k.name}</button></td>
                  <td><Flag team={k.team} /></td>
                  <td>{k.matches}</td><td className="pts">{k.cleanSheets}</td><td>{k.conceded}</td><td>{k.saves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AwardCard>

      <AwardCard icon="🌟" title="Best Young Player" official="Best player born on/after 1 Jan 2005 (U-21) — media vote, announced after the final.">
        <p className="muted">
          Winner is announced by FIFA after the final. We don’t compute this live (it needs ages and a
          subjective vote) — open a young player’s profile to follow their tournament.
        </p>
      </AwardCard>
    </div>
  )
}
