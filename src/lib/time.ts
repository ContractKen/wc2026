// All timezone math uses the native Intl API — no date library needed.
// Match kickoff times are stored as UTC ISO strings and converted on the fly.

export interface TimeOfDay {
  key: string
  label: string
  icon: string
}

// Buckets a local 0–23 hour into a friendly part of the day.
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 0 && hour < 4) return { key: 'midnight', label: 'Midnight', icon: '🌌' }
  if (hour < 7) return { key: 'early', label: 'Early morning', icon: '🌅' }
  if (hour < 11) return { key: 'morning', label: 'Morning', icon: '☀️' }
  if (hour < 16) return { key: 'afternoon', label: 'Afternoon', icon: '🌤️' }
  if (hour < 20) return { key: 'evening', label: 'Evening', icon: '🌇' }
  return { key: 'night', label: 'Night', icon: '🌙' }
}

function partsOf(utcISO: string, timeZone: string): Record<string, string> {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const out: Record<string, string> = {}
  for (const p of dtf.formatToParts(new Date(utcISO))) out[p.type] = p.value
  return out
}

export interface ZonedTime {
  time: string // "3:00 PM"
  weekday: string // "Thu"
  day: string // "11"
  month: string // "Jun"
  hour24: number
  tod: TimeOfDay
  // Stable key for grouping matches by local calendar day.
  dayKey: string // "2026-06-11"
  dayHeading: string // "Thursday, Jun 11"
}

export function zoned(utcISO: string, timeZone: string): ZonedTime {
  const p = partsOf(utcISO, timeZone)
  const hour24 = hour24In(utcISO, timeZone)
  const longWeekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(
    new Date(utcISO),
  )
  // Sortable YYYY-MM-DD in the target zone.
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(utcISO))
  return {
    time: `${p.hour}:${p.minute} ${p.dayPeriod}`,
    weekday: p.weekday,
    day: p.day,
    month: p.month,
    hour24,
    tod: timeOfDay(hour24),
    dayKey: ymd,
    dayHeading: `${longWeekday}, ${p.month} ${p.day}`,
  }
}

function hour24In(utcISO: string, timeZone: string): number {
  const h = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(new Date(utcISO))
  // en-GB can yield "24" at midnight; normalize to 0.
  const n = parseInt(h, 10)
  return n === 24 ? 0 : n
}

// e.g. "in 3 days", "in 2h 15m", "live", "started"
export function countdown(utcISO: string, now: Date): string {
  const ms = new Date(utcISO).getTime() - now.getTime()
  if (ms <= 0) return 'started'
  const mins = Math.floor(ms / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (days >= 1) return `in ${days}d ${hours}h`
  if (hours >= 1) return `in ${hours}h ${m}m`
  return `in ${m}m`
}
