// Official, rights-holding broadcasters for WC 2026 by region, with links and
// Free / 4K-UHD flags. Only legitimate sources — ESPN's per-match feed carries
// US listings, so for the US we match those names; other regions use the
// national rights-holder. Availability and 4K are broadcaster-/match-dependent
// and being finalised for 2026 — treat as indicative.
export type Region = 'US' | 'UK' | 'IN' | 'CA' | 'AU' | 'INTL'

export interface Broadcaster {
  name: string
  url: string
  free: boolean // free-to-air or free streaming (login/licence may apply)
  uhd: boolean // 4K/UHD offered for at least select matches
  note?: string
  keys?: string[] // lowercase fragments to match ESPN's per-match broadcast names (US)
}

export const REGIONS: { id: Region; label: string }[] = [
  { id: 'IN', label: 'India' },
  { id: 'UK', label: 'United Kingdom' },
  { id: 'US', label: 'United States' },
  { id: 'CA', label: 'Canada' },
  { id: 'AU', label: 'Australia' },
  { id: 'INTL', label: 'Other / International' },
]

export const BROADCASTERS: Record<Region, Broadcaster[]> = {
  IN: [
    {
      name: 'JioHotstar',
      url: 'https://www.hotstar.com/in',
      free: false,
      uhd: false,
      note: 'Streaming — subscription (2026 rights being confirmed)',
    },
    { name: 'Star Sports', url: 'https://www.starsports.com/', free: false, uhd: false, note: 'TV (cable/DTH)' },
  ],
  UK: [
    {
      name: 'BBC iPlayer',
      url: 'https://www.bbc.co.uk/iplayer',
      free: true,
      uhd: true,
      note: 'Free with a UK TV licence · select matches in 4K UHD',
    },
    { name: 'ITVX', url: 'https://www.itv.com/watch', free: true, uhd: false, note: 'Free (registration)' },
  ],
  US: [
    {
      name: 'FOX / FS1',
      url: 'https://www.foxsports.com/live',
      free: true,
      uhd: false,
      note: 'Free over-the-air; app needs a TV-provider login',
      keys: ['fox', 'fs1'],
    },
    {
      name: 'Telemundo',
      url: 'https://www.telemundodeportes.com/',
      free: true,
      uhd: false,
      note: 'Free over-the-air (Spanish)',
      keys: ['tele', 'universo'],
    },
    {
      name: 'Peacock',
      url: 'https://www.peacocktv.com/',
      free: false,
      uhd: false,
      note: 'Subscription (Spanish-language streams)',
      keys: ['peacock'],
    },
  ],
  CA: [
    { name: 'CTV', url: 'https://www.ctv.ca/', free: true, uhd: false, note: 'Select matches free-to-air' },
    { name: 'TSN', url: 'https://www.tsn.ca/', free: false, uhd: false, note: 'Subscription' },
    { name: 'RDS', url: 'https://www.rds.ca/', free: false, uhd: false, note: 'Subscription (French)' },
  ],
  AU: [
    { name: 'SBS On Demand', url: 'https://www.sbs.com.au/ondemand/', free: true, uhd: false, note: 'Free-to-air' },
    { name: 'Optus Sport', url: 'https://sport.optus.com.au/', free: false, uhd: false, note: 'Subscription' },
  ],
  INTL: [
    {
      name: 'Find your broadcaster',
      url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
      free: false,
      uhd: false,
      note: 'Check your national rights-holder',
    },
  ],
}

const CA_ZONES = new Set([
  'America/Toronto', 'America/Vancouver', 'America/Edmonton',
  'America/Winnipeg', 'America/Halifax', 'America/St_Johns', 'America/Montreal',
])

export function regionFromZone(zone: string): Region {
  if (zone === 'Asia/Kolkata' || zone.startsWith('Asia/Calcutta')) return 'IN'
  if (zone === 'Europe/London') return 'UK'
  if (zone.startsWith('Australia/')) return 'AU'
  if (CA_ZONES.has(zone)) return 'CA'
  if (zone.startsWith('America/')) return 'US'
  return 'INTL'
}

// Resolve the broadcasters to show for a match in a region. For the US we narrow
// to the channels ESPN says carry that specific match (falling back to all).
export function watchOptions(region: Region, espnNames: string[]): Broadcaster[] {
  const list = BROADCASTERS[region]
  if (region !== 'US' || espnNames.length === 0) return list
  const lower = espnNames.map((n) => n.toLowerCase())
  const matched = list.filter((b) => b.keys?.some((k) => lower.some((n) => n.includes(k))))
  return matched.length > 0 ? matched : list
}
