import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Users,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  BadgeCheck,
  Loader2,
  X,
} from 'lucide-react'
import { useAppSelector } from '../hooks'
import {
  useListMentorsQuery,
  useGetMyApplicationQuery,
  useListAllApplicationsQuery,
  useApproveApplicationMutation,
  useRejectApplicationMutation,
} from '../api/mentorApi'
import { useListUsersQuery, useUpdateUserRoleMutation } from '../api/adminApi'
import { MentorOnboardingFlow } from '../components/mentor-onboarding/MentorOnboardingFlow'
import { avatarUrl } from '../lib/avatar'

// ── Approved-banner visibility hook ──────────────────────────────────────────
// Tracks when the APPROVED status was first seen (in localStorage) and returns
// whether the 10-minute display window has expired.

const BANNER_TTL_MS = 10 * 60 * 1000  // 10 minutes

function useApprovedBannerVisible(userId: string | undefined, status: string | null) {
  const storageKey = userId ? `dc-approved-banner-${userId}` : null

  const [visible, setVisible] = useState<boolean>(() => {
    if (!storageKey || status !== 'APPROVED') return false
    const raw = localStorage.getItem(storageKey)
    if (!raw) return true                     // first time seeing APPROVED — show it
    const seenAt = parseInt(raw, 10)
    return Date.now() - seenAt < BANNER_TTL_MS
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!storageKey || status !== 'APPROVED') return

    const raw = localStorage.getItem(storageKey)
    let seenAt: number

    if (!raw) {
      // First time we see APPROVED — stamp it
      seenAt = Date.now()
      localStorage.setItem(storageKey, String(seenAt))
      setVisible(true)
    } else {
      seenAt = parseInt(raw, 10)
    }

    const elapsed  = Date.now() - seenAt
    const remaining = BANNER_TTL_MS - elapsed

    if (remaining <= 0) {
      setVisible(false)
      return
    }

    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), remaining)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [storageKey, status])

  // Allow manual dismiss — records "seen now - TTL" so it won't reappear
  function dismiss() {
    setVisible(false)
    if (storageKey) {
      // Push the stamp back so remaining = 0 immediately
      localStorage.setItem(storageKey, String(Date.now() - BANNER_TTL_MS))
    }
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // Remaining seconds for progress display (refreshed every second while visible)
  const [remainingSecs, setRemainingSecs] = useState<number>(0)
  useEffect(() => {
    if (!visible || !storageKey) return
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const seenAt = parseInt(raw, 10)

    const tick = () => {
      const left = Math.max(0, Math.ceil((BANNER_TTL_MS - (Date.now() - seenAt)) / 1000))
      setRemainingSecs(left)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [visible, storageKey])

  return { visible, dismiss, remainingSecs }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRate(cents: number | null | undefined) {
  if (!cents) return 'Free'
  return `$${(cents / 100).toFixed(0)}/hr`
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[#3d3e52]'}
        />
      ))}
    </span>
  )
}

// ── Application status banner ────────────────────────────────────────────────

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

type StatusBannerProps = {
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | null
  reviewNote?: string | null
  infoRequestMessage?: string | null
  onReapply?: () => void
  /** Only used for APPROVED — controls auto-dismiss */
  onDismiss?: () => void
  remainingSecs?: number
}

function ApplicationStatusBanner({ status, reviewNote, infoRequestMessage, onReapply, onDismiss, remainingSecs }: StatusBannerProps) {
  if (status === null) return null

  const configs = {
    PENDING: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: <Clock size={20} className="text-amber-400 shrink-0" />,
      title: 'Application Under Review',
      desc: "Your mentor application has been submitted and is waiting for admin approval. We'll notify you once it's reviewed.",
      badge: 'bg-amber-500/20 text-amber-300',
      badgeText: 'Pending',
    },
    INFO_REQUESTED: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: <AlertCircle size={20} className="text-blue-400 shrink-0" />,
      title: 'More Information Required',
      desc: infoRequestMessage ?? reviewNote ?? 'The admin team needs additional information before they can review your application. Please update your application below.',
      badge: 'bg-blue-500/20 text-blue-300',
      badgeText: 'Action Required',
    },
    APPROVED: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />,
      title: 'Application Approved!',
      desc: 'Congratulations! You are now an approved mentor on DevConnect. Your profile is live for students to book sessions.',
      badge: 'bg-emerald-500/20 text-emerald-300',
      badgeText: 'Approved',
    },
    REJECTED: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: <XCircle size={20} className="text-red-400 shrink-0" />,
      title: 'Application Not Approved',
      desc: 'Unfortunately your application was not approved at this time. You may re-apply after improving your profile.',
      badge: 'bg-red-500/20 text-red-300',
      badgeText: 'Rejected',
    },
  }

  const cfg = configs[status]
  const isApproved = status === 'APPROVED'
  const pct = isApproved && remainingSecs !== undefined
    ? Math.round((remainingSecs / (BANNER_TTL_MS / 1000)) * 100)
    : 100

  return (
    <div className={`rounded-xl border p-5 mb-6 ${cfg.bg} relative`}>
      {/* Auto-dismiss progress bar (APPROVED only) */}
      {isApproved && remainingSecs !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-[#2d2e3e] overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-1000 linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="font-semibold text-white text-sm">{cfg.title}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.badgeText}
            </span>
            {/* Countdown timer for APPROVED */}
            {isApproved && remainingSecs !== undefined && remainingSecs > 0 && (
              <span className="ml-auto text-[10px] text-emerald-500/70 font-mono flex items-center gap-1">
                <Clock size={10} /> Dismisses in {fmtTime(remainingSecs)}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8b8ca8] leading-relaxed">{cfg.desc}</p>
          {reviewNote && (
            <p className="text-xs text-[#a5a6bb] mt-2 italic">
              <span className="font-medium text-white">Admin note:</span> {reviewNote}
            </p>
          )}
        </div>

        {/* Dismiss button (APPROVED) */}
        {isApproved && onDismiss && (
          <button
            onClick={onDismiss}
            title="Dismiss"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-emerald-500/60 hover:text-white hover:bg-emerald-500/20 transition-colors"
          >
            <X size={13} />
          </button>
        )}

        {/* Re-apply button (REJECTED) */}
        {status === 'REJECTED' && onReapply && (
          <button
            onClick={onReapply}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-[#818cf8] hover:text-white transition-colors"
          >
            <RefreshCw size={13} /> Re-apply
          </button>
        )}
      </div>

      {/* Step tracker */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        {(['Submitted', 'Under Review', 'Decision Made'] as const).map((step, i) => {
          const done =
            i === 0 ||
            (i === 1 && (status === 'APPROVED' || status === 'REJECTED')) ||
            (i === 2 && (status === 'APPROVED' || status === 'REJECTED'))
          const active = i === 1 && status === 'PENDING'
          return (
            <div key={step} className="flex items-center gap-2 shrink-0">
              {i > 0 && (
                <div className={`h-px w-8 ${done || active ? 'bg-[#818cf8]' : 'bg-[#2d2e3e]'}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
                    ${done && !active ? 'bg-[#818cf8] text-white' : active ? 'bg-amber-400 text-black' : 'bg-[#2d2e3e] text-[#5c5d72]'}`}
                >
                  {done && !active ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] whitespace-nowrap ${done || active ? 'text-white' : 'text-[#5c5d72]'}`}>
                  {step}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Admin panel ───────────────────────────────────────────────────────────────

function AdminPanel() {
  const { data: applications, isLoading } = useListAllApplicationsQuery()
  const { data: users } = useListUsersQuery()
  const [approve] = useApproveApplicationMutation()
  const [reject] = useRejectApplicationMutation()
  const [updateRole] = useUpdateUserRoleMutation()
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})

  function roleSet(roles: string | undefined): string[] {
    return (roles ?? 'USER')
      .split(',')
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean)
  }

  async function handleApprove(app: { id: string; userId: string }) {
    await approve({ id: app.id, reviewNote: noteMap[app.id] }).unwrap()
    const user = users?.find((u) => u.id === app.userId)
    const next = new Set(roleSet(user?.roles))
    next.add('MENTOR')
    await updateRole({ id: app.userId, roles: [...next].join(',') }).unwrap()
  }

  async function handleReject(app: { id: string; userId: string }) {
    await reject({ id: app.id, reviewNote: noteMap[app.id] }).unwrap()
    const user = users?.find((u) => u.id === app.userId)
    const next = roleSet(user?.roles).filter((r) => r !== 'MENTOR')
    if (next.length > 0) {
      await updateRole({ id: app.userId, roles: next.join(',') }).unwrap()
    }
  }

  const pending = applications?.filter((a) => a.status === 'PENDING') ?? []
  const reviewed = applications?.filter((a) => a.status !== 'PENDING' && a.status !== 'DRAFT') ?? []

  return (
    <div className="rounded-xl bg-[#161722] border border-[#818cf8]/30 p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheck size={18} className="text-[#818cf8]" />
        <h2 className="font-semibold text-white text-sm">Admin — Mentor Applications</h2>
        {pending.length > 0 && (
          <span className="ml-auto bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[#818cf8]" />
        </div>
      )}

      {!isLoading && applications?.length === 0 && (
        <p className="text-sm text-[#5c5d72] text-center py-6">No applications yet.</p>
      )}

      <div className="space-y-3">
        {[...pending, ...reviewed].map((app) => (
          <div
            key={app.id}
            className={`rounded-lg border p-4 ${
              app.status === 'PENDING'
                ? 'border-amber-500/20 bg-amber-500/5'
                : app.status === 'APPROVED'
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-red-500/20 bg-red-500/5'
            }`}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-white">{app.username ?? 'Unknown user'}</p>
                <p className="text-xs text-[#8b8ca8] mt-0.5">{app.headline}</p>
                {app.motivation && (
                  <p className="text-xs text-[#5c5d72] mt-1 italic line-clamp-2">"{app.motivation}"</p>
                )}
                {app.status !== 'PENDING' && app.reviewedBy && (
                  <p className="text-xs text-[#5c5d72] mt-1">
                    Reviewed by <span className="text-white">{app.reviewedBy}</span>
                    {app.reviewNote && <> — "{app.reviewNote}"</>}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  app.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300'
                    : app.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {app.status}
              </span>
            </div>

            {app.status === 'PENDING' && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <input
                  value={noteMap[app.id] ?? ''}
                  onChange={(e) => setNoteMap((m) => ({ ...m, [app.id]: e.target.value }))}
                  placeholder="Optional review note…"
                  className="flex-1 min-w-[160px] bg-[#1c1d2a] border border-[#2d2e3e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]"
                />
                <button
                  onClick={() => void handleApprove(app)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <CheckCircle2 size={12} /> Approve
                </button>
                <button
                  onClick={() => void handleReject(app)}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <XCircle size={12} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MentorshipPage() {
  const location = useLocation()
  const accessState = location.state as {
    mentorAccessDenied?: boolean
    message?: string
    status?: string | null
  } | null

  const account = useAppSelector((s) => s.auth.account)
  const isAdmin = account?.roles?.includes('ADMIN') ?? false

  const {
    data: mentors,
    isLoading: mentorsLoading,
    isError: mentorsError,
    error: mentorsFetchError,
    refetch: refetchMentors,
  } = useListMentorsQuery()
  const {
    data: myApplication,
    isLoading: appLoading,
    error: appError,
    refetch: refetchApp,
  } = useGetMyApplicationQuery()

  // "No application" (404) = user hasn't applied yet
  const noApplication = appError && (appError as { status?: number }).status === 404
  const appResolved = !appLoading
  const [reapplying, setReapplying] = useState(false)

  const applicationStatus = myApplication?.status ?? null

  // ── Auto-dismiss the APPROVED banner after 10 minutes ────────────────────
  const { visible: approvedBannerVisible, dismiss: dismissApprovedBanner, remainingSecs } =
    useApprovedBannerVisible(account?.id, applicationStatus)

  function handleReapply() {
    setReapplying(true)
  }

  function handleApplySuccess() {
    setReapplying(false)
    refetchApp()
  }

  // Show the banner if:
  //   PENDING or REJECTED  → always show while application exists
  //   APPROVED             → only while the 10-min window hasn't expired
  const showBanner =
    !noApplication &&
    applicationStatus !== null &&
    applicationStatus !== 'DRAFT' &&
    (applicationStatus === 'PENDING' ||
      applicationStatus === 'REJECTED' ||
      applicationStatus === 'INFO_REQUESTED' ||
      (applicationStatus === 'APPROVED' && approvedBannerVisible))

  // Show onboarding when: no application, draft, rejected re-apply, or explicit apply
  const showOnboarding =
    appResolved
    && (noApplication || applicationStatus === 'DRAFT' || applicationStatus === 'REJECTED' || applicationStatus === 'INFO_REQUESTED' || reapplying)
    && applicationStatus !== 'APPROVED'
    && applicationStatus !== 'PENDING'

  const mentorsFetchStatus = mentorsFetchError
    ? (mentorsFetchError as { status?: number | string }).status
    : null

  return (
    <div className="min-h-screen bg-[#0b0c14] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Mentorship</h1>
          <p className="text-sm text-[#8b8ca8] mt-1">
            Learn from experienced developers or share your expertise as a mentor
          </p>
        </div>

        {/* Admin panel */}
        {isAdmin && <AdminPanel />}

        {accessState?.mentorAccessDenied && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 mb-5 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Mentor workspace unavailable</p>
              <p className="text-xs text-[#8b8ca8] mt-1">
                {accessState.message ?? 'You must be approved as a mentor before accessing the developer workspace.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Application status / CTA ───────────────────────────────────── */}
        {appLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={22} className="animate-spin text-[#818cf8]" />
          </div>
        ) : (
          <>
            {/* Status banner — APPROVED auto-dismisses after 10 min */}
            {showBanner && (
              <ApplicationStatusBanner
                status={applicationStatus}
                reviewNote={myApplication?.reviewNote}
                infoRequestMessage={myApplication?.infoRequestMessage}
                onReapply={handleReapply}
                onDismiss={applicationStatus === 'APPROVED' ? dismissApprovedBanner : undefined}
                remainingSecs={applicationStatus === 'APPROVED' ? remainingSecs : undefined}
              />
            )}

            {showOnboarding && (
              <MentorOnboardingFlow
                initialDraft={myApplication?.applicationData ?? null}
                initialStep={myApplication?.currentStep ?? 1}
                onSubmitted={handleApplySuccess}
              />
            )}
          </>
        )}

        <div className={showOnboarding ? 'mt-8' : ''}>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={15} className="text-[#818cf8]" /> Available Mentors
          </h2>

          {mentorsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 size={22} className="animate-spin text-[#818cf8]" />
            </div>
          )}

          {mentorsError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center">
              <AlertCircle size={22} className="text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">Could not load mentors</p>
              <p className="text-xs text-[#8b8ca8] mt-1">
                {mentorsFetchStatus === 'FETCH_ERROR'
                  ? 'Make sure gateway-service (port 8080) and mentor-service (port 8086) are running.'
                  : `Request failed${mentorsFetchStatus ? ` (${String(mentorsFetchStatus)})` : ''}.`}
              </p>
              <button
                type="button"
                onClick={() => void refetchMentors()}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#818cf8] hover:text-white transition-colors"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}

          {!mentorsLoading && !mentorsError && mentors?.length === 0 && (
            <div className="text-center py-12 text-[#5c5d72] text-sm">No mentors available right now.</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {!mentorsError && mentors?.map((mentor) => (
              <div
                key={mentor.userId}
                className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 hover:border-[#818cf8]/40 transition-colors group"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={avatarUrl(mentor.userId)}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{mentor.headline ?? 'Mentor'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Stars rating={mentor.averageRating} />
                      <span className="text-[10px] text-[#5c5d72]">{mentor.averageRating.toFixed(1)}</span>
                      <span className="text-[10px] text-[#5c5d72]">·</span>
                      <span className="text-[10px] text-[#5c5d72]">{mentor.ratingCount} sessions</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {mentor.bio && (
                  <p className="text-xs text-[#8b8ca8] line-clamp-2 mb-3">{mentor.bio}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mentor.verified && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        <BadgeCheck size={10} /> Verified
                      </span>
                    )}
                    {mentor.available ? (
                      <span className="text-[10px] text-emerald-400 font-medium">● Online</span>
                    ) : (
                      <span className="text-[10px] text-[#5c5d72]">● Offline</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#818cf8]">{formatRate(mentor.hourlyRateCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MentorshipPage
