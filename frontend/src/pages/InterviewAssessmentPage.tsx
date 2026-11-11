import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Loader2, Send, FileText } from 'lucide-react'
import Editor from '@monaco-editor/react'
import {
  useGetInterviewAssignmentQuery,
  useGetInterviewPackQuery,
  useSubmitInterviewAnswersMutation,
} from '../api/interviewMarketplaceApi'

type AnswerMode = 'TEXT' | 'CODE' | 'FILE'

export function InterviewAssessmentPage() {
  const { assignmentId, packId } = useParams()
  const navigate = useNavigate()
  const isPackMode = Boolean(packId)

  const assignmentQuery = useGetInterviewAssignmentQuery(assignmentId!, { skip: !assignmentId })
  const packQuery = useGetInterviewPackQuery({ id: packId! }, { skip: !packId })
  const [submit, { isLoading: submitting }] = useSubmitInterviewAnswersMutation()

  const detail = assignmentQuery.data
  const pack = packQuery.data

  const questions = useMemo(() => {
    if (detail) return detail.questions
    if (pack?.questions) {
      return pack.questions.map((q, i) => ({
        id: q.id,
        index: i + 1,
        title: q.title,
        questionText: q.questionText,
        description: null,
        category: q.category,
        difficulty: q.difficulty,
        estimatedMinutes: q.estimatedMinutes,
      }))
    }
    return []
  }, [detail, pack])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { type: AnswerMode; text: string; code: string; lang: string }>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)

  const durationMinutes = detail?.durationMinutes ?? pack?.durationMinutes ?? 60

  useEffect(() => {
    setSecondsLeft(durationMinutes * 60)
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [durationMinutes])

  const current = questions[currentIdx]
  const currentAnswer = current ? answers[current.id] ?? { type: 'TEXT' as AnswerMode, text: '', code: '', lang: 'java' } : null

  const progressPct = questions.length ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0
  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  async function handleSubmit() {
    if (!assignmentId || !detail) return
    const payload = questions.map((q) => {
      const a = answers[q.id] ?? { type: 'TEXT' as AnswerMode, text: '', code: '', lang: 'java' }
      return {
        questionId: q.id,
        answerType: a.type,
        answerText: a.type === 'TEXT' ? a.text : undefined,
        answerCode: a.type === 'CODE' ? a.code : undefined,
        codeLanguage: a.type === 'CODE' ? a.lang : undefined,
      }
    })
    await submit({ id: assignmentId, answers: payload }).unwrap()
    navigate('/mock-interviews?tab=submissions')
  }

  if (assignmentQuery.isLoading || packQuery.isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-violet-400" size={28} /></div>
  }

  if (!current) {
    return (
      <div className="p-6 text-center text-[#8b8ca8]">
        No questions available. {!isPackMode && 'Assignment may not be started yet.'}
      </div>
    )
  }

  const title = detail?.packTitle ?? pack?.title ?? 'Assessment'

  return (
    <div className="h-screen flex flex-col bg-[#0b0c14]">
      <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#2d2e3e] bg-[#12131c]">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white">
          <ArrowLeft size={16} /> {title}
        </button>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm font-mono text-amber-300"><Clock size={14} /> {timerLabel}</span>
          <span className="text-xs text-[#8b8ca8]">{currentIdx + 1} / {questions.length}</span>
        </div>
      </header>

      <div className="shrink-0 h-1 bg-[#2d2e3e]">
        <div className="h-full bg-violet-500 transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex-1 flex min-h-0">
        <aside className="w-56 shrink-0 border-r border-[#2d2e3e] bg-[#12131c] p-3 overflow-y-auto hidden md:block">
          <p className="text-[10px] font-bold uppercase text-[#5c5d72] mb-2">Questions</p>
          <div className="space-y-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIdx(i)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  i === currentIdx ? 'bg-violet-600/30 text-white border border-violet-500/40' : 'text-[#8b8ca8] hover:bg-[#1c1d2a]'
                }`}
              >
                Q{i + 1}. {q.title}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 p-5 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full space-y-4 flex-1">
            <div>
              <span className="text-[10px] font-bold uppercase text-violet-400">{current.category} · {current.difficulty}</span>
              <h2 className="text-lg font-bold text-white mt-1">{current.title}</h2>
              <p className="text-sm text-[#8b8ca8] mt-2 whitespace-pre-wrap">{current.questionText}</p>
              {current.description && <p className="text-sm text-[#8b8ca8] mt-2">{current.description}</p>}
            </div>

            <div className="flex gap-2">
              {(['TEXT', 'CODE', 'FILE'] as AnswerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAnswers((prev) => ({
                    ...prev,
                    [current.id]: { ...(prev[current.id] ?? { text: '', code: '', lang: 'java' }), type: mode },
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    currentAnswer?.type === mode
                      ? 'bg-violet-600/30 border-violet-500/50 text-white'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {mode === 'TEXT' ? 'Text' : mode === 'CODE' ? 'Code' : 'File'}
                </button>
              ))}
            </div>

            {currentAnswer?.type === 'TEXT' && (
              <textarea
                value={currentAnswer.text}
                onChange={(e) => setAnswers((prev) => ({
                  ...prev,
                  [current.id]: { ...currentAnswer, text: e.target.value },
                }))}
                rows={8}
                placeholder="Write your answer…"
                className="w-full p-3 rounded-xl bg-[#161722] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-violet-500 resize-y"
              />
            )}

            {currentAnswer?.type === 'CODE' && (
              <div className="space-y-2">
                <select
                  value={currentAnswer.lang}
                  onChange={(e) => setAnswers((prev) => ({
                    ...prev,
                    [current.id]: { ...currentAnswer, lang: e.target.value },
                  }))}
                  className="h-8 px-2 rounded-lg bg-[#161722] border border-[#2d2e3e] text-xs text-white"
                >
                  {['java', 'javascript', 'python', 'sql'].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="h-64 rounded-xl overflow-hidden border border-[#2d2e3e]">
                  <Editor
                    height="100%"
                    language={currentAnswer.lang}
                    theme="vs-dark"
                    value={currentAnswer.code}
                    onChange={(v) => setAnswers((prev) => ({
                      ...prev,
                      [current.id]: { ...currentAnswer, code: v ?? '' },
                    }))}
                    options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 12 } }}
                  />
                </div>
              </div>
            )}

            {currentAnswer?.type === 'FILE' && (
              <div className="border-2 border-dashed border-[#2d2e3e] rounded-xl p-8 text-center">
                <FileText className="w-8 h-8 text-[#5c5d72] mx-auto mb-2" />
                <p className="text-sm text-[#8b8ca8]">Upload PDF, DOCX, TXT, or ZIP</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.zip"
                  className="mt-3 text-xs text-[#8b8ca8]"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setAnswers((prev) => ({
                        ...prev,
                        [current.id]: { ...currentAnswer, text: file.name, type: 'FILE' },
                      }))
                    }
                  }}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-[#2d2e3e] bg-[#12131c]">
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[#8b8ca8] hover:text-white disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="flex gap-2">
          {assignmentId && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-bold disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit Assessment
            </button>
          )}
          <button
            type="button"
            disabled={currentIdx >= questions.length - 1}
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white bg-[#2d2e3e] hover:bg-violet-600/40 disabled:opacity-30"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  )
}
