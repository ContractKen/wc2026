import { TimezonePicker } from './TimezonePicker'
import { REGIONS, type Region } from '../data/broadcasts'
import type { AlertScope } from '../lib/alerts'

type ConnStatus = 'idle' | 'loading' | 'ok' | 'error'

interface Props {
  tzId: string
  onTzChange: (id: string) => void
  region: Region
  onRegionChange: (r: Region) => void
  alertScope: AlertScope
  onAlertScopeChange: (s: AlertScope) => void
  canInstall: boolean
  onInstall: () => void
  status: ConnStatus
  updatedAt: number | null
}

function statusText(status: ConnStatus, updatedAt: number | null): string {
  if (status === 'loading') return 'Syncing…'
  if (status === 'error') return 'Offline — showing schedule'
  if (status === 'ok' && updatedAt) {
    return `Live · updated ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  return 'Connecting…'
}

export function Header({
  tzId, onTzChange, region, onRegionChange, alertScope, onAlertScopeChange,
  canInstall, onInstall, status, updatedAt,
}: Props) {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__trophy" aria-hidden>🏆</span>
        <div>
          <h1>World Cup 2026</h1>
          <p className="header__sub">USA · Canada · Mexico — Jun 11 → Jul 19</p>
        </div>
      </div>
      <div className="header__right">
        <span className={`conn conn--${status}`} role="status" aria-live="polite">
          <span className="conn__dot" /> {statusText(status, updatedAt)}
        </span>
        {canInstall && (
          <button className="btn btn--sm install-btn" onClick={onInstall}>⬇ Install</button>
        )}
        <TimezonePicker tzId={tzId} onChange={onTzChange} />
        <label className="hdr-select">
          📺 TV
          <select value={region} onChange={(e) => onRegionChange(e.target.value as Region)}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="hdr-select">
          🔔 Alerts
          <select value={alertScope} onChange={(e) => onAlertScopeChange(e.target.value as AlertScope)}>
            <option value="off">Off</option>
            <option value="my">My teams</option>
            <option value="all">All matches</option>
          </select>
        </label>
      </div>
    </header>
  )
}
