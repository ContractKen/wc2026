import type { LiveState, TeamRef } from './types'

// In dev we hit the Vite proxy (/espn -> site.api.espn.com) to dodge CORS.
// A production build calls ESPN directly (it returns permissive CORS headers).
const BASE = import.meta.env.DEV
  ? '/espn'
  : 'https://site.api.espn.com'

const SCOREBOARD = `${BASE}/apis/site/v2/sports/soccer/fifa.world/scoreboard`

interface RawStatusType {
  state?: string
  completed?: boolean
  detail?: string
  shortDetail?: string
}

interface RawStatus {
  type?: RawStatusType
  displayClock?: string
}

interface RawTeam {
  abbreviation?: string
  displayName?: string
  logo?: string
  logos?: { href: string }[]
}

interface RawCompetitor {
  homeAway: 'home' | 'away'
  score?: string
  team?: RawTeam
}

interface RawCompetition {
  status?: RawStatus
  competitors?: RawCompetitor[]
}

interface RawEvent {
  id: string
  date: string
  status?: RawStatus
  competitions?: RawCompetition[]
}

function teamRef(t: RawTeam | undefined): TeamRef | undefined {
  if (!t?.abbreviation) return undefined
  const flag = t.logos?.[0]?.href || t.logo || ''
  return { code: t.abbreviation, name: t.displayName || t.abbreviation, flag, placeholder: false }
}

function toLiveState(ev: RawEvent): LiveState {
  const comp = ev.competitions?.[0]
  const st = comp?.status?.type || ev.status?.type || {}
  const competitors = comp?.competitors || []
  const home = competitors.find((c) => c.homeAway === 'home')
  const away = competitors.find((c) => c.homeAway === 'away')
  const num = (s?: string) => (s == null || s === '' ? null : Number(s))
  return {
    state: (st.state as LiveState['state']) || 'pre',
    completed: !!st.completed,
    detail: st.detail || '',
    shortDetail: st.shortDetail || '',
    clock: comp?.status?.displayClock || ev.status?.displayClock || '',
    homeScore: num(home?.score),
    awayScore: num(away?.score),
    home: teamRef(home?.team),
    away: teamRef(away?.team),
  }
}

async function fetchEvents(datesParam?: string): Promise<RawEvent[]> {
  const url = datesParam
    ? `${SCOREBOARD}?dates=${datesParam}&limit=950`
    : `${SCOREBOARD}?limit=950`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`ESPN ${res.status}`)
  const data = (await res.json()) as { events?: RawEvent[] }
  return data.events || []
}

export type LiveMap = Record<string, LiveState>

function index(events: RawEvent[]): LiveMap {
  const map: LiveMap = {}
  for (const ev of events) map[ev.id] = toLiveState(ev)
  return map
}

// Full tournament snapshot — used once on load to capture any finished results.
export async function fetchAll(): Promise<LiveMap> {
  return index(await fetchEvents('20260611-20260719'))
}

// Narrow window around "now" (UTC) — cheap to poll frequently for live updates.
export async function fetchWindow(now: Date): Promise<LiveMap> {
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`
  const start = new Date(now.getTime() - 24 * 3600 * 1000)
  const end = new Date(now.getTime() + 24 * 3600 * 1000)
  return index(await fetchEvents(`${fmt(start)}-${fmt(end)}`))
}
