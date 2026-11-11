import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'devconnect-stream-player-prefs'

export interface StreamPlayerPreferences {
  autoplayNext: boolean
  playbackRate: number
  volume: number
}

const DEFAULT_PREFS: StreamPlayerPreferences = {
  autoplayNext: true,
  playbackRate: 1,
  volume: 1,
}

function readPrefs(): StreamPlayerPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<StreamPlayerPreferences>
    return {
      autoplayNext: parsed.autoplayNext ?? DEFAULT_PREFS.autoplayNext,
      playbackRate: parsed.playbackRate ?? DEFAULT_PREFS.playbackRate,
      volume: parsed.volume ?? DEFAULT_PREFS.volume,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function useStreamPlayerPreferences() {
  const [prefs, setPrefs] = useState<StreamPlayerPreferences>(readPrefs)

  const persist = useCallback((next: StreamPlayerPreferences) => {
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const setAutoplayNext = useCallback((autoplayNext: boolean) => {
    persist({ ...readPrefs(), autoplayNext })
  }, [persist])

  const setPlaybackRate = useCallback((playbackRate: number) => {
    persist({ ...readPrefs(), playbackRate })
  }, [persist])

  const setVolume = useCallback((volume: number) => {
    persist({ ...readPrefs(), volume: Math.max(0, Math.min(1, volume)) })
  }, [persist])

  useEffect(() => {
    setPrefs(readPrefs())
  }, [])

  return { prefs, setAutoplayNext, setPlaybackRate, setVolume }
}
