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

export function matchesToICS(matches: Match[], live: LiveMap, label = 'FIFA World Cup 2026'): string {
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
      'END:VEVENT',
    )
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
