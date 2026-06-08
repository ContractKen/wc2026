import { TimezonePicker } from './TimezonePicker'

type ConnStatus = 'idle' | 'loading' | 'ok' | 'error'

interface Props {
  tzId: string
  onTzChange: (id: string) => void
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

export function Header({ tzId, onTzChange, status, updatedAt }: Props) {
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
        <span className={`conn conn--${status}`}>
          <span className="conn__dot" /> {statusText(status, updatedAt)}
        </span>
        <TimezonePicker tzId={tzId} onChange={onTzChange} />
      </div>
    </header>
  )
}
