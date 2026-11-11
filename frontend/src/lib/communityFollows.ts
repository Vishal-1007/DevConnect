import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'devconnect_followed_authors'
const CHANGE_EVENT = 'community-follows-changed'

const EMPTY_SET = new Set<string>()
let cachedRaw = ''
let cachedFollowedIds: Set<string> = EMPTY_SET

function readStorageRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Must return the same Set reference when localStorage data is unchanged (useSyncExternalStore contract). */
function readFollowedIds(): Set<string> {
  const raw = readStorageRaw()
  if (raw === cachedRaw) {
    return cachedFollowedIds
  }

  cachedRaw = raw
  if (!raw) {
    cachedFollowedIds = EMPTY_SET
    return cachedFollowedIds
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      cachedFollowedIds = EMPTY_SET
      return cachedFollowedIds
    }
    const ids = parsed.filter((id): id is string => typeof id === 'string')
    cachedFollowedIds = ids.length === 0 ? EMPTY_SET : new Set(ids)
  } catch {
    cachedFollowedIds = EMPTY_SET
  }

  return cachedFollowedIds
}

function persistFollowedIds(ids: Set<string>) {
  const serialized = JSON.stringify([...ids])
  localStorage.setItem(STORAGE_KEY, serialized)
  cachedRaw = serialized
  cachedFollowedIds = ids.size === 0 ? EMPTY_SET : new Set(ids)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function useFollowedAuthors() {
  const followedIds = useSyncExternalStore(subscribe, readFollowedIds, () => EMPTY_SET)

  const isFollowing = useCallback(
    (authorId: string) => followedIds.has(authorId),
    [followedIds],
  )

  const toggleFollow = useCallback((authorId: string) => {
    const next = new Set(readFollowedIds())
    if (next.has(authorId)) next.delete(authorId)
    else next.add(authorId)
    persistFollowedIds(next)
    return next.has(authorId)
  }, [])

  return { followedIds, isFollowing, toggleFollow }
}
