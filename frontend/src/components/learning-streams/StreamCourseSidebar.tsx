import {
  CheckCircle2, Lock, Play, Radio,
} from 'lucide-react'
import type { StreamLesson, StreamSection } from '../../api/learningStreamsApi'
import { formatLessonDuration } from '../../lib/streamPlayerUtils'

interface StreamCourseSidebarProps {
  sections: StreamSection[]
  activeLessonId: string | null
  completedLessons: number
  totalLessons: number
  progressPercent: number
  getLessonState: (lessonId: string, fallback?: { progressSeconds: number; completed: boolean }) => {
    progressSeconds: number
    completed: boolean
  }
  onSelectLesson: (lessonId: string) => void
}

export function StreamCourseSidebar({
  sections,
  activeLessonId,
  completedLessons,
  totalLessons,
  progressPercent,
  getLessonState,
  onSelectLesson,
}: StreamCourseSidebarProps) {
  return (
    <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#2d2e3e] overflow-y-auto bg-[#12131c]">
      <div className="px-4 py-3 border-b border-[#2d2e3e]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-white">Course content</p>
          <span className="text-[10px] text-violet-300 font-semibold">{progressPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1e1f2e] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-[#8b8ca8] mt-1.5">
          {completedLessons}/{totalLessons} lessons completed
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.id} className="border-b border-[#1e1f2e]">
          <p className="px-4 py-2 text-[10px] font-bold text-violet-300 uppercase tracking-wider">{section.title}</p>
          {section.lessons.map((lesson) => (
            <StreamLessonSidebarItem
              key={lesson.id}
              lesson={lesson}
              isActive={activeLessonId === lesson.id}
              state={getLessonState(lesson.id, { progressSeconds: lesson.progressSeconds, completed: lesson.completed })}
              onSelect={() => onSelectLesson(lesson.id)}
            />
          ))}
        </div>
      ))}
    </aside>
  )
}

function StreamLessonSidebarItem({
  lesson,
  isActive,
  state,
  onSelect,
}: {
  lesson: StreamLesson
  isActive: boolean
  state: { progressSeconds: number; completed: boolean }
  onSelect: () => void
}) {
  const completed = state.completed || lesson.completed
  const progressRatio = lesson.durationSeconds > 0
    ? Math.min(1, state.progressSeconds / lesson.durationSeconds)
    : 0
  const showProgress = !completed && progressRatio > 0 && !lesson.locked

  return (
    <button
      type="button"
      disabled={lesson.locked}
      onClick={() => !lesson.locked && onSelect()}
      className={`group w-full text-left px-4 py-2.5 flex items-start gap-2 text-xs transition-all ${
        isActive
          ? 'bg-violet-600/20 text-violet-100 border-l-2 border-violet-500 shadow-[inset_0_0_20px_rgba(124,58,237,0.12)]'
          : 'text-[#8b8ca8] hover:bg-[#1c1d2a] border-l-2 border-transparent'
      } ${lesson.locked ? 'opacity-50 cursor-not-allowed blur-[0.2px]' : ''}`}
    >
      <span className="mt-0.5 shrink-0">
        {completed ? (
          <CheckCircle2 size={12} className="text-emerald-400" />
        ) : isActive ? (
          <Radio size={12} className="text-violet-400 animate-pulse" />
        ) : lesson.locked ? (
          <Lock size={12} className="text-amber-400/80" />
        ) : (
          <Play size={12} className="text-[#5c5d72] group-hover:text-violet-300" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={`truncate ${isActive ? 'font-semibold text-white' : ''}`}>{lesson.title}</span>
          {lesson.previewFree && !lesson.locked && (
            <span className="shrink-0 rounded bg-emerald-500/15 px-1 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
              Preview
            </span>
          )}
          {completed && (
            <span className="shrink-0 rounded bg-emerald-500/15 px-1 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
              Done
            </span>
          )}
        </span>
        <span className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[#5c5d72]">
          <span>{formatLessonDuration(lesson.durationSeconds)}</span>
          {showProgress && <span>{Math.round(progressRatio * 100)}% watched</span>}
        </span>
        {showProgress && (
          <span className="mt-1 block h-0.5 rounded-full bg-[#1e1f2e] overflow-hidden">
            <span className="block h-full bg-violet-500/70" style={{ width: `${progressRatio * 100}%` }} />
          </span>
        )}
      </span>
    </button>
  )
}
