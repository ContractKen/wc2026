export interface TeamRef {
  code: string
  name: string
  flag: string
  placeholder: boolean
}

export type Stage = 'group' | 'knockout'

export interface Match {
  id: string
  utc: string
  home: TeamRef
  away: TeamRef
  venueId: string | null
  venue: string | null
  city: string | null
  country: string | null
  broadcast: string[]
  stage: Stage
  group?: string
  matchday?: number
  round?: string
}

export interface Team {
  code: string
  name: string
  flag: string
  group: string
  espnId?: string
}

export type MatchState = 'pre' | 'in' | 'post'

export interface LiveState {
  state: MatchState
  completed: boolean
  detail: string
  shortDetail: string
  clock: string
  homeScore: number | null
  awayScore: number | null
  // For knockout fixtures, the real teams once they are decided.
  home?: TeamRef
  away?: TeamRef
}

export interface MatchEvent {
  id: string
  typeText: string // "Goal", "Yellow Card", "Substitution"…
  kind: 'goal' | 'yellow' | 'red' | 'sub' | 'var' | 'penalty-miss' | 'whistle' | 'other'
  text: string
  clock: string // "23'", "90'+5'"
  period: number
  scoringPlay: boolean
  team: string // team display name, if any
  scorer?: { id: string; name: string }
  assist?: { id: string; name: string }
}

export interface Goal {
  matchId: string
  scorerId: string
  scorerName: string
  team: string
  assistName?: string
  ownGoal: boolean
  penalty: boolean
}

export interface ScorerRow {
  id: string
  name: string
  team: string
  goals: number
  assists: number
}

export interface CommentaryItem {
  sequence: number
  clock: string
  text: string
}

export interface LineupPlayer {
  id: string
  name: string
  pos: string
  jersey: string
  starter: boolean
  subbedIn: boolean
  subbedOut: boolean
}

export interface Lineup {
  homeAway: 'home' | 'away'
  teamName: string
  formation: string
  players: LineupPlayer[]
}

export interface TeamStat {
  name: string
  label: string
  value: string
}

export interface TeamStats {
  homeAway: 'home' | 'away'
  teamName: string
  stats: TeamStat[]
}

export interface H2HGame {
  date: string
  score: string
  competition: string
  result: string // W / L / D from the perspective stored
}

export interface MatchSummary {
  events: MatchEvent[]
  commentary: CommentaryItem[]
  lineups: Lineup[]
  stats: TeamStats[]
  h2h: H2HGame[]
}

export interface SquadPlayer {
  id: string
  name: string
  pos: string
  jersey: string
}

export interface FollowedPlayer {
  id: string
  name: string
  teamCode: string
}

export interface AthleteProfile {
  id: string
  name: string
  position: string
  age?: number
  jersey?: string
  club?: string
  headshot?: string
  link?: string
}

export interface Venue {
  id: string
  name: string
  altName?: string
  city: string
  country: string
  capacity: number
  tidbit: string
}

export interface TimezoneOption {
  id: string // IANA zone, or 'auto'
  abbr: string
  label: string
}
