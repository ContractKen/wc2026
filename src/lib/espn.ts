import type {
  AthleteProfile,
  CommentaryItem,
  H2HGame,
  Lineup,
  LiveState,
  MatchEvent,
  MatchSummary,
  SquadPlayer,
  TeamRef,
  TeamStats,
} from './types'

// In dev we hit the Vite proxy (/espn -> site.api.espn.com) to dodge CORS.
// A production build calls ESPN directly (it returns permissive CORS headers).
const BASE = import.meta.env.DEV
  ? '/espn'
  : 'https://site.api.espn.com'

// Athlete profiles live on a different ESPN host.
const WEB_BASE = import.meta.env.DEV
  ? '/espn-web'
  : 'https://site.web.api.espn.com'

const SCOREBOARD = `${BASE}/apis/site/v2/sports/soccer/fifa.world/scoreboard`
const SUMMARY = `${BASE}/apis/site/v2/sports/soccer/fifa.world/summary`

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

// ---- Match summary: key events + running commentary ----

interface RawKeyEvent {
  id?: string
  type?: { text?: string; type?: string }
  text?: string
  shortText?: string
  clock?: { displayValue?: string }
  period?: { number?: number }
  scoringPlay?: boolean
  team?: { displayName?: string }
  participants?: Array<{ athlete?: { id?: string; displayName?: string } }>
}

interface RawCommentary {
  sequence?: number
  time?: { displayValue?: string }
  text?: string
}

function classify(typeText: string, rawType: string, scoring: boolean): MatchEvent['kind'] {
  const s = `${typeText} ${rawType}`.toLowerCase()
  if (s.includes('yellow')) return s.includes('second') ? 'red' : 'yellow'
  if (s.includes('red')) return 'red'
  if (s.includes('substitut')) return 'sub'
  if (s.includes('var') || s.includes('video')) return 'var'
  if (s.includes('miss') || s.includes('saved')) return 'penalty-miss'
  if (scoring || s.includes('goal')) return 'goal'
  if (s.includes('kickoff') || s.includes('end') || s.includes('half') || s.includes('whistle'))
    return 'whistle'
  return 'other'
}

interface RawSummary {
  keyEvents?: RawKeyEvent[]
  commentary?: RawCommentary[]
  boxscore?: {
    teams?: Array<{
      homeAway?: 'home' | 'away'
      team?: { displayName?: string }
      statistics?: Array<{ name?: string; label?: string; displayValue?: string }>
    }>
  }
  rosters?: Array<{
    homeAway?: 'home' | 'away'
    formation?: string
    team?: { displayName?: string }
    roster?: Array<{
      starter?: boolean
      jersey?: string
      subbedIn?: boolean
      subbedOut?: boolean
      athlete?: { id?: string; displayName?: string }
      position?: { abbreviation?: string }
    }>
  }>
  headToHeadGames?: Array<{
    events?: Array<{
      gameDate?: string
      score?: string
      gameResult?: string
      competitionName?: string
      leagueName?: string
    }>
  }>
}

function parseLineups(data: RawSummary): Lineup[] {
  return (data.rosters || []).map((r) => ({
    homeAway: r.homeAway || 'home',
    teamName: r.team?.displayName || '',
    formation: r.formation || '',
    players: (r.roster || []).map((p) => ({
      id: p.athlete?.id || '',
      name: p.athlete?.displayName || '',
      pos: p.position?.abbreviation || '',
      jersey: p.jersey || '',
      starter: !!p.starter,
      subbedIn: !!p.subbedIn,
      subbedOut: !!p.subbedOut,
    })),
  }))
}

function parseStats(data: RawSummary): TeamStats[] {
  return (data.boxscore?.teams || []).map((t) => ({
    homeAway: t.homeAway || 'home',
    teamName: t.team?.displayName || '',
    stats: (t.statistics || []).map((s) => ({
      name: s.name || '',
      label: s.label || s.name || '',
      value: s.displayValue || '',
    })),
  }))
}

function parseH2H(data: RawSummary): H2HGame[] {
  const games = data.headToHeadGames?.[0]?.events || []
  return games.slice(0, 6).map((g) => ({
    date: g.gameDate || '',
    score: g.score || '',
    competition: g.competitionName || g.leagueName || '',
    result: g.gameResult || '',
  }))
}

export async function fetchSummary(eventId: string): Promise<MatchSummary> {
  const res = await fetch(`${SUMMARY}?event=${eventId}`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`ESPN summary ${res.status}`)
  const data = (await res.json()) as RawSummary

  const events: MatchEvent[] = (data.keyEvents || []).map((e, i) => {
    const typeText = e.type?.text || ''
    const parts = e.participants || []
    const scorer = parts[0]?.athlete
    const assist = parts[1]?.athlete
    return {
      id: e.id || String(i),
      typeText,
      kind: classify(typeText, e.type?.type || '', !!e.scoringPlay),
      text: e.text || e.shortText || typeText,
      clock: e.clock?.displayValue || '',
      period: e.period?.number || 0,
      scoringPlay: !!e.scoringPlay,
      team: e.team?.displayName || '',
      scorer: scorer?.id ? { id: scorer.id, name: scorer.displayName || '' } : undefined,
      assist: assist?.id ? { id: assist.id, name: assist.displayName || '' } : undefined,
    }
  })

  const commentary: CommentaryItem[] = (data.commentary || []).map((c, i) => ({
    sequence: c.sequence ?? i,
    clock: c.time?.displayValue || '',
    text: c.text || '',
  }))

  return {
    events,
    commentary,
    lineups: parseLineups(data),
    stats: parseStats(data),
    h2h: parseH2H(data),
  }
}

// A team's squad (for following players). Fetched on demand.
export async function fetchSquad(teamId: string): Promise<SquadPlayer[]> {
  const res = await fetch(
    `${BASE}/apis/site/v2/sports/soccer/fifa.world/teams/${teamId}/roster`,
    { headers: { accept: 'application/json' } },
  )
  if (!res.ok) throw new Error(`ESPN roster ${res.status}`)
  const data = (await res.json()) as {
    athletes?: Array<{
      id?: string
      displayName?: string
      jersey?: string
      position?: { abbreviation?: string }
      // some responses group by position with an items[] array
      items?: Array<{
        id?: string
        displayName?: string
        jersey?: string
        position?: { abbreviation?: string }
      }>
    }>
  }
  const flat = (data.athletes || []).flatMap((a) => (a.items ? a.items : [a]))
  return flat
    .filter((p) => p.id && p.displayName)
    .map((p) => ({
      id: p.id!,
      name: p.displayName!,
      pos: p.position?.abbreviation || '',
      jersey: p.jersey || '',
    }))
}

// A single player's profile (name, position, age, club).
export async function fetchAthlete(id: string): Promise<AthleteProfile> {
  const res = await fetch(`${WEB_BASE}/apis/common/v3/sports/soccer/fifa.world/athletes/${id}`, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`ESPN athlete ${res.status}`)
  const raw = (await res.json()) as {
    athlete?: Record<string, unknown>
  } & Record<string, unknown>
  const a = (raw.athlete || raw) as {
    id?: string
    displayName?: string
    jersey?: string
    age?: number
    position?: { name?: string }
    team?: { displayName?: string }
    headshot?: { href?: string }
    links?: { href?: string }[]
  }
  return {
    id: String(a.id || id),
    name: a.displayName || '',
    position: a.position?.name || '',
    age: a.age,
    jersey: a.jersey,
    club: a.team?.displayName,
    headshot: a.headshot?.href,
    link: a.links?.[0]?.href,
  }
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
