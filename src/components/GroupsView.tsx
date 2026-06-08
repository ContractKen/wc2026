import { useMemo } from 'react'
import type { Match, Team } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { computeStandings } from '../lib/standings'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]

interface Props {
  matches: Match[]
  live: LiveMap
  isFav: (code: string) => boolean
  toggleFav: (code: string) => void
}

export function GroupsView({ matches, live, isFav, toggleFav }: Props) {
  const tables = useMemo(() => computeStandings(matches, TEAMS, live), [matches, live])

  return (
    <div className="groups">
      <p className="groups__hint">
        Top 2 of each group advance, plus the 8 best third-placed teams. Tables update live as
        results come in.
      </p>
      <div className="groups__grid">
        {Object.entries(tables).map(([letter, rows]) => (
          <section className="group-card" key={letter}>
            <h3>Group {letter}</h3>
            <table>
              <thead>
                <tr>
                  <th className="col-team">Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.team.code} className={i < 2 ? 'qual' : i === 2 ? 'maybe' : ''}>
                    <td className="col-team">
                      <button
                        className="star star--sm"
                        onClick={() => toggleFav(r.team.code)}
                        aria-label={`Favorite ${r.team.name}`}
                      >
                        {isFav(r.team.code) ? '★' : '☆'}
                      </button>
                      <img className="flag flag--sm" src={r.team.flag} alt="" loading="lazy" />
                      <span>{r.team.name}</span>
                    </td>
                    <td>{r.played}</td>
                    <td>{r.win}</td>
                    <td>{r.draw}</td>
                    <td>{r.loss}</td>
                    <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td className="pts">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  )
}
