export const COMPLETION_THRESHOLD = 0.9
export const INTRO_SKIP_SECONDS = 30
export const AUTOPLAY_COUNTDOWN_SECONDS = 5
export const PROGRESS_SAVE_INTERVAL_MS = 5000
export const SEEK_STEP_SECONDS = 10

export function formatLessonDuration(seconds: number): string {
  if (seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatPlayerTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function isLessonComplete(progressSeconds: number, durationSeconds: number): boolean {
  if (durationSeconds <= 0) return progressSeconds >= 30
  return progressSeconds / durationSeconds >= COMPLETION_THRESHOLD
}
