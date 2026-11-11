import { useCallback, useEffect, useRef, useState } from 'react'
import { isLessonComplete, PROGRESS_SAVE_INTERVAL_MS } from '../lib/streamPlayerUtils'
import type { LessonProgressResponse } from '../api/learningStreamsApi'

interface SaveProgressArgs {
  lessonId: string
  progressSeconds: number
  completed: boolean
  watchedDurationSeconds?: number
}

interface UseStreamProgressOptions {
  courseId: string
  saveProgress: (args: SaveProgressArgs) => Promise<LessonProgressResponse | void>
  onProgressSaved?: (response: LessonProgressResponse) => void
}

export function useStreamProgress({ courseId, saveProgress, onProgressSaved }: UseStreamProgressOptions) {
  const [lessonStates, setLessonStates] = useState<Record<string, { progressSeconds: number; completed: boolean }>>({})
  const [courseProgressPercent, setCourseProgressPercent] = useState(0)
  const lastSaveRef = useRef(0)
  const watchedDurationRef = useRef(0)
  const activeLessonRef = useRef<string | null>(null)

  const mergeLessonState = useCallback((lessonId: string, progressSeconds: number, completed: boolean) => {
    setLessonStates((prev) => {
      const existing = prev[lessonId]
      return {
        ...prev,
        [lessonId]: {
          progressSeconds: Math.max(existing?.progressSeconds ?? 0, progressSeconds),
          completed: (existing?.completed ?? false) || completed,
        },
      }
    })
  }, [])

  const persistProgress = useCallback(async (
    lessonId: string,
    progressSeconds: number,
    durationSeconds: number,
    force = false,
  ) => {
    const completed = isLessonComplete(progressSeconds, durationSeconds)
    mergeLessonState(lessonId, progressSeconds, completed)

    const now = Date.now()
    if (!force && now - lastSaveRef.current < PROGRESS_SAVE_INTERVAL_MS) {
      return
    }
    lastSaveRef.current = now

    try {
      const response = await saveProgress({
        lessonId,
        progressSeconds,
        completed,
        watchedDurationSeconds: watchedDurationRef.current,
      })
      if (response) {
        setCourseProgressPercent(response.courseProgressPercent)
        onProgressSaved?.(response)
      }
    } catch {
      // keep local state; next save will retry
    }
  }, [mergeLessonState, onProgressSaved, saveProgress])

  const flushProgress = useCallback(async (
    lessonId: string,
    progressSeconds: number,
    durationSeconds: number,
  ) => {
    await persistProgress(lessonId, progressSeconds, durationSeconds, true)
  }, [persistProgress])

  const seedFromCourse = useCallback((lessons: { id: string; progressSeconds: number; completed: boolean }[]) => {
    const seeded: Record<string, { progressSeconds: number; completed: boolean }> = {}
    for (const lesson of lessons) {
      seeded[lesson.id] = { progressSeconds: lesson.progressSeconds, completed: lesson.completed }
    }
    setLessonStates(seeded)
  }, [])

  useEffect(() => {
    activeLessonRef.current = null
    watchedDurationRef.current = 0
    lastSaveRef.current = 0
  }, [courseId])

  const trackWatchDuration = useCallback((deltaSeconds: number) => {
    if (deltaSeconds > 0 && deltaSeconds < 5) {
      watchedDurationRef.current += deltaSeconds
    }
  }, [])

  const getLessonState = useCallback((lessonId: string, fallback?: { progressSeconds: number; completed: boolean }) => {
    return lessonStates[lessonId] ?? fallback ?? { progressSeconds: 0, completed: false }
  }, [lessonStates])

  const markCompleted = useCallback((lessonId: string, progressSeconds: number) => {
    mergeLessonState(lessonId, progressSeconds, true)
  }, [mergeLessonState])

  return {
    lessonStates,
    courseProgressPercent,
    setCourseProgressPercent,
    seedFromCourse,
    persistProgress,
    flushProgress,
    trackWatchDuration,
    getLessonState,
    markCompleted,
    resetWatchDuration: () => { watchedDurationRef.current = 0 },
    setActiveLesson: (lessonId: string | null) => { activeLessonRef.current = lessonId },
  }
}
