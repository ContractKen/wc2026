import { useMemo } from 'react'
import type { Match, ScorerRow, Team } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { computeBestThirds, computeQualification, computeStandings, type QualStatus } from '../lib/standings'
import { TopScorers } from './TopScorers'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]

const QUAL_BADGE: Record<QualStatus, { txt: string; cls: string; title: string } | null> = {
  advanced: { txt: '✓', cls: 'q-adv', title: 'Through to the knockouts' },
  thirdRace: { txt: '3rd?', cls: 'q-third', title: 'Out of top 2 — alive via best-third race' },
  eliminated: { txt: '✗', cls: 'q-out', title: 'Eliminated' },
  contention: null,
}

interface Props {
  matches: Match[]
  live: LiveMap
  isFav: (code: string) => boolean
  toggleFav: (code: string) => void
  scorers: ScorerRow[]
  scorersLoading: boolean
  matchesCounted: number
}

export function GroupsView({ matches, live, isFav, toggleFav, scorers, scorersLoading, matchesCounted }: Props) {
  const tables = useMemo(() => computeStandings(matches, TEAMS, live), [matches, live])
  const thirds = useMemo(() => computeBestThirds(tables), [tables])
  const qual = useMemo(() => computeQualification(tables), [tables])
  const anyPlayed = useMemo(() => Object.values(tables).some((rows) => rows.some((r) => r.played > 0)), [tables])

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
                      {QUAL_BADGE[qual[r.team.code]] && (
                        <span
                          className={`qbadge ${QUAL_BADGE[qual[r.team.code]]!.cls}`}
                          title={QUAL_BADGE[qual[r.team.code]]!.title}
                        >
                          {QUAL_BADGE[qual[r.team.code]]!.txt}
                        </span>
                      )}
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

      {anyPlayed && (
        <section className="thirds">
          <h3 className="thirds__title">Best third-placed teams</h3>
          <p className="thirds__hint">
            The top <strong>8 of 12</strong> third-placed teams advance to the Round of 32. Green = currently qualifying.
          </p>
          <table className="thirds__table">
            <thead>
              <tr>
                <th>#</th>
                <th className="col-team">Team</th>
                <th>Grp</th>
                <th>P</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {thirds.map((t) => (
                <tr key={t.row.team.code} className={t.qualified ? 'qual' : ''}>
                  <td>{t.rank}</td>
                  <td className="col-team">
                    <button
                      className="star star--sm"
                      onClick={() => toggleFav(t.row.team.code)}
                      aria-label={`Follow ${t.row.team.name}`}
                    >
                      {isFav(t.row.team.code) ? '★' : '☆'}
                    </button>
                    <img className="flag flag--sm" src={t.row.team.flag} alt="" loading="lazy" />
                    <span>{t.row.team.name}</span>
                  </td>
                  <td>{t.group}</td>
                  <td>{t.row.played}</td>
                  <td>{t.row.gd > 0 ? `+${t.row.gd}` : t.row.gd}</td>
                  <td className="pts">{t.row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <TopScorers scorers={scorers} loading={scorersLoading} matchesCounted={matchesCounted} />
    </div>
  )
}
