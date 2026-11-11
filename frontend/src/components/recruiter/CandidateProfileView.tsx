import { useState } from 'react'
import { X, Download, Calendar, MessageCircle, CheckCircle2 } from 'lucide-react'
import type { RecruiterCandidate } from '../../data/recruiterData'
import { ScheduleInterviewModal } from './ScheduleInterviewModal'
import type { ScheduledInterview } from '../../lib/recruiterInterviews'
import { FeatureGuard, LockedFeatureCard } from './subscription/FeatureGuard'
import { useSubscription } from '../../contexts/SubscriptionContext'

type Props = {
  candidate: RecruiterCandidate
  onClose: () => void
  onInterviewScheduled?: (interview: ScheduledInterview) => void
}

function SkillBar({ skill, level }: { skill: string; level: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-[#c4c5d6]">{skill}</span>
        <span className="font-semibold text-violet-300">{level}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#2d2e3e]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  )
}

export function CandidateProfileView({ candidate, onClose, onInterviewScheduled }: Props) {
  const b = candidate.breakdown
  const { hasFeature } = useSubscription()
  const [showSchedule, setShowSchedule] = useState(false)
  const showPremium = hasFeature('devScore')

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl">
          <div className="sticky top-0 flex items-start justify-between border-b border-[#2d2e3e] bg-[#161722]/95 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
                {candidate.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{candidate.name}</h2>
                <p className="text-sm text-[#8b8ca8]">{candidate.role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#2d2e3e] p-2 text-[#8b8ca8] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-[#2d2e3e] bg-white/[0.03] p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Basic Profile</h3>
              <p className="text-sm text-white">{candidate.name}</p>
              <p className="text-xs text-[#8b8ca8]">{candidate.role} · {candidate.experience}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#2d2e3e] px-2 py-0.5 text-[11px] text-[#c4c5d6]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <FeatureGuard feature="devScore">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-3 text-center">
                <p className="text-[10px] uppercase text-[#8b8ca8]">AI Match</p>
                <p className="text-2xl font-bold text-violet-300">{candidate.aiMatch ?? 90}%</p>
              </div>
              <div className="rounded-xl border border-[#2d2e3e] bg-white/5 p-3 text-center">
                <p className="text-[10px] uppercase text-[#8b8ca8]">DevScore</p>
                <p className="text-2xl font-bold text-white">{candidate.devScore}</p>
              </div>
              {b && showPremium && (
                <>
                  <div className="rounded-xl border border-[#2d2e3e] bg-white/5 p-3 text-center">
                    <p className="text-[10px] uppercase text-[#8b8ca8]">AI Interview</p>
                    <p className="text-xl font-bold text-white">{b.aiInterview}%</p>
                  </div>
                  <div className="rounded-xl border border-[#2d2e3e] bg-white/5 p-3 text-center">
                    <p className="text-[10px] uppercase text-[#8b8ca8]">Coding</p>
                    <p className="text-xl font-bold text-white">{b.codingScore}%</p>
                  </div>
                </>
              )}
            </div>
            </FeatureGuard>

            {!showPremium && (
              <LockedFeatureCard
                title="DevScore Details"
                description="Upgrade to Pro to unlock DevScore breakdown, AI interview scores, and mentor reviews."
                compact
              />
            )}

            {b && showPremium && (
              <FeatureGuard feature="aiMatch">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#2d2e3e] bg-white/[0.03] p-3">
                  <p className="text-xs text-[#8b8ca8]">Project Score</p>
                  <p className="text-lg font-bold text-white">{b.projectScore}%</p>
                </div>
                <div className="rounded-xl border border-[#2d2e3e] bg-white/[0.03] p-3">
                  <p className="text-xs text-[#8b8ca8]">Mentor Rating</p>
                  <p className="text-lg font-bold text-white">{b.mentorRating}/5</p>
                </div>
              </div>
              </FeatureGuard>
            )}

            {candidate.skillLevels && candidate.skillLevels.length > 0 && (
              <div className="rounded-xl border border-[#2d2e3e] bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Skills Graph</h3>
                <div className="space-y-3">
                  {candidate.skillLevels.map((s) => (
                    <SkillBar key={s.skill} skill={s.skill} level={s.level} />
                  ))}
                </div>
              </div>
            )}

            {candidate.projects && candidate.projects.length > 0 && (
              <div className="rounded-xl border border-[#2d2e3e] bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Verified Projects</h3>
                {candidate.projects.map((project) => (
                  <div key={project.name} className="mb-3 last:mb-0">
                    <p className="text-sm font-medium text-white">{project.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.checks.map((check) => (
                        <span
                          key={check.label}
                          className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
                        >
                          <CheckCircle2 size={11} />
                          {check.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {candidate.mentorFeedback && (
              <FeatureGuard feature="mentorReviews">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <h3 className="mb-2 text-sm font-semibold text-white">Mentor Feedback</h3>
                <p className="text-sm italic text-[#c4c5d6]">&ldquo;{candidate.mentorFeedback}&rdquo;</p>
              </div>
              </FeatureGuard>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <MessageCircle size={15} />
                Message Candidate
              </button>
              <button
                type="button"
                onClick={() => setShowSchedule(true)}
                className="flex items-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
              >
                <Calendar size={15} />
                Schedule Interview
              </button>
              {hasFeature('resumeDownload') ? (
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
                >
                  <Download size={15} />
                  Download Resume
                </button>
              ) : (
                <LockedFeatureCard title="Resume Download" compact />
              )}
            </div>
          </div>
        </div>
      </div>

      {showSchedule && (
        <ScheduleInterviewModal
          candidate={candidate}
          onClose={() => setShowSchedule(false)}
          onScheduled={(interview) => {
            setShowSchedule(false)
            onInterviewScheduled?.(interview)
          }}
        />
      )}
    </>
  )
}
