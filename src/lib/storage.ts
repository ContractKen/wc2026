// Tiny typed localStorage helpers. Safe if storage is unavailable.
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export const KEYS = {
  timezone: 'wc2026.timezone',
  favorites: 'wc2026.favorites',
  players: 'wc2026.players',
  alertScope: 'wc2026.alertScope',
  region: 'wc2026.region',
} as const
