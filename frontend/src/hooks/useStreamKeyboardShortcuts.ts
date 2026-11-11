import { useEffect } from 'react'
import { SEEK_STEP_SECONDS } from '../lib/streamPlayerUtils'

interface UseStreamKeyboardShortcutsOptions {
  enabled: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}

export function useStreamKeyboardShortcuts({
  enabled,
  videoRef,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: UseStreamKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const video = videoRef.current
      if (!video) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (video.paused) void video.play()
        else video.pause()
        return
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault()
        video.currentTime = Math.min(video.duration || 0, video.currentTime + SEEK_STEP_SECONDS)
        return
      }

      if (event.code === 'ArrowLeft') {
        event.preventDefault()
        video.currentTime = Math.max(0, video.currentTime - SEEK_STEP_SECONDS)
        return
      }

      if (event.shiftKey && event.code === 'KeyN' && canGoNext) {
        event.preventDefault()
        onNext()
        return
      }

      if (event.shiftKey && event.code === 'KeyP' && canGoPrevious) {
        event.preventDefault()
        onPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, videoRef, onPrevious, onNext, canGoPrevious, canGoNext])
}
