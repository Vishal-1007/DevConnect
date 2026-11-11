import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award, BadgeCheck, Clock, Eye, Loader2, MoreHorizontal,
  Pencil, RefreshCw, Search, Star, UserCheck, Users, IndianRupee, TrendingUp,
} from 'lucide-react'
import {
  useListAdminMentorsQuery,
  useGetAdminMentorQuery,
  useSuspendAdminMentorMutation,
  type AdminMentorListItem,
} from '../../../api/adminMentorsApi'
import { useBlockMentorMutation, useUnblockMentorMutation } from '../../../api/mentorApi'
import { formatInr } from '../../../lib/money'
import { avatarUrl } from '../../../lib/avatar'

function MentorAvatar({ name, imageUrl, size = 40 }: { name: string; imageUrl?: string | null; size?: number }) {
  const src = imageUrl || avatarUrl(name, size * 2)
  return (
    <img
      src={src}
      alt=""
      className="rounded-xl object-cover ring-2 ring-[#6366f1]/25 shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    ACTIVE: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400' },
    BLOCKED: { label: 'Blocked', color: 'text-red-400 bg-red-500/15 border-red-500/30', dot: 'bg-red-400' },
    SUSPENDED: { label: 'Suspended', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', dot: 'bg-amber-400' },
  }
  const s = map[status] ?? map.ACTIVE
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function PricingCell({ mentor }: { mentor: AdminMentorListItem }) {
  if (mentor.audioPricePerMinuteCents || mentor.videoPricePerMinuteCents) {
    return (
      <div className="text-[10px] space-y-0.5">
        {mentor.audioPricePerMinuteCents != null && (
          <p className="text-[#8b8ca8]">Audio: <span className="text-white font-semibold">{formatInr(mentor.audioPricePerMinuteCents)}/min</span></p>
        )}
        {mentor.videoPricePerMinuteCents != null && (
          <p className="text-[#8b8ca8]">Video: <span className="text-emerald-400 font-semibold">{formatInr(mentor.videoPricePerMinuteCents)}/min</span></p>
        )}
      </div>
    )
  }
  if (mentor.hourlyRateCents) {
    return <span className="text-xs text-[#818cf8] font-semibold">{formatInr(mentor.hourlyRateCents)}/hr</span>
  }
  return <span className="text-xs text-[#5c5d72]">—</span>
}

function MentorProfilePanel({
  mentorId,
  onClose,
}: {
  mentorId: string
  onClose: () => void
}) {
  const { data: mentor, isLoading } = useGetAdminMentorQuery(mentorId)
  const [block] = useBlockMentorMutation()
  const [unblock] = useUnblockMentorMutation()
  const [suspend] = useSuspendAdminMentorMutation()

  if (isLoading || !mentor) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0b0c14]/95 border-l border-[#2d2e3e] z-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#818cf8]" />
      </div>
    )
  }

  const roleLine = [mentor.designation, mentor.company].filter(Boolean).join(' @ ')

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0b0c14]/98 border-l border-[#2d2e3e] z-50 overflow-y-auto backdrop-blur-xl"
    >
      <div className="p-5 border-b border-[#2d2e3e]">
        <button type="button" onClick={onClose} className="text-xs text-[#818cf8] hover:text-white mb-4">← Back to list</button>
        <div className="flex items-start gap-4">
          <MentorAvatar name={mentor.fullName} imageUrl={mentor.profileImageUrl} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{mentor.fullName}</h2>
              {mentor.verified ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold"><Clock className="w-3.5 h-3.5" /> Pending Verification</span>
              )}
            </div>
            <p className="text-sm text-[#a5b4fc] mt-0.5">{mentor.headline}</p>
            {roleLine && <p className="text-xs text-[#8b8ca8] mt-1">{roleLine}</p>}
            {mentor.experience && <p className="text-xs text-[#5c5d72] mt-0.5">{mentor.experience}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Rating', value: mentor.averageRating.toFixed(1), icon: Star },
            { label: 'Sessions', value: String(mentor.sessionsCompleted), icon: Users },
            { label: 'Response', value: `${mentor.responseRate.toFixed(0)}%`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-[#161722]/80 border border-[#2d2e3e] p-3 text-center">
              <Icon className="w-3.5 h-3.5 text-[#818cf8] mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{value}</p>
              <p className="text-[9px] text-[#5c5d72] uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-4">
          <h3 className="text-xs font-bold text-white mb-2">About</h3>
          <p className="text-xs text-[#8b8ca8] leading-relaxed whitespace-pre-wrap">{mentor.bio ?? '—'}</p>
          {mentor.location && <p className="text-xs text-[#5c5d72] mt-2">📍 {mentor.location}</p>}
        </section>

        {mentor.skills.length > 0 && (
          <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-4">
            <h3 className="text-xs font-bold text-white mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {mentor.skills.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-[#6366f1]/15 text-[#c7d2fe] border border-[#6366f1]/25">{s}</span>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-4">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Pricing</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Audio Call', mentor.audioPricePerMinuteCents, '/min'],
              ['Video Call', mentor.videoPricePerMinuteCents, '/min'],
              ['Mock Interview', mentor.mockInterviewPriceCents, ''],
              ['Resume Review', mentor.resumeReviewPriceCents, ''],
            ].map(([label, cents, suffix]) => (
              <div key={label as string} className="p-2 rounded-lg bg-[#0b0c14]/60 border border-[#2d2e3e]">
                <p className="text-[#5c5d72] text-[10px]">{label as string}</p>
                <p className="text-emerald-400 font-semibold mt-0.5">{cents ? `${formatInr(cents as number)}${suffix}` : '—'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-4">
          <h3 className="text-xs font-bold text-white mb-2">Documents</h3>
          <div className="space-y-1.5 text-xs">
            {[
              ['LinkedIn', mentor.linkedinUrl],
              ['GitHub', mentor.githubUrl],
              ['Portfolio', mentor.portfolioUrl],
              ['Resume', mentor.resumeUrl],
            ].map(([label, url]) => (
              <div key={label as string} className="flex justify-between gap-2">
                <span className="text-[#8b8ca8]">{label as string}</span>
                {url ? (
                  <a href={url as string} target="_blank" rel="noreferrer" className="text-[#818cf8] hover:text-white truncate max-w-[180px]">Open</a>
                ) : (
                  <span className="text-[#5c5d72]">Not provided</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-4">
          <h3 className="text-xs font-bold text-white mb-3">Statistics</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Sessions Completed', mentor.sessionsCompleted],
              ['Reviews', mentor.ratingCount],
              ['Students Mentored', mentor.studentsMentored],
              ['Revenue Generated', formatInr(mentor.revenueGeneratedCents)],
            ].map(([label, val]) => (
              <div key={label as string} className="p-2 rounded-lg bg-[#0b0c14]/60">
                <p className="text-[#5c5d72] text-[10px]">{label as string}</p>
                <p className="text-white font-semibold mt-0.5">{val as string | number}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-2 pt-2">
          {mentor.status === 'ACTIVE' && (
            <>
              <button type="button" onClick={() => void suspend(mentor.userId)} className="w-full py-2.5 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-600/30">Suspend Mentor</button>
              <button type="button" onClick={() => void block(mentor.userId)} className="w-full py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-600/30">Block Mentor</button>
            </>
          )}
          {mentor.status === 'BLOCKED' && (
            <button type="button" onClick={() => void unblock(mentor.userId)} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Unblock Mentor</button>
          )}
          {mentor.status === 'SUSPENDED' && (
            <button type="button" onClick={() => void unblock(mentor.userId)} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Reactivate Mentor</button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function AdminMentorsView() {
  const { data: mentors, isLoading, refetch } = useListAdminMentorsQuery()
  const [block] = useBlockMentorMutation()
  const [unblock] = useUnblockMentorMutation()
  const [suspend] = useSuspendAdminMentorMutation()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; name: string; action: 'block' | 'suspend' | 'unblock' } | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (mentors ?? []).filter((m) =>
      [m.fullName, m.headline, m.company, m.designation, m.experience].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [mentors, search])

  const stats = useMemo(() => {
    const list = mentors ?? []
    const active = list.filter((m) => m.status === 'ACTIVE').length
    const avgRating = list.length ? list.reduce((s, m) => s + m.averageRating, 0) / list.length : 0
    const sessions = list.reduce((s, m) => s + m.sessionsCompleted, 0)
    return { total: list.length, active, avgRating, sessions }
  }, [mentors])

  async function handleConfirm() {
    if (!confirm) return
    if (confirm.action === 'block') await block(confirm.id).unwrap()
    if (confirm.action === 'unblock') await unblock(confirm.id).unwrap()
    if (confirm.action === 'suspend') await suspend(confirm.id).unwrap()
    setConfirm(null)
    void refetch()
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Mentors</h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">{stats.active} active · {stats.total - stats.active} inactive</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void refetch()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white">
            <RefreshCw size={13} />
          </button>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mentors by name, skill, company…"
              className="bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8] w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Mentors', value: stats.total, icon: Users, color: 'text-[#818cf8]' },
          { label: 'Active Mentors', value: stats.active, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Avg. Rating', value: stats.avgRating.toFixed(1), icon: Star, color: 'text-amber-400' },
          { label: 'Sessions Completed', value: stats.sessions.toLocaleString(), icon: Award, color: 'text-[#c7d2fe]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/70 backdrop-blur p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[10px] text-[#5c5d72] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#818cf8]" /></div>
      ) : (
        <div className="bg-[#161722]/80 border border-[#2d2e3e] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[960px]">
              <thead>
                <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                  {['Mentor', 'Company', 'Experience', 'Rating', 'Sessions', 'Pricing', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1d2a]">
                {filtered.map((m) => (
                  <tr key={m.userId} className="hover:bg-[#1c1d2a]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <MentorAvatar name={m.fullName} imageUrl={m.profileImageUrl} size={40} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-white truncate">{m.fullName}</p>
                            {m.verified ? (
                              <span className="text-[9px] text-emerald-400 font-bold">✔ Verified</span>
                            ) : (
                              <span className="text-[9px] text-amber-400 font-bold">⏳ Pending</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#a5b4fc] truncate mt-0.5">{m.headline ?? '—'}</p>
                          {(m.designation || m.company) && (
                            <p className="text-[10px] text-[#5c5d72] truncate mt-0.5">
                              {[m.designation, m.company].filter(Boolean).join(' @ ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white font-medium">{m.company ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#8b8ca8]">{m.experience ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-white">{m.averageRating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white font-medium">{m.sessionsCompleted}</td>
                    <td className="px-4 py-3"><PricingCell mentor={m} /></td>
                    <td className="px-4 py-3"><StatusPill status={m.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 relative">
                        <button type="button" onClick={() => setSelectedId(m.userId)} title="View Profile" className="p-1.5 rounded-lg hover:bg-[#6366f1]/20 text-[#818cf8]">
                          <Eye size={14} />
                        </button>
                        <button type="button" title="Edit" className="p-1.5 rounded-lg hover:bg-[#2d2e3e] text-[#8b8ca8]">
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => setMenuId(menuId === m.userId ? null : m.userId)} className="p-1.5 rounded-lg hover:bg-[#2d2e3e] text-[#8b8ca8]">
                          <MoreHorizontal size={14} />
                        </button>
                        {menuId === m.userId && (
                          <div className="absolute right-0 top-8 z-10 w-36 rounded-xl border border-[#2d2e3e] bg-[#161722] shadow-xl py-1">
                            {m.status === 'ACTIVE' && (
                              <>
                                <button type="button" onClick={() => { setConfirm({ id: m.userId, name: m.fullName, action: 'suspend' }); setMenuId(null) }} className="w-full text-left px-3 py-2 text-[11px] text-amber-300 hover:bg-[#1c1d2a]">Suspend</button>
                                <button type="button" onClick={() => { setConfirm({ id: m.userId, name: m.fullName, action: 'block' }); setMenuId(null) }} className="w-full text-left px-3 py-2 text-[11px] text-red-400 hover:bg-[#1c1d2a]">Block</button>
                              </>
                            )}
                            {m.status !== 'ACTIVE' && (
                              <button type="button" onClick={() => { setConfirm({ id: m.userId, name: m.fullName, action: 'unblock' }); setMenuId(null) }} className="w-full text-left px-3 py-2 text-[11px] text-emerald-400 hover:bg-[#1c1d2a]">Reactivate</button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#2d2e3e] bg-[#12131c] text-[10px] text-[#5c5d72]">
            Showing <span className="text-white font-medium">{filtered.length}</span> of <span className="text-white font-medium">{mentors?.length ?? 0}</span> mentors
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2 capitalize">{confirm.action} {confirm.name}?</h3>
            <p className="text-xs text-[#8b8ca8] mb-5">This action will update the mentor&apos;s availability on the platform.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] text-sm">Cancel</button>
              <button type="button" onClick={() => void handleConfirm()} className="px-4 py-2 rounded-lg bg-[#6366f1] text-white text-sm font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedId && <MentorProfilePanel mentorId={selectedId} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>
    </div>
  )
}
