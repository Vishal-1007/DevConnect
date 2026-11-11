export interface SessionRecordingMeta {
  id: string
  title: string
  partnerName: string
  sessionType: string
  durationSec: number
  createdAt: string
  downloadName: string
}

const STORAGE_KEY = 'dc_mentor_session_recordings'

export function loadRecordingArchive(): SessionRecordingMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SessionRecordingMeta[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRecordingMeta(meta: SessionRecordingMeta) {
  const list = loadRecordingArchive()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([meta, ...list].slice(0, 20)))
}

export function deleteRecordingMeta(id: string) {
  const list = loadRecordingArchive().filter((r) => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
