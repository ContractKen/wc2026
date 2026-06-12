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
import { Onboarding } from './components/Onboarding'
import { PlayerModalProvider } from './components/PlayerModal'
import type { MatchCardCommon } from './components/MatchCard'
import { useTimezone } from './hooks/useTimezone'
import { useFavorites } from './hooks/useFavorites'
import { useFollowedPlayers } from './hooks/useFollowedPlayers'
import { useLiveScores } from './hooks/useLiveScores'
import { useTournamentStats } from './hooks/useTournamentStats'
import { usePredictions } from './hooks/usePredictions'
import { summarize } from './lib/predictions'
import { useAlerts } from './hooks/useAlerts'
import { useTheme } from './hooks/useTheme'
import { teamColor } from './data/teamColors'
import { sortByRank } from './data/countryRank'
import teamsData from './data/teams.json'
import type { Team } from './lib/types'
import { isLive } from './lib/match'

const TEAMS = teamsData as Team[]

function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
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
  const { preds, setPrediction, getPrediction } = usePredictions()
  const { live, status, updatedAt } = useLiveScores()
  const { scorers, keepers, loading: statsLoading, matchesCounted } = useTournamentStats(live)
  const now = useNow()
  const { canInstall, install } = useInstallPrompt()
  const { theme, toggle: toggleTheme } = useTheme()

  // Tint the app accent to the user's top-ranked followed team.
  const accentColor = useMemo(() => {
    const favTeams = sortByRank(TEAMS.filter((t) => favorites.has(t.code)))
    return favTeams.length ? teamColor(favTeams[0].code) : undefined
  }, [favorites])
  useEffect(() => {
    const root = document.documentElement
    if (accentColor) {
      root.style.setProperty('--accent', accentColor)
      root.style.setProperty('--glow-a', hexToRgba(accentColor, 0.2))
    } else {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--glow-a')
    }
  }, [accentColor])

  const [region, setRegion] = useState<Region>(() => load<Region | null>(KEYS.region, null) ?? regionFromZone(zone))
  const [alertScope, setAlertScope] = useState<AlertScope>(() => load<AlertScope>(KEYS.alertScope, 'off'))
  const [onboarded, setOnboarded] = useState<boolean>(() => {
    if (load<boolean>(KEYS.onboarded, false)) return true
    // Returning users who already set preferences shouldn't see onboarding.
    return load<string[]>(KEYS.favorites, []).length > 0 || load<string | null>(KEYS.timezone, null) !== null
  })

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
      getPrediction,
      setPrediction,
    }),
    [region, isFavorite, toggle, followed.isFollowed, followed.toggle, followedNames, getPrediction, setPrediction],
  )

  const predSummary = useMemo(() => summarize(preds, live), [preds, live])

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
        theme={theme}
        onToggleTheme={toggleTheme}
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
          <StatsView scorers={scorers} keepers={keepers} loading={statsLoading} matchesCounted={matchesCounted} />
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
            predSummary={predSummary}
            alertScope={alertScope}
          />
        )}
      </main>

      <footer className="footer">
        <span>Data: ESPN public API · Schedule cached locally · Times shown in {zone}</span>
        <span>Built for the love of the game ⚽</span>
      </footer>

      <InstallHint />
      {!onboarded && (
        <Onboarding
          isFav={isFavorite}
          toggleFav={toggle}
          setMany={setMany}
          tzId={tzId}
          setTimezone={setTimezone}
          region={region}
          onRegionChange={onRegionChange}
          alertScope={alertScope}
          onAlertScopeChange={onAlertScopeChange}
          onDone={() => {
            setOnboarded(true)
            save(KEYS.onboarded, true)
            if (alertScope !== 'off') requestPermission()
          }}
        />
      )}
    </div>
    </PlayerModalProvider>
  )
}
