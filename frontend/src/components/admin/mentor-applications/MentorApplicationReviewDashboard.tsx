import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BadgeCheck, CheckCircle2, Code, ExternalLink, Eye, EyeOff,
  FileText, Globe, IndianRupee, Landmark, Link, Loader2,
  MapPin, MessageSquare, Shield, XCircle,
} from 'lucide-react'
import {
  useApproveAdminMentorApplicationMutation,
  useGetAdminMentorApplicationQuery,
  useRejectAdminMentorApplicationMutation,
  useRequestInfoAdminMentorApplicationMutation,
  useSaveAdminMentorApplicationNotesMutation,
  useSuspendAdminMentorApplicationMutation,
  type AdminMentorApplicationDetail,
} from '../../../api/adminMentorApplicationsApi'
import { useUpdateUserRoleMutation, useListUsersQuery } from '../../../api/adminApi'
import { formatInr } from '../../../lib/money'
import { avatarUrl } from '../../../lib/avatar'

type TabId = 'profile' | 'documents' | 'pricing' | 'payout' | 'timeline'

const CATEGORY_COLORS = [
  'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'bg-pink-500/15 text-pink-300 border-pink-500/30',
  'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
]

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#2d2e3e]/80 bg-[#12131c]/70 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  )
}

function statusMeta(status: string) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    PENDING: { label: 'Pending Review', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', dot: 'bg-amber-400' },
    APPROVED: { label: 'Approved', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400' },
    REJECTED: { label: 'Rejected', color: 'text-red-400 bg-red-500/15 border-red-500/30', dot: 'bg-red-400' },
    INFO_REQUESTED: { label: 'Info Requested', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', dot: 'bg-blue-400' },
    SUSPENDED: { label: 'Suspended', color: 'text-[#8b8ca8] bg-[#2d2e3e] border-[#3d3e52]', dot: 'bg-[#8b8ca8]' },
  }
  return map[status] ?? map.PENDING
}

function maskValue(value: string | null | undefined, visible: boolean) {
  if (!value) return '—'
  if (visible) return value
  if (value.length <= 4) return '****'
  return '**** **** **** ' + value.slice(-4)
}

interface Props {
  applicationId: string
  onBack: () => void
  onActionComplete: () => void
}

export function MentorApplicationReviewDashboard({ applicationId, onBack, onActionComplete }: Props) {
  const { data: app, isLoading, refetch } = useGetAdminMentorApplicationQuery(applicationId)
  const { data: users } = useListUsersQuery()
  const [updateRole] = useUpdateUserRoleMutation()
  const [approve, { isLoading: approving }] = useApproveAdminMentorApplicationMutation()
  const [reject, { isLoading: rejecting }] = useRejectAdminMentorApplicationMutation()
  const [requestInfo, { isLoading: requesting }] = useRequestInfoAdminMentorApplicationMutation()
  const [suspend, { isLoading: suspending }] = useSuspendAdminMentorApplicationMutation()
  const [saveNotes, { isLoading: savingNotes }] = useSaveAdminMentorApplicationNotesMutation()

  const [tab, setTab] = useState<TabId>('profile')
  const [showSensitive, setShowSensitive] = useState(false)
  const [notes, setNotes] = useState('')
  const [modal, setModal] = useState<'approve' | 'reject' | 'info' | 'suspend' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  if (isLoading || !app) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#818cf8]" />
      </div>
    )
  }

  const d = app.applicationData
  const displayName = d?.fullName ?? app.username ?? 'Mentor Applicant'
  const status = statusMeta(app.status)
  const videoCents = d?.videoPricePerMinuteCents ?? 0
  const platformShare = Math.round(videoCents * 0.5)
  const mentorShare = videoCents - platformShare

  async function handleApprove() {
    await approve({ id: app!.id }).unwrap()
    const user = users?.find((u) => u.id === app!.userId)
    const roles = new Set((user?.roles ?? 'USER').split(',').map((r) => r.trim().toUpperCase()).filter(Boolean))
    roles.add('MENTOR')
    await updateRole({ id: app!.userId, roles: [...roles].join(',') }).unwrap()
    setModal(null)
    setToast('Mentor approved successfully')
    onActionComplete()
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    await reject({ id: app!.id, reason: rejectReason.trim() }).unwrap()
    setModal(null)
    setToast('Application rejected')
    onActionComplete()
  }

  async function handleRequestInfo() {
    if (!infoMessage.trim()) return
    await requestInfo({ id: app!.id, message: infoMessage.trim() }).unwrap()
    setModal(null)
    setToast('Information request sent')
    void refetch()
  }

  async function handleSuspend() {
    await suspend(app!.id).unwrap()
    setModal(null)
    setToast('Application suspended')
    void refetch()
  }

  async function handleSaveNotes() {
    await saveNotes({ id: app!.id, notes }).unwrap()
    setToast('Notes saved')
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'payout', label: 'Payout' },
    { id: 'timeline', label: 'Timeline & Notes' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-[#161722] border border-[#6366f1]/40 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="px-6 py-5 border-b border-[#2d2e3e] bg-[#0b0c14]/80">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-[#818cf8] hover:text-white mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to applications
        </button>
        <div className="flex flex-wrap items-start gap-5">
          <img
            src={d?.profilePictureUrl || avatarUrl(displayName, 80)}
            alt=""
            className="w-20 h-20 rounded-2xl ring-2 ring-[#6366f1]/40 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              <BadgeCheck className="w-5 h-5 text-[#6366f1]" />
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-sm text-[#a5b4fc]">{d?.headline ?? app.headline}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(d?.skills ?? []).slice(0, 5).map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-[#6366f1]/15 text-[#c7d2fe] border border-[#6366f1]/25">{s}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-[#8b8ca8]">
              <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
              <span>{d?.experienceRange ?? '—'} experience</span>
              <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{d?.location ?? '—'}</span>
              <span className="text-[#6366f1] font-mono">{app.applicationCode}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 mt-5 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]/40'
                  : 'text-[#8b8ca8] hover:text-white hover:bg-[#161722]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {tab === 'profile' && <ProfileTab app={app} d={d} />}
            {tab === 'documents' && <DocumentsTab d={d} />}
            {tab === 'pricing' && <PricingTab d={d} videoCents={videoCents} platformShare={platformShare} mentorShare={mentorShare} />}
            {tab === 'payout' && (
              <PayoutTab d={d} showSensitive={showSensitive} onToggle={() => setShowSensitive((v) => !v)} />
            )}
            {tab === 'timeline' && (
              <TimelineTab
                app={app}
                notes={notes || app.adminInternalNotes || ''}
                onNotesChange={setNotes}
                onSaveNotes={() => void handleSaveNotes()}
                savingNotes={savingNotes}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <aside className="space-y-4 xl:sticky xl:top-4 self-start">
          <Glass className="p-4">
            <p className="text-xs font-semibold text-[#8b8ca8] mb-2">Application Status</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
              {status.label}
            </span>
            {app.infoRequestMessage && (
              <p className="text-xs text-blue-300 mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">{app.infoRequestMessage}</p>
            )}
          </Glass>
          <Glass className="p-4 space-y-2 text-xs">
            <p className="font-semibold text-white mb-2">Application Information</p>
            <div className="flex justify-between text-[#8b8ca8]"><span>Submitted</span><span className="text-white">{new Date(app.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between text-[#8b8ca8]"><span>Last Updated</span><span className="text-white">{new Date(app.updatedAt).toLocaleString()}</span></div>
            <div className="flex justify-between text-[#8b8ca8]"><span>Application ID</span><span className="text-[#6366f1] font-mono">{app.applicationCode}</span></div>
          </Glass>
          <Glass className="p-4 space-y-2">
            <p className="text-xs font-semibold text-white mb-2">Admin Actions</p>
            {(app.status === 'PENDING' || app.status === 'INFO_REQUESTED') && (
              <>
                <ActionBtn color="emerald" onClick={() => setModal('approve')} icon={<CheckCircle2 className="w-4 h-4" />}>Approve Mentor</ActionBtn>
                <ActionBtn color="red" onClick={() => setModal('reject')} icon={<XCircle className="w-4 h-4" />}>Reject Mentor</ActionBtn>
                <ActionBtn color="blue" onClick={() => setModal('info')} icon={<MessageSquare className="w-4 h-4" />}>Request More Information</ActionBtn>
              </>
            )}
            {app.status !== 'SUSPENDED' && app.status !== 'APPROVED' && (
              <ActionBtn color="gray" onClick={() => setModal('suspend')} icon={<Shield className="w-4 h-4" />}>Suspend Application</ActionBtn>
            )}
          </Glass>
        </aside>
      </div>

      {modal && (
        <ConfirmModal
          type={modal}
          onClose={() => setModal(null)}
          onConfirm={() => {
            if (modal === 'approve') void handleApprove()
            if (modal === 'reject') void handleReject()
            if (modal === 'info') void handleRequestInfo()
            if (modal === 'suspend') void handleSuspend()
          }}
          loading={approving || rejecting || requesting || suspending}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          infoMessage={infoMessage}
          onInfoMessageChange={setInfoMessage}
          displayName={displayName}
        />
      )}
    </div>
  )
}

function ProfileTab({ app, d }: { app: AdminMentorApplicationDetail; d: AdminMentorApplicationDetail['applicationData'] }) {
  const achievements = [
    d?.categories?.includes('Mock Interviews') ? 'Conducted mock interview sessions' : null,
    (d?.skills?.length ?? 0) >= 5 ? `Expert in ${d!.skills!.slice(0, 3).join(', ')}` : null,
    d?.bio && d.bio.length > 200 ? 'Experienced mentor with detailed professional background' : null,
    d?.company ? `Professional experience at ${d.company}` : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-4">Professional Information</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            ['Full Name', d?.fullName], ['Headline', d?.headline], ['Company', d?.company],
            ['Designation', d?.designation], ['Experience', d?.experienceRange], ['Location', d?.location],
            ['Languages', (d?.languages ?? []).join(', ')],
          ].map(([label, val]) => (
            <div key={label} className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
              <p className="text-[#6366f1] font-semibold mb-1">{label}</p>
              <p className="text-[#c7d2fe]">{val || '—'}</p>
            </div>
          ))}
        </div>
      </Glass>
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-3">About Mentor</h3>
        <p className="text-xs text-[#8b8ca8] leading-relaxed whitespace-pre-wrap">{d?.bio ?? app.bio ?? '—'}</p>
        {app.motivation && (
          <div className="mt-4 pt-4 border-t border-[#2d2e3e]">
            <p className="text-xs font-semibold text-[#a5b4fc] mb-1">Why mentor?</p>
            <p className="text-xs text-[#8b8ca8] italic">{app.motivation}</p>
          </div>
        )}
      </Glass>
      {achievements.length > 0 && (
        <Glass className="p-5">
          <h3 className="text-sm font-bold text-white mb-3">Achievements</h3>
          <ul className="space-y-2">
            {achievements.map((a) => (
              <li key={a} className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {a}
              </li>
            ))}
          </ul>
        </Glass>
      )}
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-3">Expertise & Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {(d?.skills ?? []).map((s) => (
            <span key={s} className="text-[10px] px-2.5 py-1 rounded-lg bg-[#6366f1]/15 text-[#c7d2fe] border border-[#6366f1]/25">{s}</span>
          ))}
        </div>
      </Glass>
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-3">Mentorship Categories</h3>
        <div className="flex flex-wrap gap-2">
          {(d?.categories ?? []).map((c, i) => (
            <span key={c} className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}>{c}</span>
          ))}
        </div>
      </Glass>
    </>
  )
}

function DocumentsTab({ d }: { d: AdminMentorApplicationDetail['applicationData'] }) {
  const links = [
    { label: 'LinkedIn', url: d?.linkedinUrl, icon: Link },
    { label: 'GitHub', url: d?.githubUrl, icon: Code },
    { label: 'Portfolio', url: d?.portfolioUrl, icon: Globe },
  ]
  const emailVerified = Boolean(d?.companyEmail?.includes('@'))

  return (
    <div className="space-y-4">
      {links.map(({ label, url, icon: Icon }) => (
        <Glass key={label} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="w-5 h-5 text-[#818cf8] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-[#5c5d72] truncate">{url || 'Not provided'}</p>
            </div>
          </div>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#6366f1]/15 text-[#c7d2fe] text-xs font-semibold hover:bg-[#6366f1]/25">
              Open {label} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </Glass>
      ))}
      <DocCard title="Resume" url={d?.resumeUrl} />
      <DocCard title="Government ID" url={d?.govIdUrl} optional />
      <Glass className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Company Email Verification</p>
          <p className="text-xs text-[#5c5d72] mt-0.5">{d?.companyEmail || 'No company email provided'}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${emailVerified ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' : 'text-amber-400 bg-amber-500/15 border-amber-500/30'}`}>
          {emailVerified ? 'Provided' : 'Not Verified'}
        </span>
      </Glass>
    </div>
  )
}

function DocCard({ title, url, optional }: { title: string; url?: string | null; optional?: boolean }) {
  return (
    <Glass className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#818cf8]" />
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-[#5c5d72]">{url ? 'Document uploaded' : optional ? 'Optional — not uploaded' : 'Not uploaded'}</p>
          </div>
        </div>
        {url && (
          <div className="flex gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-[#6366f1]/15 text-[#c7d2fe] text-xs font-semibold">View</a>
            <a href={url} download className="px-3 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] text-xs font-semibold hover:text-white">Download</a>
          </div>
        )}
      </div>
    </Glass>
  )
}

function PricingTab({
  d, videoCents, platformShare, mentorShare,
}: {
  d: AdminMentorApplicationDetail['applicationData']
  videoCents: number
  platformShare: number
  mentorShare: number
}) {
  const rows = [
    ['Audio Call', d?.audioPricePerMinuteCents, '/min'],
    ['Video Call', d?.videoPricePerMinuteCents, '/min'],
    ['Mock Interview', d?.mockInterviewPriceCents, '/session'],
    ['Resume Review', d?.resumeReviewPriceCents, '/session'],
  ]
  return (
    <>
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-emerald-400" /> Services Pricing</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map(([label, cents, suffix]) => (
            <div key={label as string} className="p-4 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
              <p className="text-xs text-[#8b8ca8]">{label as string}</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{cents ? formatInr(cents as number) : '—'}{suffix as string}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-[#8b8ca8]">Instant Calls:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d?.instantCallEnabled ? 'text-emerald-400 bg-emerald-500/15' : 'text-red-400 bg-red-500/15'}`}>
            {d?.instantCallEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </Glass>
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-4">Revenue Breakdown (Video Call)</h3>
        <div className="space-y-3">
          {[
            { label: 'User Pays', val: videoCents, color: 'bg-[#6366f1]', pct: 100 },
            { label: 'Platform Share (50%)', val: platformShare, color: 'bg-amber-500', pct: 50 },
            { label: 'Mentor Earnings (50%)', val: mentorShare, color: 'bg-emerald-500', pct: 50 },
          ].map(({ label, val, color, pct }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8b8ca8]">{label}</span>
                <span className="text-white font-semibold">{formatInr(val)}/min</span>
              </div>
              <div className="h-2 rounded-full bg-[#1c1d2a] overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Glass>
    </>
  )
}

function PayoutTab({
  d, showSensitive, onToggle,
}: {
  d: AdminMentorApplicationDetail['applicationData']
  showSensitive: boolean
  onToggle: () => void
}) {
  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Landmark className="w-4 h-4 text-[#818cf8]" /> Payout Details</h3>
        <button type="button" onClick={onToggle} className="inline-flex items-center gap-1 text-xs text-[#818cf8] hover:text-white">
          {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showSensitive ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        {[
          ['Account Holder', d?.accountHolderName],
          ['Bank Name', d?.bankName],
          ['Account Number', maskValue(d?.accountNumber, showSensitive)],
          ['IFSC Code', showSensitive ? d?.ifscCode : d?.ifscCode ? '****' + d.ifscCode.slice(-4) : '—'],
          ['UPI ID', maskValue(d?.upiId, showSensitive)],
          ['PAN Number', showSensitive ? d?.panNumber : d?.panNumber ? '****' + d.panNumber.slice(-4) : '—'],
        ].map(([label, val]) => (
          <div key={label as string} className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
            <p className="text-[#6366f1] font-semibold mb-1">{label as string}</p>
            <p className="text-[#c7d2fe] font-mono">{val || '—'}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[#5c5d72] mt-4 flex items-center gap-1"><Shield className="w-3 h-3" /> Sensitive payout data is encrypted and admin-only.</p>
    </Glass>
  )
}

function TimelineTab({
  app, notes, onNotesChange, onSaveNotes, savingNotes,
}: {
  app: AdminMentorApplicationDetail
  notes: string
  onNotesChange: (v: string) => void
  onSaveNotes: () => void
  savingNotes: boolean
}) {
  return (
    <>
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-4">Application Timeline</h3>
        <div className="space-y-0">
          {app.timeline.map((ev, i) => (
            <div key={`${ev.type}-${i}`} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] ring-4 ring-[#6366f1]/20" />
                {i < app.timeline.length - 1 && <div className="w-px flex-1 bg-[#2d2e3e] mt-1" />}
              </div>
              <div className="pb-2">
                <p className="text-xs font-semibold text-white">{ev.label}</p>
                <p className="text-[10px] text-[#5c5d72]">{new Date(ev.occurredAt).toLocaleString()}{ev.actor ? ` · ${ev.actor}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </Glass>
      <Glass className="p-5">
        <h3 className="text-sm font-bold text-white mb-3">Internal Review Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Strong Java profile. Good mentoring experience."
          className="w-full bg-[#0b0c14]/80 border border-[#2d2e3e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#6366f1]/50 resize-none"
        />
        <button
          type="button"
          disabled={savingNotes}
          onClick={onSaveNotes}
          className="mt-3 px-4 py-2 rounded-xl bg-[#6366f1] hover:bg-[#818cf8] text-white text-xs font-semibold disabled:opacity-50"
        >
          {savingNotes ? 'Saving…' : 'Save Notes'}
        </button>
      </Glass>
    </>
  )
}

function ActionBtn({
  children, onClick, color, icon,
}: {
  children: React.ReactNode
  onClick: () => void
  color: 'emerald' | 'red' | 'blue' | 'gray'
  icon: React.ReactNode
}) {
  const styles = {
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    red: 'bg-red-600/90 hover:bg-red-500 text-white',
    blue: 'bg-blue-600/90 hover:bg-blue-500 text-white',
    gray: 'bg-[#1c1d2a] hover:bg-[#2d2e3e] text-[#8b8ca8] hover:text-white border border-[#2d2e3e]',
  }
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${styles[color]}`}>
      {icon}{children}
    </button>
  )
}

function ConfirmModal({
  type, onClose, onConfirm, loading, rejectReason, onRejectReasonChange,
  infoMessage, onInfoMessageChange, displayName,
}: {
  type: 'approve' | 'reject' | 'info' | 'suspend'
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  rejectReason: string
  onRejectReasonChange: (v: string) => void
  infoMessage: string
  onInfoMessageChange: (v: string) => void
  displayName: string
}) {
  const titles = {
    approve: `Approve ${displayName}?`,
    reject: 'Reject Application',
    info: 'Request More Information',
    suspend: 'Suspend Application?',
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-white mb-2">{titles[type]}</h3>
        {type === 'approve' && (
          <p className="text-xs text-[#8b8ca8] mb-4">This will create a mentor profile, enable the mentor dashboard, add marketplace pricing, and notify the user.</p>
        )}
        {type === 'reject' && (
          <>
            <p className="text-xs text-[#8b8ca8] mb-3">Rejection reason is required.</p>
            <select value={rejectReason} onChange={(e) => onRejectReasonChange(e.target.value)} className="w-full mb-2 bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white">
              <option value="">Select reason…</option>
              <option>Incomplete profile</option>
              <option>Missing verification</option>
              <option>Insufficient experience</option>
              <option>Invalid documents</option>
            </select>
            <textarea value={rejectReason} onChange={(e) => onRejectReasonChange(e.target.value)} placeholder="Additional details…" rows={3} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none" />
          </>
        )}
        {type === 'info' && (
          <textarea value={infoMessage} onChange={(e) => onInfoMessageChange(e.target.value)} placeholder="Please upload your resume…" rows={4} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none mb-4" />
        )}
        {type === 'suspend' && <p className="text-xs text-[#8b8ca8] mb-4">The application will be suspended from further review.</p>}
        <div className="flex gap-3 justify-end mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] text-sm">Cancel</button>
          <button type="button" disabled={loading || (type === 'reject' && !rejectReason.trim()) || (type === 'info' && !infoMessage.trim())} onClick={onConfirm} className="px-4 py-2 rounded-lg bg-[#6366f1] text-white text-sm font-semibold disabled:opacity-50">
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
