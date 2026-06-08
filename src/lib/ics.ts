import type { LiveState, Match } from './types'
import type { LiveMap } from './espn'

// Build an iCalendar file (UTC times) for the given matches and trigger a download.
function icsDate(iso: string): string {
  // 2026-06-11T19:00Z -> 20260611T190000Z
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function escape(text: string): string {
  return text.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

function teamName(side: 'home' | 'away', m: Match, ls?: LiveState): string {
  const resolved = ls?.[side]
  if (resolved && !resolved.placeholder) return resolved.name
  return m[side].name
}

// Minutes-before-kickoff → an iCalendar TRIGGER duration (e.g. 60 → "-PT1H").
function trigger(minutes: number): string {
  if (minutes === 0) return '-PT0M' // at kickoff
  if (minutes % (7 * 24 * 60) === 0) return `-P${minutes / (7 * 24 * 60)}W`
  if (minutes % (24 * 60) === 0) return `-P${minutes / (24 * 60)}D`
  if (minutes % 60 === 0) return `-PT${minutes / 60}H`
  return `-PT${minutes}M`
}

export interface ICSOptions {
  label?: string
  // Reminder lead times in minutes before kickoff; each becomes a VALARM.
  alarms?: number[]
}

export function matchesToICS(matches: Match[], live: LiveMap, opts: ICSOptions = {}): string {
  const label = opts.label ?? 'FIFA World Cup 2026'
  const alarms = opts.alarms ?? []
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WC2026 Tracker//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escape(label)}`,
  ]
  for (const m of matches) {
    const ls = live[m.id]
    const home = teamName('home', m, ls)
    const away = teamName('away', m, ls)
    const start = icsDate(m.utc)
    const end = icsDate(new Date(new Date(m.utc).getTime() + 105 * 60000).toISOString())
    const tag = m.stage === 'group' ? `Group ${m.group}` : m.round
    const summary = `${home} vs ${away} (WC ${tag})`
    const loc = [m.venue, m.city, m.country].filter(Boolean).join(', ')
    lines.push(
      'BEGIN:VEVENT',
      `UID:wc2026-${m.id}@tracker`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escape(summary)}`,
      `LOCATION:${escape(loc)}`,
      m.broadcast.length ? `DESCRIPTION:${escape('Broadcast: ' + m.broadcast.join(', '))}` : '',
    )
    for (const mins of alarms) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escape(summary)}`,
        `TRIGGER:${trigger(mins)}`,
        'END:VALARM',
      )
    }
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.filter(Boolean).join('\r\n')
}

export function downloadICS(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
