import { useCallback, useState } from 'react'
import { KEYS, load, save } from '../lib/storage'
import { resolveZone } from '../data/timezones'

export function useTimezone() {
  const [tzId, setTzId] = useState<string>(() => load(KEYS.timezone, 'auto'))

  const setTimezone = useCallback((id: string) => {
    setTzId(id)
    save(KEYS.timezone, id)
  }, [])

  return { tzId, zone: resolveZone(tzId), setTimezone }
}
