import { useEffect, useMemo, useState } from 'react'
import './index.css'
import type { Match } from './lib/types'
import matchesData from './data/matches.json'
import { Header } from './components/Header'
import { LiveTicker } from './components/LiveTicker'
import { ScheduleView } from './components/ScheduleView'
import { GroupsView } from './components/GroupsView'
import { BracketView } from './components/BracketView'
import { FavoritesView } from './components/FavoritesView'
import { useTimezone } from './hooks/useTimezone'
import { useFavorites } from './hooks/useFavorites'
import { useLiveScores } from './hooks/useLiveScores'
import { isLive } from './lib/match'

const MATCHES = (matchesData as Match[]).slice().sort((a, b) => a.utc.localeCompare(b.utc))

type Tab = 'schedule' | 'groups' | 'bracket' | 'favorites'

// A clock that ticks every 30s so countdowns / "today" filters stay fresh.
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function App() {
  const [tab, setTab] = useState<Tab>('schedule')
  const { tzId, zone, setTimezone } = useTimezone()
  const { favorites, isFavorite, toggle, count } = useFavorites()
  const { live, status, updatedAt } = useLiveScores()
  const now = useNow()

  const liveCount = useMemo(() => MATCHES.filter((m) => isLive(live[m.id])).length, [live])

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'groups', label: 'Groups' },
    { id: 'bracket', label: 'Bracket' },
    { id: 'favorites', label: 'Favorites', badge: count || undefined },
  ]

  return (
    <div className="app">
      <Header tzId={tzId} onTzChange={setTimezone} status={status} updatedAt={updatedAt} />
      <LiveTicker matches={MATCHES} live={live} zone={zone} now={now} />

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'tab--on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'schedule' && liveCount > 0 && (
              <span className="tab__live">{liveCount} live</span>
            )}
            {t.badge ? <span className="tab__badge">{t.badge}</span> : null}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'schedule' && (
          <ScheduleView
            matches={MATCHES}
            live={live}
            zone={zone}
            now={now}
            isFav={isFavorite}
            toggleFav={toggle}
          />
        )}
        {tab === 'groups' && (
          <GroupsView matches={MATCHES} live={live} isFav={isFavorite} toggleFav={toggle} />
        )}
        {tab === 'bracket' && <BracketView matches={MATCHES} live={live} zone={zone} />}
        {tab === 'favorites' && (
          <FavoritesView
            matches={MATCHES}
            live={live}
            zone={zone}
            favorites={favorites}
            isFav={isFavorite}
            toggleFav={toggle}
          />
        )}
      </main>

      <footer className="footer">
        <span>Data: ESPN public API · Schedule cached locally · Times shown in {zone}</span>
        <span>Built for the love of the game ⚽</span>
      </footer>
    </div>
  )
}
