import { useState } from 'react'
import { KEYS, load, save } from '../lib/storage'

// iOS Safari can't fire the automatic install prompt (that's Android/desktop
// Chrome's beforeinstallprompt). So on iOS, when not already installed, show a
// one-time dismissible hint explaining Share → Add to Home Screen.
function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

export function InstallHint() {
  const [dismissed, setDismissed] = useState<boolean>(() => load(KEYS.installHint, false))

  if (dismissed || !isIos() || isStandalone()) return null

  function close() {
    setDismissed(true)
    save(KEYS.installHint, true)
  }

  return (
    <div className="install-hint" role="note">
      <span className="install-hint__text">
        📲 Install: tap <strong>Share</strong> <span aria-hidden>⬆️</span> then{' '}
        <strong>Add to Home Screen</strong>
      </span>
      <button className="install-hint__close" onClick={close} aria-label="Dismiss">✕</button>
    </div>
  )
}
