import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Filter,
  Loader2,
  Search,
  Star,
  User,
  Users,
} from 'lucide-react'
import {
  categoryLabel,
  CHALLENGE_CATEGORIES,
  DIFFICULTY_OPTIONS,
  difficultyBadgeClass,
  PROGRAMMING_LANGUAGES,
  useGetChallengeStatsQuery,
  useGetCodingChallengeQuery,
  useListChallengeCompaniesQuery,
  useListCodingChallengesQuery,
  type CodingChallengeSummary,
} from '../api/codingProblemsApi'
import { useListMyMentorsQuery } from '../api/mentorshipApi'
import {
  useJoinPairSessionByCodeMutation,
  useStartMentorPairSessionMutation,
} from '../api/pairProgrammingApi'
import { SessionWaitingScreen } from '../components/pair-programming/SessionWaitingScreen'
import { avatarUrl } from '../lib/avatar'

export function PairProgrammingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data: stats } = useGetChallengeStatsQuery()
  const { data: companies = [] } = useListChallengeCompaniesQuery()

  const [languageId, setLanguageId] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)
  const [preferredRole, setPreferredRole] = useState<'driver' | 'navigator'>('driver')
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [mode, setMode] = useState<'browse' | 'pair' | 'solo'>('browse')

  const { data: challenges = [], isLoading: challengesLoading } = useListCodingChallengesQuery({
    language: languageId,
    category: categoryFilter,
    difficulty: difficultyFilter,
    company: companyFilter,
    q: searchQuery || undefined,
  })

  const activeChallenge = useMemo(
    () => challenges.find((c) => c.id === selectedChallengeId) ?? challenges[0] ?? null,
    [challenges, selectedChallengeId]
  )

  const { data: challengeDetail } = useGetCodingChallengeQuery(activeChallenge?.id ?? '', {
    skip: !activeChallenge?.id,
  })

  const { data: myMentors = [], isLoading: mentorsLoading, isError: mentorsError, refetch: refetchMentors } =
    useListMyMentorsQuery(undefined, { pollingInterval: 15_000, refetchOnMountOrArgChange: true })

  const [startMentorSession, { isLoading: startingPair, error: startError }] = useStartMentorPairSessionMutation()
  const [joinPairSession, { isLoading: joining, error: joinError }] = useJoinPairSessionByCodeMutation()

  const [waitingCode, setWaitingCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState(searchParams.get('join') ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (myMentors.length === 1 && !selectedMentorId) {
      setSelectedMentorId(myMentors[0].mentorId)
    }
  }, [myMentors, selectedMentorId])

  useEffect(() => {
    if (challenges.length && !selectedChallengeId) {
      setSelectedChallengeId(challenges[0].id)
    }
  }, [challenges, selectedChallengeId])

  const selectedMentor = myMentors.find((m) => m.mentorId === selectedMentorId) ?? null
  const canStartPair = Boolean(selectedMentorId && activeChallenge && preferredRole)

  const effectiveLanguage = languageId !== 'all'
    ? languageId
    : activeChallenge?.languages[0] ?? 'java'

  async function handleStartPairSession() {
    setFormError(null)
    if (!activeChallenge) {
      setFormError('Please select a coding challenge')
      return
    }
    if (!selectedMentorId) {
      setFormError('Please select your mentor before starting a pair session.')
      return
    }
    try {
      const session = await startMentorSession({
        mentorId: selectedMentorId,
        problemId: activeChallenge.id,
        language: effectiveLanguage,
        role: preferredRole,
      }).unwrap()
      setWaitingCode(session.sessionCode)
    } catch (err) {
      setFormError(extractError(err, 'Failed to start pair session'))
    }
  }

  function handlePracticeAlone() {
    setFormError(null)
    if (!activeChallenge) {
      setFormError('Please select a coding challenge')
      return
    }
    const lang = effectiveLanguage
    navigate(`/practice/${activeChallenge.id}?lang=${encodeURIComponent(lang)}`)
  }

  async function handleJoinByCode() {
    setFormError(null)
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    try {
      const session = await joinPairSession(code).unwrap()
      if (session.status === 'WAITING') {
        setWaitingCode(session.sessionCode)
        return
      }
      navigate(`/pair-session/${session.sessionCode}`)
    } catch (err) {
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : null
      if (status === 404) setFormError('Session not found')
      else if (status === 409) setFormError('Cannot join session — it may be waiting for approval or already ended')
      else setFormError('Could not join session')
    }
  }

  if (waitingCode) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <SessionWaitingScreen
          sessionCode={waitingCode}
          onActive={() => navigate(`/pair-session/${waitingCode}`)}
          onRejected={() => {
            setWaitingCode(null)
            setFormError('Your pair programming request was declined.')
          }}
        />
      </div>
    )
  }

  const inputClass =
    'h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]'

  const apiError =
    formError ||
    (startError && 'data' in startError ? String((startError.data as { message?: string })?.message) : null) ||
    (joinError && 'data' in joinError ? String((joinError.data as { message?: string })?.message) : null)

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5 text-[#818cf8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Coding Practice</h1>
            <p className="text-sm text-[#8b8ca8] mt-1 max-w-xl">
              Browse database-driven challenges, practice solo, or pair with your mentor in a shared coding room.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <StatPill label="Problems" value={stats?.totalProblems ?? '—'} />
          <StatPill label="Solved" value={stats?.solvedCount ?? '—'} accent />
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{apiError}</p>
        </div>
      )}

      <section className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 mb-6">
        <h2 className="text-sm font-semibold text-white mb-2">Join with session code</h2>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="PP-XXXXXX"
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            disabled={joining || !joinCode.trim()}
            onClick={() => void handleJoinByCode()}
            className="px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
          >
            {joining ? 'Joining…' : 'Join Session'}
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-[#818cf8]" />
          <h2 className="text-sm font-semibold text-white">Filters</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
          <select className={inputClass} value={languageId} onChange={(e) => setLanguageId(e.target.value)}>
            <option value="all">All languages</option>
            {PROGRAMMING_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
          <select className={inputClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {CHALLENGE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select className={inputClass} value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <select className={inputClass} value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems…"
              className={`w-full pl-9 ${inputClass}`}
            />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">
            Challenges {challenges.length > 0 && <span className="text-[#5c5d72] font-normal">({challenges.length})</span>}
          </h2>
        </div>

        {challengesLoading ? (
          <p className="text-sm text-[#8b8ca8] flex items-center gap-2 py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading challenges…
          </p>
        ) : challenges.length === 0 ? (
          <div className="rounded-xl border border-[#2d2e3e] bg-[#161722] p-8 text-center">
          <p className="text-sm text-[#8b8ca8]">No coding challenges available yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                selected={activeChallenge?.id === challenge.id}
                onSelect={() => {
                  setSelectedChallengeId(challenge.id)
                  setMode('browse')
                }}
              />
            ))}
          </div>
        )}
      </section>

      {activeChallenge && (
        <section className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white">{activeChallenge.title}</h2>
                {activeChallenge.solved && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                    <CheckCircle2 size={10} /> Solved
                  </span>
                )}
              </div>
              <p className="text-xs text-[#818cf8]">{categoryLabel(activeChallenge.category)}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${difficultyBadgeClass(activeChallenge.difficulty)}`}>
              {activeChallenge.difficulty}
            </span>
          </div>

          <p className="text-sm text-[#b4b5c8] mb-4 whitespace-pre-wrap">{activeChallenge.description}</p>

          {activeChallenge.companies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {activeChallenge.companies.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b0c14] border border-[#2d2e3e] text-[#8b8ca8]">{c}</span>
              ))}
            </div>
          )}

          {activeChallenge.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {activeChallenge.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">{t}</span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            <button
              type="button"
              onClick={() => setMode('solo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'solo' ? 'dc-gradient-btn text-white' : 'bg-[#0b0c14] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              <User size={14} /> Practice Alone
            </button>
            <button
              type="button"
              onClick={() => setMode('pair')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'pair' ? 'dc-gradient-btn text-white' : 'bg-[#0b0c14] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              <Users size={14} /> Pair With Mentor
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[#8b8ca8] mb-2">Language</label>
              <select className={`w-full ${inputClass}`} value={languageId} onChange={(e) => setLanguageId(e.target.value)}>
                {activeChallenge.languages.map((l) => (
                  <option key={l} value={l}>{PROGRAMMING_LANGUAGES.find((p) => p.id === l)?.label ?? l}</option>
                ))}
              </select>
            </div>
            {mode === 'pair' && (
              <div>
                <label className="block text-xs text-[#8b8ca8] mb-2">Your starting role</label>
                <div className="flex gap-2">
                  {(['driver', 'navigator'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setPreferredRole(role)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        preferredRole === role
                          ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]'
                          : 'bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {mode === 'solo' && (
            <button
              type="button"
              disabled={!activeChallenge}
              onClick={handlePracticeAlone}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
            >
              <Code2 size={16} /> Start Practice
            </button>
          )}

          {mode === 'pair' && (
            <>
              <div className="mb-4">
                <label className="block text-xs text-[#8b8ca8] mb-2">Your mentor</label>
                {mentorsLoading ? (
                  <p className="text-sm text-[#8b8ca8] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading mentors…</p>
                ) : mentorsError ? (
                  <div className="rounded-lg bg-[#0b0c14] border border-red-500/30 p-4">
                    <p className="text-sm text-red-300 mb-2">Could not load your accepted mentors.</p>
                    <button type="button" onClick={() => void refetchMentors()} className="text-sm text-[#818cf8] hover:underline">Retry</button>
                  </div>
                ) : myMentors.length === 0 ? (
                  <div className="rounded-lg bg-[#0b0c14] border border-[#2d2e3e] p-4">
                    <p className="text-sm text-[#8b8ca8] mb-2">No accepted mentors yet.</p>
                    <Link to="/my-mentorship-requests" className="text-sm text-[#818cf8] hover:underline">View my mentorship requests →</Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {myMentors.map((m) => (
                      <button
                        key={m.mentorId}
                        type="button"
                        onClick={() => setSelectedMentorId(m.mentorId)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          selectedMentorId === m.mentorId
                            ? 'border-[#6366f1] bg-[#6366f1]/10 ring-1 ring-[#6366f1]/40'
                            : 'border-[#2d2e3e] bg-[#0b0c14] hover:border-[#6366f1]/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img src={m.profileImageUrl ?? avatarUrl(m.mentorName, 48)} alt="" className="w-12 h-12 rounded-full shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{m.mentorName}</p>
                            {m.headline && <p className="text-xs text-[#8b8ca8] truncate mt-0.5">{m.headline}</p>}
                            <span className="inline-flex items-center gap-1 text-xs text-amber-300 mt-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              {m.averageRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedMentor && (
                  <p className="text-xs text-[#8b8ca8] mt-2">
                    Your mentor will receive a notification to join: <span className="text-white">{selectedMentor.mentorName}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={startingPair || !canStartPair}
                onClick={() => void handleStartPairSession()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
              >
                {startingPair ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending request…</>
                ) : (
                  <><Users size={16} /> Start Pair Session</>
                )}
              </button>
            </>
          )}

          {challengeDetail && mode === 'browse' && (
            <p className="text-xs text-[#5c5d72] mt-4">
              Choose Practice Alone or Pair With Mentor to begin.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-2 border ${accent ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-[#2d2e3e] bg-[#161722]'}`}>
      <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function ChallengeCard({
  challenge,
  selected,
  onSelect,
}: {
  challenge: CodingChallengeSummary
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl border p-4 transition-colors ${
        selected ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-[#2d2e3e] bg-[#161722] hover:border-[#6366f1]/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="font-semibold text-white text-sm truncate">{challenge.title}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${difficultyBadgeClass(challenge.difficulty)}`}>
          {challenge.difficulty}
        </span>
      </div>
      <p className="text-[10px] text-[#818cf8] mb-1">{categoryLabel(challenge.category)}</p>
      <p className="text-xs text-[#8b8ca8] line-clamp-2">{challenge.description}</p>
      <div className="flex items-center justify-between mt-2">
        {challenge.solved ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 size={10} /> Solved</span>
        ) : (
          <span className="text-[10px] text-[#5c5d72]">Not solved</span>
        )}
        {challenge.companies[0] && (
          <span className="text-[10px] text-[#5c5d72] truncate max-w-[100px]">{challenge.companies[0]}</span>
        )}
        {challenge.solvedCount > 0 && (
          <span className="text-[10px] text-[#5c5d72]">{challenge.solvedCount} solved</span>
        )}
      </div>
    </button>
  )
}

function extractError(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err && typeof (err as { data?: unknown }).data === 'object') {
    return String((err as { data?: { message?: string } }).data?.message ?? fallback)
  }
  return fallback
}
