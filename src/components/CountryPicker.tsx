import { useMemo, useState } from 'react'
import type { Team } from '../lib/types'
import { isTopNation, sortByRank } from '../data/countryRank'

interface Props {
  teams: Team[]
  isSelected: (code: string) => boolean
  onToggle: (code: string) => void
  onSelectMany: (codes: string[], selected: boolean) => void
}

function Row({
  team,
  checked,
  onToggle,
}: {
  team: Team
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className={`cp-row ${checked ? 'cp-row--on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <img className="flag flag--sm" src={team.flag} alt="" loading="lazy" />
      <span className="cp-row__name">{team.name}</span>
      <span className="cp-row__grp">{team.group}</span>
    </label>
  )
}

export function CountryPicker({ teams, isSelected, onToggle, onSelectMany }: Props) {
  const [q, setQ] = useState('')

  const { top, others, allCodes } = useMemo(() => {
    const sorted = sortByRank(teams)
    const filter = (t: Team) => t.name.toLowerCase().includes(q.trim().toLowerCase())
    const visible = sorted.filter(filter)
    return {
      top: visible.filter((t) => isTopNation(t.code)),
      others: visible.filter((t) => !isTopNation(t.code)),
      allCodes: visible.map((t) => t.code),
    }
  }, [teams, q])

  return (
    <div className="cp">
      <div className="cp-head">
        <input
          className="cp-search"
          type="search"
          placeholder="Find a country…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="cp-bulk">
          <button className="btn btn--sm" onClick={() => onSelectMany(allCodes, true)}>
            Select all
          </button>
          <button className="btn btn--sm btn--ghost" onClick={() => onSelectMany(allCodes, false)}>
            Clear
          </button>
        </div>
      </div>

      {top.length > 0 && (
        <>
          <h4 className="cp-section">★ Top footballing nations</h4>
          <div className="cp-grid">
            {top.map((t) => (
              <Row key={t.code} team={t} checked={isSelected(t.code)} onToggle={() => onToggle(t.code)} />
            ))}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h4 className="cp-section">All other teams (A–Z)</h4>
          <div className="cp-grid">
            {others.map((t) => (
              <Row key={t.code} team={t} checked={isSelected(t.code)} onToggle={() => onToggle(t.code)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
