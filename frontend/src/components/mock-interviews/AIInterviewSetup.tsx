import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import {
  useStartAiInterviewMutation,
  type ResumeParseResult,
} from '../../api/aiInterviewApi'
import { extractApiError } from '../../lib/extractApiError'
import { ResumeUploader } from './ResumeUploader'

const TARGET_ROLES = [
  'Java Developer',
  'Full Stack Developer',
  'Backend Engineer',
  'Frontend Developer',
  'DevOps Engineer',
] as const

const EXPERIENCE_LEVELS = ['Fresher', '1-3 Years', '3-5 Years', '5+ Years'] as const

const INTERVIEW_TYPES = ['Technical', 'HR', 'System Design', 'Mixed Interview'] as const

interface AIInterviewSetupProps {
  onClose: () => void
  onStarted: (interviewId: string) => void
}

export function AIInterviewSetup({ onClose, onStarted }: AIInterviewSetupProps) {
  const [step, setStep] = useState(1)
  const [candidateName, setCandidateName] = useState('')
  const [targetRole, setTargetRole] = useState<string>(TARGET_ROLES[0])
  const [experienceLevel, setExperienceLevel] = useState<string>(EXPERIENCE_LEVELS[0])
  const [interviewType, setInterviewType] = useState<string>(INTERVIEW_TYPES[0])
  const [parsedResume, setParsedResume] = useState<ResumeParseResult | null>(null)

  const [startInterview, { isLoading, error }] = useStartAiInterviewMutation()

  function handleParsed(data: ResumeParseResult) {
    setParsedResume(data)
    if (data.username && !candidateName) {
      setCandidateName(data.username)
    }
  }

  async function handleStart() {
    if (!candidateName.trim()) return
    try {
      const session = await startInterview({
        candidateName: candidateName.trim(),
        targetRole,
        experienceLevel,
        interviewType,
        resumeUrl: parsedResume?.resumeUrl,
        resumeData: {
          username: parsedResume?.username ?? candidateName.trim(),
          skills: parsedResume?.skills ?? [],
          experience: parsedResume?.experience ?? experienceLevel,
          projects: parsedResume?.projects ?? [],
          companies: parsedResume?.companies ?? [],
          technologies: parsedResume?.technologies ?? [],
          education: parsedResume?.education ?? '',
        },
      }).unwrap()
      onStarted(session.interviewId)
    } catch {
      /* shown via error */
    }
  }

  const selectClass =
    'w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#161722] border border-[#2d2e3e] shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e3e]">
          <div>
            <h2 className="text-lg font-bold text-white">Start AI Interview</h2>
            <p className="text-xs text-[#8b8ca8]">Step {step} of 2</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[#8b8ca8] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8b8ca8] mb-1.5 block">Full Name</label>
                <input
                  className={selectClass}
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8b8ca8] mb-1.5 block">Target Designation</label>
                <select className={selectClass} value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8b8ca8] mb-1.5 block">Experience Level</label>
                <select className={selectClass} value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8b8ca8] mb-1.5 block">Interview Type</label>
                <select className={selectClass} value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-[#8b8ca8] mb-4">
                Upload your resume so the AI can generate personalized questions.
              </p>
              <ResumeUploader onParsed={handleParsed} parsed={parsedResume} />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 mt-3">{extractApiError(error) || 'Could not start interview'}</p>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d2e3e] bg-[#0b0c14]/40">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-sm text-[#8b8ca8] hover:text-white"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}

          {step < 2 ? (
            <button
              type="button"
              disabled={!candidateName.trim()}
              onClick={() => setStep(2)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoading || !parsedResume}
              onClick={() => void handleStart()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Generate Interview
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
