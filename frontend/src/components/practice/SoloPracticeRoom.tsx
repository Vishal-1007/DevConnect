import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lightbulb,
  Loader2,
  Play,
  Send,
} from 'lucide-react'
import {
  difficultyBadgeClass,
  PROGRAMMING_LANGUAGES,
  useGetProblemQuery,
  type CodingProblemDetail,
} from '../../api/codingProblemsApi'
import {
  useRunPracticeCodeMutation,
  useSavePracticeCodeMutation,
  useStartPracticeMutation,
  useSubmitPracticeMutation,
} from '../../api/practiceApi'
import type { RunCodeResult } from '../../api/pairProgrammingApi'
import { formatCallDuration } from '../../lib/formatTime'
import { MONACO_EDITOR_OPTIONS } from '../../lib/pairEditorPermissions'

const LANG_MAP: Record<string, string> = {
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
}

type BottomTab = 'tests' | 'output' | 'console'

interface Props {
  problemId: string
  initialLanguage?: string
}

export function SoloPracticeRoom({ problemId, initialLanguage }: Props) {
  const { data: problem, isLoading, error } = useGetProblemQuery(problemId)
  const [startPractice] = useStartPracticeMutation()
  const [savePracticeCode] = useSavePracticeCodeMutation()
  const [runPracticeCode, { isLoading: running }] = useRunPracticeCodeMutation()
  const [submitPractice, { isLoading: submitting }] = useSubmitPracticeMutation()

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState(initialLanguage ?? 'java')
  const [startedAt, setStartedAt] = useState<number>(Date.now())
  const [timer, setTimer] = useState('00:00:00')
  const [bottomTab, setBottomTab] = useState<BottomTab>('tests')
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null)
  const [selectedTest, setSelectedTest] = useState(0)
  const [revealedHints, setRevealedHints] = useState(0)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)
  const initialized = useRef(false)

  const monacoLang = LANG_MAP[language] ?? 'java'
  const sessionEnded = Boolean(submitMessage?.includes('Accepted'))

  useEffect(() => {
    const id = window.setInterval(() => setTimer(formatCallDuration(startedAt)), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  useEffect(() => {
    if (!problem || initialized.current) return
    initialized.current = true
    const lang =
      initialLanguage && problem.languages.includes(initialLanguage)
        ? initialLanguage
        : problem.languages[0] ?? 'java'
    setLanguage(lang)

    void startPractice({ problemId, language: lang })
      .unwrap()
      .then((attempt) => {
        setAttemptId(attempt.id)
        setCode(attempt.code || problem.starterCode[lang] || '')
        setStartedAt(Date.parse(attempt.startedAt))
      })
      .catch(() => {
        setCode(problem.starterCode[lang] || '')
      })
  }, [problem, problemId, initialLanguage, startPractice])

  const persistCode = useCallback(
    (next: string, lang: string) => {
      if (!attemptId) return
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void savePracticeCode({ attemptId, code: next, language: lang })
      }, 600)
    },
    [attemptId, savePracticeCode]
  )

  function handleCodeChange(next: string | undefined) {
    if (next == null || sessionEnded) return
    setCode(next)
    persistCode(next, language)
  }

  function handleLanguageChange(next: string) {
    if (!problem) return
    setLanguage(next)
    const starter = problem.starterCode[next]
    if (starter && code.trim() === (problem.starterCode[language] ?? '').trim()) {
      setCode(starter)
      persistCode(starter, next)
    }
  }

  async function handleRun() {
    if (!problem) return
    setBottomTab('output')
    try {
      const result = await runPracticeCode({ problemId, code, language }).unwrap()
      setRunResult(result)
      setBottomTab('tests')
    } catch {
      setRunResult(null)
      setBottomTab('console')
    }
  }

  async function handleSubmit() {
    if (!attemptId) return
    setSubmitMessage(null)
    setBottomTab('output')
    try {
      const result = await submitPractice({ attemptId, code, language }).unwrap()
      setRunResult(result.runResult)
      setBottomTab('tests')
      if (result.runResult.allPassed) {
        setSubmitMessage('Accepted — solution submitted successfully!')
      } else {
        setSubmitMessage('Wrong Answer — fix failing tests and try again.')
      }
    } catch {
      setSubmitMessage('Could not submit solution. Please try again.')
      setBottomTab('console')
    }
  }

  if (isLoading || !problem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0c14] text-[#8b8ca8] gap-2">
        <Loader2 className="animate-spin" size={20} />
        Loading problem…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0c14] text-center p-6">
        <p className="text-white font-semibold mb-2">Problem not found</p>
        <Link to="/pair-programming" className="text-sm text-[#818cf8] hover:underline">
          Back to Coding Practice
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0b0c14] text-white">
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[#2d2e3e] bg-[#12131c]">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/pair-programming"
            className="flex items-center gap-1.5 text-sm text-[#8b8ca8] hover:text-white shrink-0"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold truncate">{problem.title}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${difficultyBadgeClass(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/20 text-[#818cf8] font-semibold">
                Solo Practice
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-xs bg-[#0b0c14] border border-[#2d2e3e] rounded px-2 py-1.5 text-white"
          >
            {problem.languages.map((l) => (
              <option key={l} value={l}>
                {PROGRAMMING_LANGUAGES.find((p) => p.id === l)?.label ?? l}
              </option>
            ))}
          </select>
          <span className="flex items-center gap-1.5 text-sm font-mono text-amber-300">
            <Clock size={14} /> {timer}
          </span>
          <button
            type="button"
            disabled={running || sessionEnded}
            onClick={() => void handleRun()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2d2e3e] hover:bg-[#3d3e4e] text-white disabled:opacity-50"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run Code
          </button>
          <button
            type="button"
            disabled={submitting || sessionEnded || !attemptId}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold dc-gradient-btn text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit Solution
          </button>
        </div>
      </header>

      {submitMessage && (
        <div
          className={`shrink-0 px-4 py-2 text-sm border-b ${
            submitMessage.includes('Accepted')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}
        >
          {submitMessage.includes('Accepted') && <CheckCircle2 size={14} className="inline mr-1.5" />}
          {submitMessage}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <aside className="w-[38%] max-w-xl shrink-0 border-r border-[#2d2e3e] overflow-y-auto bg-[#12131c]">
          <ProblemPanel problem={problem} revealedHints={revealedHints} onRevealHint={() => setRevealedHints((n) => n + 1)} />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                ...MONACO_EDITOR_OPTIONS,
                readOnly: sessionEnded,
              }}
            />
          </div>

          <div className="h-52 shrink-0 border-t border-[#2d2e3e] bg-[#12131c] flex flex-col">
            <div className="flex gap-1 px-2 pt-1 border-b border-[#2d2e3e]">
              {(['tests', 'output', 'console'] as BottomTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBottomTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-t-lg ${
                    bottomTab === tab
                      ? 'bg-[#161722] text-white border border-b-0 border-[#2d2e3e]'
                      : 'text-[#8b8ca8]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-3 text-xs font-mono">
              {bottomTab === 'tests' && (
                <TestsPanel
                  problem={problem}
                  runResult={runResult}
                  selectedTest={selectedTest}
                  onSelectTest={setSelectedTest}
                />
              )}
              {bottomTab === 'output' && (
                <pre className="text-[#b4b5c8] whitespace-pre-wrap">
                  {runResult?.stdout || 'Run your code to see output.'}
                </pre>
              )}
              {bottomTab === 'console' && (
                <pre className="text-red-300 whitespace-pre-wrap">
                  {runResult?.stderr || submitMessage || 'No errors.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProblemPanel({
  problem,
  revealedHints,
  onRevealHint,
}: {
  problem: CodingProblemDetail
  revealedHints: number
  onRevealHint: () => void
}) {
  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-sm text-[#b4b5c8] whitespace-pre-wrap leading-relaxed">{problem.description}</p>
      </div>

      {problem.examples.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase text-[#8b8ca8] mb-2">Examples</h3>
          <div className="space-y-3">
            {problem.examples.map((ex, i) => (
              <div key={i} className="rounded-lg bg-[#0b0c14] border border-[#2d2e3e] p-3 text-sm">
                <p className="text-[#8b8ca8] mb-1">
                  <span className="text-white font-semibold">Input:</span> {ex.input}
                </p>
                <p className="text-[#8b8ca8]">
                  <span className="text-white font-semibold">Output:</span> {ex.output}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {problem.constraints.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase text-[#8b8ca8] mb-2">Constraints</h3>
          <ul className="list-disc list-inside text-sm text-[#b4b5c8] space-y-1">
            {problem.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      {problem.hints.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase text-[#8b8ca8] flex items-center gap-1.5">
              <Lightbulb size={12} /> Hints
            </h3>
            {revealedHints < problem.hints.length && (
              <button
                type="button"
                onClick={onRevealHint}
                className="text-[10px] text-[#818cf8] hover:underline"
              >
                Reveal hint
              </button>
            )}
          </div>
          <div className="space-y-2">
            {problem.hints.slice(0, revealedHints).map((hint, i) => (
              <div key={i} className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-100">
                {hint}
              </div>
            ))}
            {revealedHints === 0 && (
              <p className="text-xs text-[#5c5d72]">Click reveal hint when you are stuck.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function TestsPanel({
  problem,
  runResult,
  selectedTest,
  onSelectTest,
}: {
  problem: CodingProblemDetail
  runResult: RunCodeResult | null
  selectedTest: number
  onSelectTest: (n: number) => void
}) {
  const cases = runResult?.testCases ?? problem.testCases.map((t) => ({
    name: t.name,
    input: t.input,
    expectedOutput: t.expected,
    actualOutput: '',
    passed: false,
    executionMs: 0,
  }))

  if (!runResult) {
    return (
      <div className="space-y-2">
        <p className="text-[#8b8ca8] mb-2">Sample test cases (run code to execute):</p>
        {problem.testCases.map((t, i) => (
          <div key={i} className="rounded border border-[#2d2e3e] p-2 text-[#b4b5c8]">
            <p className="font-semibold text-white mb-1">{t.name}</p>
            <p>Input: {t.input}</p>
            <p>Expected: {t.expected}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-3 h-full min-h-0">
      <div className="w-40 shrink-0 space-y-1 overflow-y-auto">
        {cases.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectTest(i)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-1 ${
              selectedTest === i ? 'bg-[#6366f1]/20 text-white' : 'text-[#8b8ca8] hover:bg-[#1c1d2a]'
            }`}
          >
            {t.passed ? (
              <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
            ) : (
              <ChevronRight size={12} className="shrink-0" />
            )}
            {t.name}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {cases[selectedTest] && (
          <div className="space-y-2 text-[#b4b5c8]">
            <p>
              <span className="text-white font-semibold">Input:</span> {cases[selectedTest].input}
            </p>
            <p>
              <span className="text-white font-semibold">Expected:</span> {cases[selectedTest].expectedOutput}
            </p>
            <p>
              <span className="text-white font-semibold">Actual:</span>{' '}
              <span className={cases[selectedTest].passed ? 'text-emerald-400' : 'text-red-400'}>
                {cases[selectedTest].actualOutput || '(empty)'}
              </span>
            </p>
            <p className="text-[#5c5d72]">{cases[selectedTest].executionMs}ms</p>
          </div>
        )}
        <p className="mt-3 text-[#8b8ca8]">
          {runResult.allPassed ? (
            <span className="text-emerald-400 font-semibold">All tests passed</span>
          ) : (
            <span className="text-red-400 font-semibold">Some tests failed</span>
          )}
          {' · '}
          {runResult.executionMs}ms total
        </p>
      </div>
    </div>
  )
}
