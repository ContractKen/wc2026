export type Tab = 'schedule' | 'groups' | 'bracket' | 'stats' | 'favorites'
const TABS: Tab[] = ['schedule', 'groups', 'bracket', 'stats', 'favorites']

export function getInitialTab(): Tab {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#/, '')
  return (TABS as string[]).includes(h) ? (h as Tab) : 'schedule'
}

export function setTabHash(tab: Tab): void {
  if (typeof history === 'undefined') return
  const url = new URL(location.href)
  url.hash = tab
  // Clear a one-shot ?m= match deep-link once navigating away.
  if (tab !== 'schedule') url.searchParams.delete('m')
  history.replaceState(null, '', url)
}

export function getInitialMatchId(): string | null {
  if (typeof location === 'undefined') return null
  return new URL(location.href).searchParams.get('m')
}

// A shareable absolute URL that opens this match in the schedule.
export function shareUrl(matchId: string): string {
  const url = new URL(location.href)
  url.hash = 'schedule'
  url.searchParams.set('m', matchId)
  return url.toString()
}
