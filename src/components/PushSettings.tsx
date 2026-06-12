import { useEffect, useState } from 'react'
import { pushConfigured } from '../config'
import { disablePush, enablePush, isPushEnabled, pushSupported, type PushScope } from '../lib/push'

interface Props {
  scope: PushScope
  teams: string[]
}

export function PushSettings({ scope, teams }: Props) {
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    isPushEnabled().then(setOn)
  }, [])

  // Hidden entirely until the Worker is configured (keeps the UI clean pre-setup).
  if (!pushConfigured() || !pushSupported()) return null

  async function toggle() {
    setBusy(true)
    setErr('')
    try {
      if (on) {
        await disablePush()
        setOn(false)
      } else {
        await enablePush(scope, teams)
        setOn(true)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="push-card">
      <div className="push-card__text">
        <h3>📲 Background alerts</h3>
        <p>
          Goal, kickoff &amp; full-time notifications even when the app is closed —{' '}
          {scope === 'all' ? 'all matches' : 'your followed teams'}.
        </p>
        {err && <p className="push-err">{err}</p>}
      </div>
      <button className={`btn ${on ? 'btn--ghost' : ''}`} disabled={busy} onClick={toggle}>
        {busy ? '…' : on ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}
