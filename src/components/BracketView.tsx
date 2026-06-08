import { useMemo } from 'react'
import type { Match } from '../lib/types'
import type { LiveMap } from '../lib/espn'
import { effectiveTeam, hasScore, isLive } from '../lib/match'
import { zoned } from '../lib/time'

interface Props {
  matches: Match[]
  live: LiveMap
  zone: string
}

const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final']

function MiniMatch({ m, live, zone }: { m: Match; live: LiveMap; zone: string }) {
  const ls = live[m.id]
  const home = effectiveTeam('home', m, ls)
  const away = effectiveTeam('away', m, ls)
  const t = zoned(m.utc, zone)
  const score = hasScore(ls)
  const liveNow = isLive(ls)
  return (
    <div className={`bm ${liveNow ? 'bm--live' : ''}`}>
      <div className="bm__date">
        {t.month} {t.day} · {t.time}{liveNow ? ` · ${ls?.clock}` : ''}
      </div>
      <div className="bm__row">
        <span className="bm__team">
          {home.flag && !home.placeholder && <img className="flag flag--sm" src={home.flag} alt="" />}
          {home.name}
        </span>
        <span className="bm__score">{score ? ls!.homeScore : ''}</span>
      </div>
      <div className="bm__row">
        <span className="bm__team">
          {away.flag && !away.placeholder && <img className="flag flag--sm" src={away.flag} alt="" />}
          {away.name}
        </span>
        <span className="bm__score">{score ? ls!.awayScore : ''}</span>
      </div>
    </div>
  )
}

export function BracketView({ matches, live, zone }: Props) {
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
        Teams fill in as the group stage and each knockout round are decided.
      </p>
      <div className="bracket">
        {ROUND_ORDER.map((round) => (
          <div className="bracket__col" key={round}>
            <h3 className="bracket__title">{round}</h3>
            {(byRound[round] || []).map((m) => (
              <MiniMatch key={m.id} m={m} live={live} zone={zone} />
            ))}
            {round === 'Final' && third && (
              <>
                <h3 className="bracket__title bracket__title--third">Third Place</h3>
                <MiniMatch m={third} live={live} zone={zone} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
