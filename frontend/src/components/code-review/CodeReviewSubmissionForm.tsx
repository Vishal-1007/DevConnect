import { useMemo, useRef, useState } from 'react'
import {
  Check,
  FileCode2,
  GitBranch,
  Loader2,
  ScanSearch,
  Upload,
} from 'lucide-react'
import {
  DEFAULT_FOCUS_AREAS,
  REVIEW_FOCUS_OPTIONS,
  REVIEW_FRAMEWORKS,
  REVIEW_LANGUAGES,
  SAMPLE_SNIPPETS,
  type CodeReviewSubmission,
  type FocusAreaId,
} from '../../data/codeReviewData'

const inputClass =
  'w-full px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1] transition-colors'

interface CodeReviewSubmissionFormProps {
  onAnalyze: (submission: CodeReviewSubmission) => void
  isAnalyzing: boolean
  upgradeRequired?: boolean
  onUpgradeClick?: () => void
}

export function CodeReviewSubmissionForm({
  onAnalyze,
  isAnalyzing,
  upgradeRequired = false,
  onUpgradeClick,
}: CodeReviewSubmissionFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [languageId, setLanguageId] = useState('java')
  const [framework, setFramework] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [code, setCode] = useState('')
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [focusAreas, setFocusAreas] = useState<FocusAreaId[]>(DEFAULT_FOCUS_AREAS)

  const language = REVIEW_LANGUAGES.find((l) => l.id === languageId) ?? REVIEW_LANGUAGES[0]
  const frameworks = useMemo(
    () => REVIEW_FRAMEWORKS[languageId] ?? ['General'],
    [languageId]
  )

  function toggleFocus(id: FocusAreaId) {
    setFocusAreas((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((f) => f !== id)
        return next.length ? next : prev
      }
      return [...prev, id]
    })
  }

  function loadSample(id: string) {
    const sample = SAMPLE_SNIPPETS.find((s) => s.id === id)
    if (!sample) return
    setTitle(sample.title)
    setLanguageId(sample.languageId)
    setCode(sample.code)
    setFramework(REVIEW_FRAMEWORKS[sample.languageId]?.[0] ?? '')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setCode(text)
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
    }
    reader.readAsText(file)
  }

  function handleSubmit() {
    if (!code.trim() || focusAreas.length === 0) return
    onAnalyze({
      title: title.trim() || 'Untitled submission',
      languageId: language.id,
      languageLabel: language.label,
      framework: framework || frameworks[0] || 'General',
      githubUrl: githubUrl.trim(),
      code: code.trim(),
      focusAreas,
    })
  }

  const canAnalyze =
    code.trim().length > 0 && focusAreas.length > 0 && !isAnalyzing && !upgradeRequired

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-white">Review focus</h2>
          <p className="text-[10px] text-[#8b8ca8]">Select one or more dimensions</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {REVIEW_FOCUS_OPTIONS.map((opt) => {
            const selected = focusAreas.includes(opt.id)
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleFocus(opt.id)}
                className={`group text-left rounded-xl border p-4 transition-all duration-200 hover:shadow-lg hover:shadow-[#6366f1]/5 ${
                  selected
                    ? 'border-[#6366f1] bg-gradient-to-br from-[#6366f1]/15 to-[#161722] ring-1 ring-[#6366f1]/40'
                    : 'border-[#2d2e3e] bg-[#161722] hover:border-[#6366f1]/35'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${opt.accent}22` }}
                  >
                    <Icon size={18} style={{ color: opt.accent }} />
                  </div>
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      selected ? 'bg-[#6366f1] border-[#6366f1]' : 'border-[#2d2e3e] bg-[#0b0c14]'
                    }`}
                  >
                    {selected && <Check size={12} className="text-white" />}
                  </span>
                </div>
                <p className="font-semibold text-white text-sm mt-3">{opt.label}</p>
                <p className="text-xs text-[#8b8ca8] mt-1 leading-relaxed">{opt.description}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <span className="text-xs text-[#8b8ca8] w-full mb-1">Quick load sample</span>
        {SAMPLE_SNIPPETS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => loadSample(s.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161722] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white hover:border-[#6366f1]/40 transition-colors"
          >
            {s.title}
          </button>
        ))}
      </section>

      <section className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 mb-5">
          <FileCode2 size={18} className="text-[#818cf8]" />
          <h2 className="text-sm font-semibold text-white">Code submission</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-[#8b8ca8] mb-1">Project / feature title</label>
            <input
              className={`${inputClass} h-10`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Auth middleware refactor"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8b8ca8] mb-1">Programming language</label>
            <select
              className={`${inputClass} h-10`}
              value={languageId}
              onChange={(e) => {
                setLanguageId(e.target.value)
                setFramework(REVIEW_FRAMEWORKS[e.target.value]?.[0] ?? '')
              }}
            >
              {REVIEW_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8b8ca8] mb-1">Technology / framework</label>
            <select
              className={`${inputClass} h-10`}
              value={framework || frameworks[0]}
              onChange={(e) => setFramework(e.target.value)}
            >
              {frameworks.map((fw) => (
                <option key={fw} value={fw}>
                  {fw}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8b8ca8] mb-1 flex items-center gap-1">
              <GitBranch size={12} /> GitHub repository (optional)
            </label>
            <input
              className={`${inputClass} h-10`}
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/you/project"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            ref={fileRef}
            type="file"
            accept=".java,.ts,.tsx,.js,.py,.go,.cs,.txt,.md"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2d2e3e] bg-[#0b0c14] text-xs text-[#b4b5c8] hover:border-[#6366f1]/50 hover:text-white transition-colors"
          >
            <Upload size={14} />
            Upload file
          </button>
          {uploadName && (
            <span className="text-xs text-[#818cf8] truncate max-w-[200px]">{uploadName}</span>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-xs text-[#8b8ca8] mb-1">Code editor</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="Paste your code, diff, or module here…"
            className={`${inputClass} h-56 py-3 font-mono text-xs leading-relaxed resize-y`}
          />
        </div>

        {upgradeRequired ? (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white text-sm font-semibold shadow-lg"
          >
            <ScanSearch size={18} />
            Upgrade Required — ₹50 / review
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAnalyze}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 rounded-xl dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50 shadow-lg shadow-[#6366f1]/25 hover:shadow-[#6366f1]/40 transition-all"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing code quality…
              </>
            ) : (
              <>
                <ScanSearch size={18} />
                Analyze Code
              </>
            )}
          </button>
        )}
        {!code.trim() && !upgradeRequired && (
          <p className="text-xs text-[#8b8ca8] mt-2">Add code or upload a file to run analysis.</p>
        )}
        {upgradeRequired && (
          <p className="text-xs text-amber-400/90 mt-2">Daily free limit reached. Purchase an extra review to continue.</p>
        )}
      </section>
    </div>
  )
}
