import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchAthlete } from '../lib/espn'
import type { AthleteProfile, FollowedPlayer, ScorerRow } from '../lib/types'

interface OpenArgs {
  id: string
  name: string
  teamCode?: string
}

const Ctx = createContext<{ openPlayer: (p: OpenArgs) => void }>({ openPlayer: () => {} })

export function usePlayerModal() {
  return useContext(Ctx)
}

interface ProviderProps {
  scorers: ScorerRow[]
  isFollowed: (id: string) => boolean
  toggleFollow: (p: FollowedPlayer) => void
  children: ReactNode
}

export function PlayerModalProvider({ scorers, isFollowed, toggleFollow, children }: ProviderProps) {
  const [open, setOpen] = useState<OpenArgs | null>(null)
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const openPlayer = useCallback((p: OpenArgs) => setOpen(p), [])

  useEffect(() => {
    if (!open) return
    let active = true
    setProfile(null)
    setStatus('loading')
    fetchAthlete(open.id)
      .then((p) => active && (setProfile(p), setStatus('ok')))
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [open])

  const tally = open ? scorers.find((s) => s.id === open.id) : undefined

  return (
    <Ctx.Provider value={{ openPlayer }}>
      {children}
      {open && (
        <div className="pm-overlay" onClick={() => setOpen(null)}>
          <div className="pm-card" onClick={(e) => e.stopPropagation()}>
            <button className="pm-close" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            <div className="pm-head">
              {profile?.headshot ? (
                <img className="pm-photo" src={profile.headshot} alt="" />
              ) : (
                <div className="pm-photo pm-photo--ph">{open.name.slice(0, 1)}</div>
              )}
              <div>
                <h3 className="pm-name">{profile?.name || open.name}</h3>
                <p className="pm-sub">
                  {status === 'loading' && 'Loading…'}
                  {status === 'error' && 'Profile unavailable'}
                  {profile && [profile.position, profile.club].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            <div className="pm-stats">
              {profile?.jersey && <div className="pm-stat"><b>#{profile.jersey}</b><span>Number</span></div>}
              {profile?.age != null && <div className="pm-stat"><b>{profile.age}</b><span>Age</span></div>}
              <div className="pm-stat"><b>{tally?.goals ?? 0}</b><span>Goals</span></div>
              <div className="pm-stat"><b>{tally?.assists ?? 0}</b><span>Assists</span></div>
            </div>

            <div className="pm-actions">
              <button
                className="btn btn--sm"
                onClick={() =>
                  toggleFollow({ id: open.id, name: profile?.name || open.name, teamCode: open.teamCode || '' })
                }
              >
                {isFollowed(open.id) ? '★ Following' : '☆ Follow'}
              </button>
              {profile?.link && (
                <a className="btn btn--sm btn--ghost" href={profile.link} target="_blank" rel="noopener noreferrer">
                  ESPN profile ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
