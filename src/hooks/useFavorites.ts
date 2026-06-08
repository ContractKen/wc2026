import { useCallback, useMemo, useState } from 'react'
import { KEYS, load, save } from '../lib/storage'

export function useFavorites() {
  const [codes, setCodes] = useState<string[]>(() => load<string[]>(KEYS.favorites, []))
  const set = useMemo(() => new Set(codes), [codes])

  const toggle = useCallback((code: string) => {
    setCodes((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      save(KEYS.favorites, next)
      return next
    })
  }, [])

  const isFavorite = useCallback((code: string) => set.has(code), [set])

  // Bulk add or remove a list of codes in one update (used by the country picker).
  const setMany = useCallback((list: string[], selected: boolean) => {
    setCodes((prev) => {
      const s = new Set(prev)
      for (const c of list) {
        if (selected) s.add(c)
        else s.delete(c)
      }
      const next = [...s]
      save(KEYS.favorites, next)
      return next
    })
  }, [])

  return { favorites: set, toggle, setMany, isFavorite, count: codes.length }
}
