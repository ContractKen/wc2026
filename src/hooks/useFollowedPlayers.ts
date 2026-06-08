import { useCallback, useMemo, useState } from 'react'
import { KEYS, load, save } from '../lib/storage'
import type { FollowedPlayer } from '../lib/types'

export function useFollowedPlayers() {
  const [players, setPlayers] = useState<FollowedPlayer[]>(() =>
    load<FollowedPlayer[]>(KEYS.players, []),
  )
  const ids = useMemo(() => new Set(players.map((p) => p.id)), [players])

  const toggle = useCallback((p: FollowedPlayer) => {
    setPlayers((prev) => {
      const next = prev.some((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : [...prev, p]
      save(KEYS.players, next)
      return next
    })
  }, [])

  const isFollowed = useCallback((id: string) => ids.has(id), [ids])

  return { players, toggle, isFollowed, count: players.length }
}
