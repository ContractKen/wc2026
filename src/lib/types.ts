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
