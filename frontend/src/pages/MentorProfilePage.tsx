import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Briefcase, Sparkles, DollarSign, Link2, BarChart3,
  Save, RefreshCw, AlertCircle, CheckCircle2, Star, Users, Video,
  CalendarDays, ExternalLink,
} from 'lucide-react'
import { useAppSelector } from '../hooks'
import { extractApiError } from '../lib/extractApiError'
import {
  useGetMyMentorProfileSettingsQuery,
  useUpdateMyMentorProfileSettingsMutation,
} from '../api/mentorApi'
import { ProfileSectionHeader, profileInputCls, profileTextareaCls, profileCardCls } from '../components/profile/profileUi'

const MENTORSHIP_CATEGORIES = [
  'Mock Interview',
  'DSA',
  'System Design',
  'Code Review',
  'Career Guidance',
] as const

const SESSION_DURATIONS = [30, 45, 60, 90, 120]

function TagEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const tag = draft.trim()
    if (!tag || values.includes(tag)) return
    onChange([...values, tag])
    setDraft('')
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 border border-violet-500/25 px-2.5 py-1 text-[11px] text-violet-200">
            {tag}
            <button type="button" onClick={() => onChange(values.filter((t) => t !== tag))} className="text-violet-300 hover:text-white">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className={profileInputCls}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          placeholder={placeholder}
        />
        <button type="button" onClick={addTag} className="shrink-0 rounded-lg border border-[#2d2e3e] px-3 text-xs text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a]">Add</button>
      </div>
    </div>
  )
}

function centsToDollars(cents: number | null | undefined) {
  if (cents == null) return ''
  return (cents / 100).toFixed(2)
}

function dollarsToCents(value: string): number | undefined {
  const n = parseFloat(value)
  if (Number.isNaN(n) || n < 0) return undefined
  return Math.round(n * 100)
}

export function MentorProfilePage() {
  const account = useAppSelector((s) => s.auth.account)
  const { data, isLoading, isError, error, refetch } = useGetMyMentorProfileSettingsQuery()
  const [updateProfile, { isLoading: saving, reset }] = useUpdateMyMentorProfileSettingsMutation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [professionalTitle, setProfessionalTitle] = useState('')
  const [currentCompany, setCurrentCompany] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [totalExperience, setTotalExperience] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [technologies, setTechnologies] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [sessionDuration, setSessionDuration] = useState(60)
  const [hourlyRate, setHourlyRate] = useState('')
  const [mockPrice, setMockPrice] = useState('')
  const [reviewPrice, setReviewPrice] = useState('')
  const [freeSessionAllowed, setFreeSessionAllowed] = useState(false)
  const [available, setAvailable] = useState(true)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!data) return
    setFullName(data.fullName ?? '')
    setEmail(data.email ?? account?.email ?? '')
    setPhone(data.phone ?? '')
    setProfileImageUrl(data.profileImageUrl ?? '')
    setProfessionalTitle(data.professionalTitle ?? '')
    setCurrentCompany(data.currentCompany ?? '')
    setCurrentRole(data.currentRole ?? '')
    setTotalExperience(data.totalExperience ?? '')
    setBio(data.bio ?? '')
    setSkills(data.skills ?? [])
    setTechnologies(data.technologies ?? [])
    setCategories(data.mentorshipCategories ?? [])
    setSessionDuration(data.sessionDurationMinutes ?? 60)
    setHourlyRate(centsToDollars(data.hourlyRateCents))
    setMockPrice(centsToDollars(data.mockInterviewPriceCents))
    setReviewPrice(centsToDollars(data.resumeReviewPriceCents))
    setFreeSessionAllowed(data.freeSessionAllowed)
    setAvailable(data.available)
    setLinkedinUrl(data.linkedinUrl ?? '')
    setGithubUrl(data.githubUrl ?? '')
    setPortfolioUrl(data.portfolioUrl ?? '')
  }, [data, account?.email])

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaved(false)
    reset()
    try {
      await updateProfile({
        fullName: fullName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        profileImageUrl: profileImageUrl || undefined,
        professionalTitle: professionalTitle || undefined,
        currentCompany: currentCompany || undefined,
        currentRole: currentRole || undefined,
        totalExperience: totalExperience || undefined,
        bio: bio || undefined,
        skills,
        technologies,
        mentorshipCategories: categories,
        sessionDurationMinutes: sessionDuration,
        hourlyRateCents: dollarsToCents(hourlyRate),
        mockInterviewPriceCents: dollarsToCents(mockPrice),
        resumeReviewPriceCents: dollarsToCents(reviewPrice),
        freeSessionAllowed,
        available,
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      }).unwrap()
      setSaved(true)
    } catch (err) {
      setSaveError(extractApiError(err))
    }
  }

  const displayName = fullName || account?.username || 'Mentor'

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mentor Profile</h1>
          <p className="mt-1 text-sm text-[#8b8ca8]">
            Manage your mentoring identity, expertise, and session settings
          </p>
        </div>
        <Link
          to="/mentor/dashboard"
          className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
        >
          <ExternalLink size={16} />
          Mentor Dashboard
        </Link>
      </div>

      {isError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p className="truncate text-sm text-red-300">{extractApiError(error)}</p>
          </div>
          <button type="button" onClick={() => refetch()} className="flex shrink-0 items-center gap-1 text-xs text-red-400 hover:text-red-300">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 py-10 text-sm text-[#8b8ca8]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          Loading mentor profile…
        </div>
      )}

      {data && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stats — read only */}
          <div className={profileCardCls}>
            <ProfileSectionHeader icon={BarChart3} title="Mentor Stats" desc="Automatically calculated from your sessions and reviews" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Star, label: 'Rating', value: `${data.averageRating.toFixed(1)} (${data.ratingCount} reviews)` },
                { icon: Video, label: 'Sessions', value: String(data.sessionsCompleted) },
                { icon: Users, label: 'Students', value: String(data.studentsMentored) },
                { icon: Sparkles, label: 'Status', value: data.available ? 'Available' : 'Unavailable' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-[#0b0c14] border border-[#2d2e3e] p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-[#8b8ca8]">
                    <s.icon size={12} />
                    <span className="text-[10px] font-medium">{s.label}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Basic */}
          <div className={profileCardCls}>
            <ProfileSectionHeader icon={User} title="Basic Information" desc="Your public mentor identity" />
            <div className="flex flex-wrap items-start gap-4">
              <div className="shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-xl border border-[#2d2e3e] bg-[#0b0c14]">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-violet-400">
                      {displayName[0]?.toUpperCase() ?? 'M'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[240px] grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Full Name</label>
                  <input className={profileInputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Professional Title</label>
                  <input className={profileInputCls} value={professionalTitle} onChange={(e) => setProfessionalTitle(e.target.value)} placeholder="Senior Backend Engineer" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Email</label>
                  <input type="email" className={profileInputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Phone</label>
                  <input className={profileInputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Profile Image URL</label>
                  <input className={profileInputCls} value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} placeholder="https://…" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Current Company</label>
                <input className={profileInputCls} value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Current Role</label>
                <input className={profileInputCls} value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Total Experience</label>
                <input className={profileInputCls} value={totalExperience} onChange={(e) => setTotalExperience(e.target.value)} placeholder="8+ years" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Bio</label>
              <textarea className={profileTextareaCls} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe your mentoring style and industry experience…" rows={4} />
            </div>
          </div>

          {/* Expertise */}
          <div className={profileCardCls}>
            <ProfileSectionHeader icon={Sparkles} title="Expertise" desc="Skills and technologies you mentor on" />
            <TagEditor label="Skills" values={skills} onChange={setSkills} placeholder="e.g. Java, Spring Boot" />
            <TagEditor label="Technologies" values={technologies} onChange={setTechnologies} placeholder="e.g. Kafka, PostgreSQL" />
            <div>
              <label className="mb-2 block text-xs font-medium text-[#8b8ca8]">Mentorship Categories</label>
              <div className="flex flex-wrap gap-2">
                {MENTORSHIP_CATEGORIES.map((cat) => {
                  const active = categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                          : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-[#3d3e52] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mentorship settings */}
          <div className={profileCardCls}>
            <ProfileSectionHeader icon={Briefcase} title="Mentorship Settings" desc="Session pricing and availability preferences" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Default Session Duration</label>
                <select className={`${profileInputCls} appearance-none cursor-pointer`} value={sessionDuration} onChange={(e) => setSessionDuration(Number(e.target.value))}>
                  {SESSION_DURATIONS.map((m) => (
                    <option key={m} value={m} className="bg-[#161722]">{m} minutes</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Hourly Rate (USD)</label>
                <input className={profileInputCls} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="75.00" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Mock Interview Price (USD)</label>
                <input className={profileInputCls} value={mockPrice} onChange={(e) => setMockPrice(e.target.value)} placeholder="50.00" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Code Review Price (USD)</label>
                <input className={profileInputCls} value={reviewPrice} onChange={(e) => setReviewPrice(e.target.value)} placeholder="40.00" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-[#b4b5c8] cursor-pointer">
                <input type="checkbox" checked={freeSessionAllowed} onChange={(e) => setFreeSessionAllowed(e.target.checked)} className="rounded border-[#2d2e3e]" />
                Allow free intro sessions
              </label>
              <label className="flex items-center gap-2 text-sm text-[#b4b5c8] cursor-pointer">
                <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="rounded border-[#2d2e3e]" />
                Available for new bookings
              </label>
            </div>
            <Link to="/mentor/dashboard" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
              <CalendarDays size={13} />
              Manage weekly availability in Mentor Dashboard → Availability
            </Link>
          </div>

          {/* Social */}
          <div className={profileCardCls}>
            <ProfileSectionHeader icon={Link2} title="Social Links" desc="Help learners learn more about you" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">LinkedIn</label>
                <input className={profileInputCls} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">GitHub</label>
                <input className={profileInputCls} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/…" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Portfolio</label>
                <input className={profileInputCls} value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://…" />
              </div>
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} /> {saveError}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={16} /> Mentor profile saved successfully.
            </div>
          )}

          <div className="flex justify-end gap-3 pb-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Save Mentor Profile
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default MentorProfilePage
