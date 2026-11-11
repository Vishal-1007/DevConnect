import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Lock, Loader2 } from 'lucide-react'
import {
  useEnrollFreeStreamCourseMutation,
  useGetStreamCourseProgressQuery,
  useGetStreamCourseQuery,
  useGetStreamResumePlaybackQuery,
  useMarkLessonCompletedMutation,
  useSaveLessonProgressMutation,
} from '../api/learningStreamsApi'
import { StreamCourseSidebar } from '../components/learning-streams/StreamCourseSidebar'
import { StreamVideoPlayer } from '../components/learning-streams/StreamVideoPlayer'
import { useLessonNavigation } from '../hooks/useLessonNavigation'
import { useStreamPlayerPreferences } from '../hooks/useStreamPlayerPreferences'
import { useStreamProgress } from '../hooks/useStreamProgress'

export function StreamCoursePlayerPage() {
  const { courseId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const lessonFromUrl = searchParams.get('lessonId')

  const [activeLessonId, setActiveLessonId] = useState<string | null>(lessonFromUrl)
  const [resumeSeconds, setResumeSeconds] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const lastTimeRef = useRef(0)
  const seededRef = useRef(false)

  const { data: course, isLoading } = useGetStreamCourseQuery(courseId, { skip: !courseId })
  const { data: courseProgress } = useGetStreamCourseProgressQuery(courseId, { skip: !courseId })
  const { data: resumeInfo } = useGetStreamResumePlaybackQuery(courseId, { skip: !courseId })
  const [saveProgressMutation] = useSaveLessonProgressMutation()
  const [markCompletedMutation] = useMarkLessonCompletedMutation()
  const [enrollFree] = useEnrollFreeStreamCourseMutation()
  const { prefs, setAutoplayNext, setPlaybackRate, setVolume } = useStreamPlayerPreferences()

  const flatLessons = useMemo(() => {
    if (!course) return []
    return course.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, sectionTitle: s.title })))
  }, [course])

  const activeLesson = flatLessons.find((l) => l.id === activeLessonId)
    ?? flatLessons.find((l) => !l.locked && l.videoUrl)

  const {
    previousLesson,
    nextLesson,
    canGoPrevious,
    canGoNext,
  } = useLessonNavigation(flatLessons, activeLessonId ?? activeLesson?.id ?? null)

  const saveProgress = useCallback(async (args: {
    lessonId: string
    progressSeconds: number
    completed: boolean
    watchedDurationSeconds?: number
  }) => saveProgressMutation(args).unwrap(), [saveProgressMutation])

  const {
    courseProgressPercent,
    setCourseProgressPercent,
    seedFromCourse,
    persistProgress,
    flushProgress,
    getLessonState,
    markCompleted,
  } = useStreamProgress({
    courseId,
    saveProgress,
    onProgressSaved: (response) => setCourseProgressPercent(response.courseProgressPercent),
  })

  useEffect(() => {
    if (!course || seededRef.current) return
    seedFromCourse(flatLessons)
    seededRef.current = true
    if (courseProgress) {
      setCourseProgressPercent(courseProgress.progressPercent)
    }
  }, [course, flatLessons, seedFromCourse, courseProgress, setCourseProgressPercent])

  useEffect(() => {
    if (initialized || !course || flatLessons.length === 0) return

    if (lessonFromUrl && flatLessons.some((l) => l.id === lessonFromUrl && !l.locked)) {
      const lesson = flatLessons.find((l) => l.id === lessonFromUrl)!
      setActiveLessonId(lesson.id)
      setResumeSeconds(lesson.progressSeconds > 0 ? lesson.progressSeconds : 0)
      setInitialized(true)
      return
    }

    if (resumeInfo?.lessonId && flatLessons.some((l) => l.id === resumeInfo.lessonId && !l.locked)) {
      setActiveLessonId(resumeInfo.lessonId)
      setResumeSeconds(resumeInfo.hasProgress ? resumeInfo.progressSeconds : 0)
      setInitialized(true)
      return
    }

    const first = flatLessons.find((l) => !l.locked && l.videoUrl) ?? flatLessons[0]
    setActiveLessonId(first?.id ?? null)
    setResumeSeconds(first?.progressSeconds ?? 0)
    setInitialized(true)
  }, [initialized, course, flatLessons, lessonFromUrl, resumeInfo])

  useEffect(() => {
    if (course?.pricingType === 'FREE') {
      enrollFree(courseId).catch(() => {})
    }
  }, [course, courseId, enrollFree])

  const selectLesson = useCallback((lessonId: string) => {
    const lesson = flatLessons.find((l) => l.id === lessonId)
    if (!lesson || lesson.locked) return
    const state = getLessonState(lessonId, { progressSeconds: lesson.progressSeconds, completed: lesson.completed })
    setActiveLessonId(lessonId)
    setResumeSeconds(state.completed ? 0 : state.progressSeconds)
    setSearchParams({ lessonId }, { replace: true })
    lastTimeRef.current = 0
  }, [flatLessons, getLessonState, setSearchParams])

  const goPrevious = useCallback(() => {
    if (previousLesson) selectLesson(previousLesson.id)
  }, [previousLesson, selectLesson])

  const goNext = useCallback(() => {
    if (nextLesson) selectLesson(nextLesson.id)
  }, [nextLesson, selectLesson])

  const handlePause = useCallback((seconds: number) => {
    if (!activeLesson) return
    void flushProgress(activeLesson.id, seconds, activeLesson.durationSeconds)
  }, [activeLesson, flushProgress])

  const handleTimeUpdate = useCallback((seconds: number, duration: number) => {
    if (!activeLesson) return
    lastTimeRef.current = seconds
    void persistProgress(activeLesson.id, Math.floor(seconds), Math.floor(duration))
  }, [activeLesson, persistProgress])

  const handleCompleted = useCallback((seconds: number) => {
    if (!activeLesson) return
    markCompleted(activeLesson.id, seconds)
    void markCompletedMutation(activeLesson.id).catch(() => {
      void saveProgress({
        lessonId: activeLesson.id,
        progressSeconds: seconds,
        completed: true,
      })
    })
  }, [activeLesson, markCompleted, markCompletedMutation, saveProgress])

  const handleEnded = useCallback(() => {
    if (!activeLesson) return
    void flushProgress(activeLesson.id, activeLesson.durationSeconds, activeLesson.durationSeconds)
  }, [activeLesson, flushProgress])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!activeLesson) return
      void flushProgress(activeLesson.id, Math.floor(lastTimeRef.current), activeLesson.durationSeconds)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [activeLesson, flushProgress])

  const completedLessons = useMemo(() => {
    return flatLessons.filter((lesson) => {
      const state = getLessonState(lesson.id, { progressSeconds: lesson.progressSeconds, completed: lesson.completed })
      return state.completed
    }).length
  }, [flatLessons, getLessonState])

  const progressPercent = courseProgress?.progressPercent ?? courseProgressPercent

  if (isLoading || !course || !initialized) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0b0c14]">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  const isLocked = activeLesson?.locked || !activeLesson?.videoUrl

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-[#0b0c14]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-[#2d2e3e] px-4 py-3">
          <Link to={`/learning-streams/${courseId}`} className="text-[#8b8ca8] hover:text-white">
            <ChevronLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-violet-400">{course.title}</p>
            <p className="truncate text-sm font-semibold text-white">{activeLesson?.title ?? 'Select a lesson'}</p>
          </div>
          <p className="hidden text-[10px] text-[#8b8ca8] sm:block">
            {completedLessons}/{flatLessons.length} · {progressPercent}%
          </p>
        </div>

        {isLocked ? (
          <div className="flex flex-1 flex-col items-center justify-center bg-black p-8 text-center">
            <Lock size={40} className="mx-auto mb-3 text-violet-400" />
            <p className="mb-2 font-semibold text-white">This lesson is locked</p>
            <button
              type="button"
              onClick={() => navigate(`/learning-streams/${courseId}`)}
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              View course & purchase
            </button>
          </div>
        ) : activeLesson?.videoUrl ? (
          <StreamVideoPlayer
            lesson={activeLesson}
            resumeSeconds={resumeSeconds}
            prefs={prefs}
            autoplayEnabled={prefs.autoplayNext}
            previousLesson={previousLesson}
            nextLesson={nextLesson}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={goPrevious}
            onNext={goNext}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onCompleted={handleCompleted}
            onVolumeChange={setVolume}
            onPlaybackRateChange={setPlaybackRate}
            onAutoplayCancel={() => setAutoplayNext(false)}
          />
        ) : null}
      </div>

      <StreamCourseSidebar
        sections={course.sections}
        activeLessonId={activeLessonId}
        completedLessons={completedLessons}
        totalLessons={flatLessons.length}
        progressPercent={progressPercent}
        getLessonState={getLessonState}
        onSelectLesson={selectLesson}
      />
    </div>
  )
}
