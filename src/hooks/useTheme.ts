import { useCallback, useEffect, useState } from 'react'
import { KEYS, load, save } from '../lib/storage'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => load<Theme>(KEYS.theme, 'dark'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      save(KEYS.theme, next)
      return next
    })
  }, [])

  return { theme, toggle }
}
