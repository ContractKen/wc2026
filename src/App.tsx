import { useCallback, useEffect, useMemo, useState } from 'react'
import './index.css'
import type { Match } from './lib/types'
import matchesData from './data/matches.json'
import { Header } from './components/Header'
import { LiveTicker } from './components/LiveTicker'
import { ScheduleView } from './components/ScheduleView'
import { GroupsView } from './components/GroupsView'
import { BracketView } from './components/BracketView'
import { StatsView } from './components/StatsView'
import { FavoritesView } from './components/FavoritesView'
import { InstallHint } from './components/InstallHint'
import { PlayerModalProvider } from './components/PlayerModal'
import type { MatchCardCommon } from './components/MatchCard'
import { useTimezone } from './hooks/useTimezone'
import { useFavorites } from './hooks/useFavorites'
import { useFollowedPlayers } from './hooks/useFollowedPlayers'
import { useLiveScores } from './hooks/useLiveScores'
import { useTopScorers } from './hooks/useTopScorers'
import { useAlerts } from './hooks/useAlerts'
import { isLive } from './lib/match'
import { KEYS, load, save } from './lib/storage'
import { regionFromZone, type Region } from './data/broadcasts'
import { requestPermission, type AlertScope } from './lib/alerts'
import { getInitialMatchId, getInitialTab, setTabHash, type Tab } from './lib/url'

const MATCHES = (matchesData as Match[]).slice().sort((a, b) => a.utc.localeCompare(b.utc))

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

// Capture the browser's install prompt so we can offer an "Install" button.
function useInstallPrompt() {
  const [evt, setEvt] = useState<Event & { prompt?: () => void } | null>(null)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setEvt(e as Event & { prompt?: () => void })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  const install = useCallback(() => {
    evt?.prompt?.()
    setEvt(null)
  }, [evt])
  return { canInstall: !!evt, install }
}

export default function App() {
  const [tab, setTab] = useState<Tab>(() => getInitialTab())
  const [openMatchId] = useState<string | null>(() => getInitialMatchId())
  const { tzId, zone, setTimezone } = useTimezone()
  const { favorites, isFavorite, toggle, setMany, count } = useFavorites()
  const followed = useFollowedPlayers()
  const { live, status, updatedAt } = useLiveScores()
  const { scorers, loading: scorersLoading, matchesCounted } = useTopScorers(live)
  const now = useNow()
  const { canInstall, install } = useInstallPrompt()

  const [region, setRegion] = useState<Region>(() => load<Region | null>(KEYS.region, null) ?? regionFromZone(zone))
  const [alertScope, setAlertScope] = useState<AlertScope>(() => load<AlertScope>(KEYS.alertScope, 'off'))

  useAlerts(live, MATCHES, favorites, alertScope)

  // If deep-linked to a match, make sure we're on the schedule tab.
  useEffect(() => {
    if (openMatchId) setTab('schedule')
  }, [openMatchId])

  // Keep tab and URL hash in sync (forward + back button).
  const changeTab = useCallback((t: Tab) => {
    setTab(t)
    setTabHash(t)
  }, [])
  useEffect(() => {
    const onHash = () => setTab(getInitialTab())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const onRegionChange = useCallback((r: Region) => {
    setRegion(r)
    save(KEYS.region, r)
  }, [])
  const onAlertScopeChange = useCallback((s: AlertScope) => {
    setAlertScope(s)
    save(KEYS.alertScope, s)
    if (s !== 'off') requestPermission()
  }, [])

  const followedNames = useMemo(
    () => new Set(followed.players.map((p) => p.name.toLowerCase())),
    [followed.players],
  )

  const card: MatchCardCommon = useMemo(
    () => ({
      region,
      isFav: isFavorite,
      toggleFav: toggle,
      isFollowed: followed.isFollowed,
      toggleFollow: followed.toggle,
      followedNames,
    }),
    [region, isFavorite, toggle, followed.isFollowed, followed.toggle, followedNames],
  )

  const liveCount = useMemo(() => MATCHES.filter((m) => isLive(live[m.id])).length, [live])

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'groups', label: 'Groups' },
    { id: 'bracket', label: 'Bracket' },
    { id: 'stats', label: 'Stats' },
    { id: 'favorites', label: 'My Teams', badge: count + followed.count || undefined },
  ]

  return (
    <PlayerModalProvider scorers={scorers} isFollowed={followed.isFollowed} toggleFollow={followed.toggle}>
    <div className="app">
      <Header
        tzId={tzId}
        onTzChange={setTimezone}
        region={region}
        onRegionChange={onRegionChange}
        alertScope={alertScope}
        onAlertScopeChange={onAlertScopeChange}
        canInstall={canInstall}
        onInstall={install}
        status={status}
        updatedAt={updatedAt}
      />
      <LiveTicker matches={MATCHES} live={live} zone={zone} now={now} />

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'tab--on' : ''}`}
            onClick={() => changeTab(t.id)}
          >
            {t.label}
            {t.id === 'schedule' && liveCount > 0 && <span className="tab__live">{liveCount} live</span>}
            {t.badge ? <span className="tab__badge">{t.badge}</span> : null}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'schedule' && (
          <ScheduleView matches={MATCHES} live={live} zone={zone} now={now} card={card} openMatchId={openMatchId} />
        )}
        {tab === 'groups' && (
          <GroupsView matches={MATCHES} live={live} isFav={isFavorite} toggleFav={toggle} />
        )}
        {tab === 'bracket' && <BracketView matches={MATCHES} live={live} zone={zone} />}
        {tab === 'stats' && (
          <StatsView scorers={scorers} scorersLoading={scorersLoading} matchesCounted={matchesCounted} />
        )}
        {tab === 'favorites' && (
          <FavoritesView
            matches={MATCHES}
            live={live}
            zone={zone}
            favorites={favorites}
            setMany={setMany}
            players={followed.players}
            card={card}
          />
        )}
      </main>

      <footer className="footer">
        <span>Data: ESPN public API · Schedule cached locally · Times shown in {zone}</span>
        <span>Built for the love of the game ⚽</span>
      </footer>

      <InstallHint />
    </div>
    </PlayerModalProvider>
  )
}
