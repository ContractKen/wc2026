import { useEffect, useState } from 'react'
import type { FollowedPlayer, SquadPlayer, Team } from '../lib/types'
import { fetchSquad } from '../lib/espn'
import { sortByRank } from '../data/countryRank'

interface Props {
  teams: Team[]
  isFollowed: (id: string) => boolean
  toggleFollow: (p: FollowedPlayer) => void
}

export function SquadPicker({ teams, isFollowed, toggleFollow }: Props) {
  const sorted = sortByRank(teams)
  const [code, setCode] = useState<string>('')
  const [squad, setSquad] = useState<SquadPlayer[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const team = teams.find((t) => t.code === code)

  useEffect(() => {
    if (!team?.espnId) {
      setSquad([])
      return
    }
    let active = true
    setStatus('loading')
    fetchSquad(team.espnId)
      .then((s) => {
        if (!active) return
        setSquad(s)
        setStatus('ok')
      })
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [team?.espnId])

  return (
    <div className="squad">
      <div className="squad__head">
        <label className="squad__label">
          ⚽ Follow players from
          <select value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">— pick a country —</option>
            {sorted.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {status === 'loading' && <p className="muted">Loading squad…</p>}
      {status === 'error' && <p className="muted">Couldn’t load that squad — try again.</p>}
      {status === 'ok' && squad.length === 0 && <p className="muted">No squad published yet.</p>}

      {squad.length > 0 && team && (
        <div className="squad__grid">
          {squad.map((p) => (
            <button
              key={p.id}
              className={`squad__player ${isFollowed(p.id) ? 'squad__player--on' : ''}`}
              onClick={() => toggleFollow({ id: p.id, name: p.name, teamCode: team.code })}
            >
              <span className="squad__star">{isFollowed(p.id) ? '★' : '☆'}</span>
              <span className="squad__num">{p.jersey}</span>
              <span className="squad__name">{p.name}</span>
              <span className="squad__pos">{p.pos}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
