import { CountryPicker } from './CountryPicker'
import { TIMEZONES } from '../data/timezones'
import { REGIONS, type Region } from '../data/broadcasts'
import type { AlertScope } from '../lib/alerts'
import type { Team } from '../lib/types'
import teamsData from '../data/teams.json'

const TEAMS = teamsData as Team[]

interface Props {
  isFav: (code: string) => boolean
  toggleFav: (code: string) => void
  setMany: (codes: string[], selected: boolean) => void
  tzId: string
  setTimezone: (id: string) => void
  region: Region
  onRegionChange: (r: Region) => void
  alertScope: AlertScope
  onAlertScopeChange: (s: AlertScope) => void
  onDone: () => void
}

export function Onboarding({
  isFav, toggleFav, setMany, tzId, setTimezone, region, onRegionChange, alertScope, onAlertScopeChange, onDone,
}: Props) {
  return (
    <div className="ob-overlay">
      <div className="ob-card">
        <div className="ob-hero">
          <span className="ob-trophy" aria-hidden>🏆</span>
          <h2>Welcome to World Cup 2026</h2>
          <p>USA · Canada · Mexico — set up in a few taps. You can change all of this later.</p>
        </div>

        <div className="ob-row">
          <label className="ob-field">
            <span>🌐 Time zone</span>
            <select value={tzId} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz.id} value={tz.id}>{tz.label}</option>)}
            </select>
          </label>
          <label className="ob-field">
            <span>📺 Where you watch</span>
            <select value={region} onChange={(e) => onRegionChange(e.target.value as Region)}>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          <label className="ob-field ob-field--check">
            <input
              type="checkbox"
              checked={alertScope !== 'off'}
              onChange={(e) => onAlertScopeChange(e.target.checked ? 'my' : 'off')}
            />
            <span>🔔 Alert me about my teams’ goals</span>
          </label>
        </div>

        <h3 className="ob-pick-title">Pick your teams</h3>
        <CountryPicker teams={TEAMS} isSelected={isFav} onToggle={toggleFav} onSelectMany={setMany} />

        <div className="ob-actions">
          <button className="btn ob-go" onClick={onDone}>Let’s go ⚽</button>
        </div>
      </div>
    </div>
  )
}
