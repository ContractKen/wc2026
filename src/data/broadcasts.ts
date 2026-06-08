// Indicative WC 2026 broadcasters by region. ESPN's per-match feed only carries
// US listings, so for other regions we show the national rights-holder instead.
// (Approximate — verify against local listings closer to the tournament.)
export type Region = 'US' | 'UK' | 'IN' | 'CA' | 'AU' | 'INTL'

export const REGIONS: { id: Region; label: string }[] = [
  { id: 'US', label: 'United States' },
  { id: 'UK', label: 'United Kingdom' },
  { id: 'IN', label: 'India' },
  { id: 'CA', label: 'Canada' },
  { id: 'AU', label: 'Australia' },
  { id: 'INTL', label: 'Other / International' },
]

export const BROADCASTERS: Record<Region, string[]> = {
  US: ['FOX / FS1', 'Telemundo', 'Peacock'],
  UK: ['BBC', 'ITV'],
  IN: ['JioHotstar', 'Star Sports'],
  CA: ['TSN', 'CTV', 'RDS'],
  AU: ['Optus Sport', 'SBS'],
  INTL: ['Check local listings'],
}

const CA_ZONES = new Set([
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
  'America/St_Johns',
  'America/Montreal',
])

// Best-effort region guess from the user's selected/auto IANA time zone.
export function regionFromZone(zone: string): Region {
  if (zone === 'Asia/Kolkata' || zone.startsWith('Asia/Calcutta')) return 'IN'
  if (zone === 'Europe/London') return 'UK'
  if (zone.startsWith('Australia/')) return 'AU'
  if (CA_ZONES.has(zone)) return 'CA'
  if (zone.startsWith('America/')) return 'US'
  return 'INTL'
}
