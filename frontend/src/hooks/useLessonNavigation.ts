import { useCallback, useMemo } from 'react'
import type { StreamLesson } from '../api/learningStreamsApi'

export type FlatLesson = StreamLesson & { sectionTitle: string }

export function useLessonNavigation(flatLessons: FlatLesson[], activeLessonId: string | null) {
  const currentIndex = useMemo(
    () => flatLessons.findIndex((l) => l.id === activeLessonId),
    [flatLessons, activeLessonId],
  )

  const previousLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < flatLessons.length - 1
    ? flatLessons[currentIndex + 1]
    : null

  const canGoPrevious = previousLesson != null && !previousLesson.locked
  const canGoNext = nextLesson != null && !nextLesson.locked

  const getPlayableLesson = useCallback(
    (lesson: FlatLesson | null) => (lesson && !lesson.locked && lesson.videoUrl ? lesson : null),
    [],
  )

  return {
    currentIndex,
    previousLesson: getPlayableLesson(previousLesson),
    nextLesson: getPlayableLesson(nextLesson),
    canGoPrevious: Boolean(getPlayableLesson(previousLesson)),
    canGoNext: Boolean(getPlayableLesson(nextLesson)),
  }
}
