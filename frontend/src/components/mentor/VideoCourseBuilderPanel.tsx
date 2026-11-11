import { useMemo, useState } from 'react'
import { Plus, Loader2, Trash2, Upload, Radio, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import {
  useListMentorStreamCoursesQuery,
  useCreateMentorStreamCourseMutation,
  useCreateMentorStreamSectionMutation,
  usePublishMentorStreamCourseMutation,
  useDeleteMentorStreamCourseMutation,
  useListAdminStreamCoursesQuery,
  useCreateAdminStreamCourseMutation,
  useCreateAdminStreamSectionMutation,
  usePublishAdminStreamCourseMutation,
  useDeleteAdminStreamCourseMutation,
  useStreamAnalyticsQuery,
  useAdminStreamAnalyticsQuery,
} from '../../api/learningStreamsApi'
import { StreamLessonUploadField } from '../learning-streams/StreamLessonUploadField'
import { MentorPanelShell } from './MentorPanelShell'
import { extractApiError } from '../../lib/extractApiError'
import { uploadStreamLesson } from '../../lib/streamUpload'
import { useAppSelector } from '../../hooks'

type Mode = 'admin' | 'mentor'

type LessonDraft = {
  localId: string
  title: string
  description: string
  durationSeconds: number
  previewFree: boolean
  videoFile: File | null
  thumbnailFile: File | null
  uploadProgress: number
}

type SectionDraft = {
  localId: string
  title: string
  lessons: LessonDraft[]
  open: boolean
}

function newLesson(): LessonDraft {
  return {
    localId: crypto.randomUUID(),
    title: '',
    description: '',
    durationSeconds: 0,
    previewFree: false,
    videoFile: null,
    thumbnailFile: null,
    uploadProgress: 0,
  }
}

function newSection(): SectionDraft {
  return {
    localId: crypto.randomUUID(),
    title: '',
    lessons: [newLesson()],
    open: true,
  }
}

function formatRevenue(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function formatWatchTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export function VideoCourseBuilderPanel({ mode }: { mode: Mode }) {
  const isAdmin = mode === 'admin'
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { data: mentorCourses = [], isLoading: mentorLoading, refetch: refetchMentor } = useListMentorStreamCoursesQuery(undefined, { skip: isAdmin })
  const { data: adminCourses = [], isLoading: adminLoading, refetch: refetchAdmin } = useListAdminStreamCoursesQuery(undefined, { skip: !isAdmin })
  const { data: mentorAnalytics } = useStreamAnalyticsQuery(undefined, { skip: isAdmin })
  const { data: adminAnalytics } = useAdminStreamAnalyticsQuery(undefined, { skip: !isAdmin })
  const analytics = isAdmin ? adminAnalytics : mentorAnalytics
  const courses = isAdmin ? adminCourses : mentorCourses
  const isLoading = isAdmin ? adminLoading : mentorLoading
  const refetch = isAdmin ? refetchAdmin : refetchMentor

  const [createMentorCourse, { isLoading: creatingMentor }] = useCreateMentorStreamCourseMutation()
  const [createAdminCourse, { isLoading: creatingAdmin }] = useCreateAdminStreamCourseMutation()
  const [createMentorSection] = useCreateMentorStreamSectionMutation()
  const [createAdminSection] = useCreateAdminStreamSectionMutation()
  const [publishMentorCourse] = usePublishMentorStreamCourseMutation()
  const [publishAdminCourse] = usePublishAdminStreamCourseMutation()
  const [deleteMentorCourse] = useDeleteMentorStreamCourseMutation()
  const [deleteAdminCourse] = useDeleteAdminStreamCourseMutation()

  const createCourse = isAdmin ? createAdminCourse : createMentorCourse
  const createSection = isAdmin ? createAdminSection : createMentorSection
  const publishCourse = isAdmin ? publishAdminCourse : publishMentorCourse
  const deleteCourse = isAdmin ? deleteAdminCourse : deleteMentorCourse
  const creating = isAdmin ? creatingAdmin : creatingMentor

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Spring Boot',
    pricingType: 'FREE',
    priceCents: 99900,
    discountPriceCents: '',
    difficulty: 'BEGINNER',
    tags: '',
    thumbnailUrl: '',
    whatYouLearn: '',
    requirements: '',
  })
  const [sections, setSections] = useState<SectionDraft[]>([newSection()])

  const totalLessons = useMemo(
    () => sections.reduce((sum, section) => sum + section.lessons.length, 0),
    [sections],
  )

  function updateSection(sectionId: string, patch: Partial<SectionDraft>) {
    setSections((prev) => prev.map((s) => (s.localId === sectionId ? { ...s, ...patch } : s)))
  }

  function updateLesson(sectionId: string, lessonId: string, patch: Partial<LessonDraft>) {
    setSections((prev) => prev.map((section) => {
      if (section.localId !== sectionId) return section
      return {
        ...section,
        lessons: section.lessons.map((lesson) => (
          lesson.localId === lessonId ? { ...lesson, ...patch } : lesson
        )),
      }
    }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!accessToken) {
      setError('You must be signed in to upload lessons.')
      return
    }
    if (sections.length === 0) {
      setError('Add at least one section.')
      return
    }
    const hasVideo = sections.some((section) => section.lessons.some((lesson) => lesson.videoFile))
    if (!hasVideo) {
      setError('Upload at least one lesson video before publishing.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createCourse({
        title: form.title,
        description: form.description,
        category: form.category,
        currency: 'INR',
        thumbnailUrl: form.thumbnailUrl || undefined,
        bannerUrl: form.thumbnailUrl || undefined,
        pricingType: form.pricingType,
        priceCents: form.pricingType === 'PAID' ? form.priceCents : 0,
        discountPriceCents: form.discountPriceCents ? Number(form.discountPriceCents) : undefined,
        difficulty: form.difficulty,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        whatYouLearn: form.whatYouLearn || undefined,
        requirements: form.requirements || undefined,
        sections: [],
      }).unwrap()

      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const sectionDraft = sections[sectionIndex]
        const createdSection = await createSection({
          courseId: created.id,
          title: sectionDraft.title || `Section ${sectionIndex + 1}`,
          sortOrder: sectionIndex,
        }).unwrap()

        for (let lessonIndex = 0; lessonIndex < sectionDraft.lessons.length; lessonIndex += 1) {
          const lesson = sectionDraft.lessons[lessonIndex]
          if (!lesson.videoFile) continue
          updateLesson(sectionDraft.localId, lesson.localId, { uploadProgress: 0 })
          await uploadStreamLesson(
            created.id,
            createdSection.id,
            {
              title: lesson.title || `Lesson ${lessonIndex + 1}`,
              description: lesson.description || undefined,
              durationSeconds: lesson.durationSeconds,
              sortOrder: lessonIndex,
              previewFree: lesson.previewFree,
              video: lesson.videoFile,
              thumbnail: lesson.thumbnailFile,
            },
            accessToken,
            (percent) => updateLesson(sectionDraft.localId, lesson.localId, { uploadProgress: percent }),
            isAdmin ? 'admin' : 'mentor',
          )
        }
      }

      await publishCourse(created.id).unwrap()
      setShowForm(false)
      setSections([newSection()])
      refetch()
    } catch (err) {
      setError(extractApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const content = (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={18} className="text-violet-400" /> Learning Streams
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">
            {isAdmin ? 'Create and manage platform video courses' : 'Create and manage premium video courses'}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg">
          <Plus size={13} /> New Course
        </button>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Courses', value: analytics.totalCourses },
            { label: 'Published', value: analytics.publishedCourses },
            { label: 'Enrollments', value: analytics.totalEnrollments },
            { label: 'Revenue', value: formatRevenue(analytics.totalRevenueCents) },
            { label: 'Watch Time', value: formatWatchTime(analytics.totalWatchTimeSeconds) },
            { label: 'Views', value: analytics.totalViews },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3">
              <p className="text-[10px] text-[#8b8ca8] flex items-center gap-1"><BarChart3 size={10} /> {stat.label}</p>
              <p className="text-sm font-bold text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 space-y-4">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Course title" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description" rows={3} className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value })}
              className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
              <option value="FREE">Free</option>
              <option value="PAID">Paid Premium</option>
            </select>
            {form.pricingType === 'PAID' && (
              <input type="number" min={0} value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })}
                placeholder="Price in paise (99900 = ₹999)" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
            )}
          </div>
          {form.pricingType === 'PAID' && (
            <input value={form.discountPriceCents} onChange={(e) => setForm({ ...form, discountPriceCents: e.target.value })}
              placeholder="Discount price in paise (optional)" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          )}
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (comma separated)" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
            placeholder="Course thumbnail URL (optional)" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />

          <div className="border-t border-[#2d2e3e] pt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Course sections & lessons</p>
                <p className="text-[10px] text-[#8b8ca8]">{sections.length} sections · {totalLessons} lessons</p>
              </div>
              <button type="button" onClick={() => setSections((prev) => [...prev, newSection()])}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-600/10 px-3 py-1.5 text-[11px] font-semibold text-violet-200 hover:bg-violet-600/20">
                <Plus size={12} /> Add Section
              </button>
            </div>

            {sections.map((section, sectionIndex) => (
              <div key={section.localId} className="rounded-xl border border-[#2d2e3e] bg-[#12131c] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateSection(section.localId, { open: !section.open })} className="text-[#8b8ca8]">
                    {section.open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <input required value={section.title} onChange={(e) => updateSection(section.localId, { title: e.target.value })}
                    placeholder={`Section ${sectionIndex + 1} title`}
                    className="flex-1 bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
                  <button type="button" onClick={() => setSections((prev) => prev.filter((s) => s.localId !== section.localId))}
                    className="text-[#5c5d72] hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>

                {section.open && section.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.localId} className="rounded-lg border border-[#1e1f2e] bg-[#161722] p-3 space-y-3">
                    <p className="text-[11px] font-semibold text-violet-300">Lesson {lessonIndex + 1}</p>
                    <input required value={lesson.title} onChange={(e) => updateLesson(section.localId, lesson.localId, { title: e.target.value })}
                      placeholder="Lesson title" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
                    <textarea value={lesson.description} onChange={(e) => updateLesson(section.localId, lesson.localId, { description: e.target.value })}
                      placeholder="Lesson description" rows={2} className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
                    <StreamLessonUploadField
                      videoFile={lesson.videoFile}
                      thumbnailFile={lesson.thumbnailFile}
                      uploadProgress={lesson.uploadProgress}
                      uploading={submitting && lesson.uploadProgress > 0 && lesson.uploadProgress < 100}
                      onVideoChange={(file) => updateLesson(section.localId, lesson.localId, { videoFile: file })}
                      onThumbnailChange={(file) => updateLesson(section.localId, lesson.localId, { thumbnailFile: file })}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-[#8b8ca8] px-3 py-2">Cancel</button>
            <button type="submit" disabled={creating || submitting}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-60">
              {(creating || submitting) ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              Publish Course
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <Radio size={32} className="text-violet-400 mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-white">No courses yet</p>
          <p className="text-xs text-[#8b8ca8] mt-1">Upload free or paid video courses with sections and lessons.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 flex gap-3">
              {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{c.title}</p>
                <p className="text-[10px] text-[#8b8ca8]">{c.pricingType} · {c.totalLessons ?? 0} lessons · {c.enrolledCount} students</p>
              </div>
              <button type="button" onClick={() => deleteCourse(c.id)} className="text-[#5c5d72] hover:text-red-400 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return <MentorPanelShell>{content}</MentorPanelShell>
}

export function MentorLearningStreamsPanel() {
  return <VideoCourseBuilderPanel mode="mentor" />
}
