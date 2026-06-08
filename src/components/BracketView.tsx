import { useMemo } from 'react'
import type { Match, Team, TeamRef } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { effectiveTeam, hasScore, isLive } from '../lib/match'
import { computeBestThirds, computeStandings, type Row, type ThirdRow } from '../lib/standings'
import { resolveSlot } from '../lib/bracket'
import { zoned } from '../lib/time'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]
const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final']

interface Ctx {
  standings: Record<string, Row[]>
  thirds: ThirdRow[]
  matches: Match[]
  live: LiveMap
}

// What to show for one side of a bracket match: a decided team, a projected team
// from standings, or a third-place candidate slot.
function SideLabel({ ref, m, ctx }: { ref: TeamRef; m: Match; ctx: Ctx }) {
  const ls = ctx.live[m.id]
  const decided = ref === m.home ? effectiveTeam('home', m, ls) : effectiveTeam('away', m, ls)
  if (!decided.placeholder) {
    return (
      <span className="bm__team">
        {decided.flag && <img className="flag flag--sm" src={decided.flag} alt="" />}
        {decided.name}
      </span>
    )
  }
  // Project from standings (R32 winner/runner-up slots) or show third candidates.
  const res = resolveSlot(ref, ctx.standings, ctx.thirds, ctx.matches, ctx.live)
  if (res.team) {
    return (
      <span className={`bm__team ${res.provisional ? 'bm__team--prov' : ''}`} title={res.provisional ? 'Provisional — group not finished' : ''}>
        <img className="flag flag--sm" src={res.team.flag} alt="" />
        {res.team.name}{res.provisional ? ' *' : ''}
      </span>
    )
  }
  if (res.thirdCandidates && res.thirdCandidates.length > 0) {
    return (
      <span className="bm__team bm__team--third" title="Third-place slot">
        {res.label}
        <span className="bm__cands">
          {res.thirdCandidates.filter((c) => c.qualified).map((c) => c.team.code).join(', ') || '—'}
        </span>
      </span>
    )
  }
  return <span className="bm__team bm__team--ph">{res.label}</span>
}

function MiniMatch({ m, ctx, zone }: { m: Match; ctx: Ctx; zone: string }) {
  const ls = ctx.live[m.id]
  const t = zoned(m.utc, zone)
  const score = hasScore(ls)
  const liveNow = isLive(ls)
  return (
    <div className={`bm ${liveNow ? 'bm--live' : ''}`}>
      <div className="bm__date">
        {t.month} {t.day} · {t.time}{liveNow ? ` · ${ls?.clock}` : ''}
      </div>
      <div className="bm__row">
        <SideLabel ref={m.home} m={m} ctx={ctx} />
        <span className="bm__score">{score ? ls!.homeScore : ''}</span>
      </div>
      <div className="bm__row">
        <SideLabel ref={m.away} m={m} ctx={ctx} />
        <span className="bm__score">{score ? ls!.awayScore : ''}</span>
      </div>
    </div>
  )
}

export function BracketView({ matches, live, zone }: { matches: Match[]; live: LiveMap; zone: string }) {
  const standings = useMemo(() => computeStandings(matches, TEAMS, live), [matches, live])
  const thirds = useMemo(() => computeBestThirds(standings), [standings])
  const ctx: Ctx = { standings, thirds, matches, live }

  const byRound = useMemo(() => {
    const map: Record<string, Match[]> = {}
    for (const m of matches) {
      if (m.stage !== 'knockout' || !m.round) continue
      ;(map[m.round] ||= []).push(m)
    }
    for (const r of Object.values(map)) r.sort((a, b) => a.utc.localeCompare(b.utc))
    return map
  }, [matches])

  const third = byRound['Third Place']?.[0]

  return (
    <div className="bracket-wrap">
      <p className="bracket__hint">
        Round-of-32 fixtures fill in live from the standings (<strong>*</strong> = provisional while a group is unfinished;
        third-place slots show currently-qualifying candidates). Later rounds resolve as results come in.
      </p>
      <div className="bracket">
        {ROUND_ORDER.map((round) => (
          <div className="bracket__col" key={round}>
            <h3 className="bracket__title">{round}</h3>
            {(byRound[round] || []).map((m) => (
              <MiniMatch key={m.id} m={m} ctx={ctx} zone={zone} />
            ))}
            {round === 'Final' && third && (
              <>
                <h3 className="bracket__title bracket__title--third">Third Place</h3>
                <MiniMatch m={third} ctx={ctx} zone={zone} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
