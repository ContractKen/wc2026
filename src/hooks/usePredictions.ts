import { useCallback, useState } from 'react'
import { KEYS, load, save } from '../lib/storage'
import type { Prediction } from '../lib/predictions'

export function usePredictions() {
  const [preds, setPreds] = useState<Record<string, Prediction>>(() =>
    load<Record<string, Prediction>>(KEYS.predictions, {}),
  )

  const setPrediction = useCallback((matchId: string, home: number, away: number) => {
    setPreds((prev) => {
      const next = { ...prev, [matchId]: { home, away } }
      save(KEYS.predictions, next)
      return next
    })
  }, [])

  const getPrediction = useCallback((matchId: string) => preds[matchId], [preds])

  return { preds, setPrediction, getPrediction }
}
