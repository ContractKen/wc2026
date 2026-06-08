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

  return { favorites: set, toggle, isFavorite, count: codes.length }
}
