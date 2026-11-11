import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from '../api/userApi'
import { useGetMentorAccessQuery } from '../api/mentorApi'
import { useUpsertMatchIndexMutation } from '../api/matchingApi'
import { useAppSelector } from '../hooks'
import { hasMentorRole } from '../lib/roles'
import { extractApiError } from '../lib/extractApiError'
import {
  User, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, Save, Eye,
  Briefcase,
} from 'lucide-react'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import { ResumeUpload } from '../components/profile/ResumeUpload'
import { DevScoreCard } from '../components/profile/DevScoreCard'
import { SkillsSection } from '../components/profile/SkillsSection'
import { ProjectSection } from '../components/profile/ProjectSection'
import { ExperienceSection } from '../components/profile/ExperienceSection'
import { EducationSection } from '../components/profile/EducationSection'
import { CertificationsSection } from '../components/profile/CertificationsSection'
import { RecruiterPreview } from '../components/profile/RecruiterPreview'
import { PrivacySettingsSection } from '../components/profile/PrivacySettingsSection'
import { ProfileSectionHeader, profileInputCls, profileTextareaCls, DATE_INPUT_MIN, todayDateInputMax } from '../components/profile/profileUi'
import {
  calcProfileCompletion,
  loadCandidateProfile,
  saveCandidateProfile,
  type CandidateExtendedProfile,
  type EmploymentType,
  type NoticePeriod,
  type ProfessionalStatus,
} from '../data/candidateProfileData'

const ROLE_PRESETS = [
  'Java Full Stack Developer', 'Java Developer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Data Engineer', 'ML Engineer',
]

const NOTICE_PERIODS: NoticePeriod[] = ['Immediate', '15 Days', '30 Days', '60 Days']
const PROFESSIONAL_STATUSES: ProfessionalStatus[] = ['Student', 'Working Professional', 'Open to Work']
const EMPLOYMENT_TYPES: EmploymentType[] = ['Full Time', 'Internship', 'Remote', 'Hybrid']

export function ProfilePage() {
  const account = useAppSelector((s) => s.auth.account)
  const isMentorAccount = hasMentorRole(account?.roles)
  const { data: mentorAccess, isLoading: mentorAccessLoading } = useGetMentorAccessQuery(undefined, {
    skip: !isMentorAccount,
  })
  const { data: profile, isLoading, isError, error: loadError, refetch } = useGetMyProfileQuery()
  const [updateProfile, { isLoading: saving, reset }] = useUpdateMyProfileMutation()
  const [upsertIndex] = useUpsertMatchIndexMutation()

  const [ext, setExt] = useState<CandidateExtendedProfile>(() => loadCandidateProfile())
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [bio, setBio] = useState('')
  const [experienceLevel, setExp] = useState('')
  const [githubUrl, setGithub] = useState('')
  const [linkedinUrl, setLinkedin] = useState('')
  const [portfolioUrl, setPortfolio] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [indexWarning, setIndexWarning] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showRecruiterPreview, setShowRecruiterPreview] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '')
      setRole(profile.role ?? '')
      setBio(profile.bio ?? '')
      setExp(profile.experienceLevel ?? '')
      setGithub(profile.githubUrl ?? '')
      setLinkedin(profile.linkedinUrl ?? '')
      setPortfolio(profile.portfolioUrl ?? '')
      if (profile.location) {
        setExt((e) => ({ ...e, currentLocation: profile.location ?? e.currentLocation }))
      }
      if (account?.email) {
        setExt((e) => ({ ...e, email: account.email ?? e.email }))
      }
    }
  }, [profile, account?.email])

  function updateExt(updater: (prev: CandidateExtendedProfile) => CandidateExtendedProfile) {
    setExt((prev) => {
      const next = updater(prev)
      saveCandidateProfile(next)
      return next
    })
  }

  function patchExt(patch: Partial<CandidateExtendedProfile>) {
    updateExt((prev) => ({ ...prev, ...patch }))
  }

  function toggleEmploymentType(type: EmploymentType) {
    setExt((prev) => ({
      ...prev,
      employmentTypes: prev.employmentTypes.includes(type)
        ? prev.employmentTypes.filter((t) => t !== type)
        : [...prev.employmentTypes, type],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setIndexWarning(null)
    setSaved(false)
    reset()

    const skills = ext.skills.map((s) => s.name.toLowerCase()).filter(Boolean)
    const avatarToSave = ext.photoDataUrl && ext.photoDataUrl.length < 500_000
      ? ext.photoDataUrl
      : undefined

    try {
      await updateProfile({
        displayName: displayName || undefined,
        bio: bio || undefined,
        role: role || undefined,
        experienceLevel: experienceLevel || undefined,
        location: ext.currentLocation || undefined,
        githubUrl: githubUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
        avatarUrl: avatarToSave,
        skills,
      }).unwrap()

      saveCandidateProfile(ext)
      setSaved(true)

      try {
        await upsertIndex({ experienceLevel: experienceLevel || undefined, skills }).unwrap()
      } catch (indexErr) {
        setIndexWarning(
          `Profile saved, but matching index update failed: ${extractApiError(indexErr)}. ` +
          'Make sure matching-service is running on port 8085.',
        )
      }
    } catch (err) {
      setSaveError(extractApiError(err))
    }
  }

  const name = displayName || profile?.displayName || account?.username || 'Developer'
  const completion = calcProfileCompletion(
    { displayName, role, bio, location: ext.currentLocation, skills: ext.skills.map((s) => s.name), githubUrl },
    ext,
  )

  if (isMentorAccount && mentorAccessLoading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center text-sm text-[#8b8ca8]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
        Loading…
      </div>
    )
  }

  if (mentorAccess?.canAccess) {
    return <Navigate to="/mentor/profile" replace />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Learner Profile</h1>
          <p className="mt-1 text-sm text-[#8b8ca8]">
            Build your job seeker profile — visible to recruiters on DevConnect
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRecruiterPreview(true)}
          className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
        >
          <Eye size={16} />
          Preview Recruiter Profile
        </button>
      </div>

      {isError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p className="truncate text-sm text-red-300">
              Could not load profile: {extractApiError(loadError)}
            </p>
          </div>
          <button type="button" onClick={() => refetch()} className="flex shrink-0 items-center gap-1 text-xs text-red-400 hover:text-red-300">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 py-10 text-sm text-[#8b8ca8]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
          Loading profile…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <ProfileHeader
          name={name}
          title={role}
          location={ext.currentLocation}
          openToWork={ext.openToWork}
          devScore={ext.devScore.devScore}
          rank={ext.devScore.rank}
          completion={completion}
          photoUrl={ext.photoDataUrl}
          onPhotoChange={(dataUrl) => updateExt((prev) => ({ ...prev, photoDataUrl: dataUrl }))}
        />

        <DevScoreCard metrics={ext.devScore} />

        <ResumeUpload
          resume={ext.resume}
          onChange={(resume) => updateExt((prev) => ({ ...prev, resume }))}
        />

        {/* Basic Information */}
        <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
          <ProfileSectionHeader icon={User} title="Basic Information" desc="Your public identity for recruiters and the community" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Full Name <span className="text-red-400">*</span></label>
              <input className={profileInputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Vishal Gupta" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Professional Title</label>
              <input className={profileInputCls} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Java Full Stack Developer" list="role-presets" />
              <datalist id="role-presets">{ROLE_PRESETS.map((r) => <option key={r} value={r} />)}</datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Email</label>
              <input type="email" className={profileInputCls} value={ext.email} onChange={(e) => patchExt({ email: e.target.value })} placeholder="you@email.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Phone Number</label>
              <input className={profileInputCls} value={ext.phone} onChange={(e) => patchExt({ phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Date of Birth</label>
              <input
                type="date"
                min={DATE_INPUT_MIN}
                max={todayDateInputMax()}
                className={profileInputCls}
                value={ext.dateOfBirth}
                onChange={(e) => patchExt({ dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Gender <span className="text-[#5c5d72]">(optional)</span></label>
              <select className={`${profileInputCls} appearance-none cursor-pointer`} value={ext.gender} onChange={(e) => patchExt({ gender: e.target.value })}>
                <option value="" className="bg-[#161722]">Prefer not to say</option>
                <option value="Male" className="bg-[#161722]">Male</option>
                <option value="Female" className="bg-[#161722]">Female</option>
                <option value="Other" className="bg-[#161722]">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Current Location</label>
              <input className={profileInputCls} value={ext.currentLocation} onChange={(e) => patchExt({ currentLocation: e.target.value })} placeholder="Bangalore, India" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Preferred Job Location</label>
              <input className={profileInputCls} value={ext.preferredLocation} onChange={(e) => patchExt({ preferredLocation: e.target.value })} placeholder="Bangalore, Remote" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Notice Period</label>
              <select className={`${profileInputCls} appearance-none cursor-pointer`} value={ext.noticePeriod} onChange={(e) => patchExt({ noticePeriod: e.target.value as NoticePeriod })}>
                {NOTICE_PERIODS.map((p) => <option key={p} value={p} className="bg-[#161722]">{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Bio</label>
            <textarea className={profileTextareaCls} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell recruiters about your background, strengths, and career goals…" />
          </div>
        </div>

        {/* Professional Details */}
        <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
          <ProfileSectionHeader icon={Briefcase} title="Professional Details" desc="Employment status and salary expectations for recruiters" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Current Status</label>
              <select
                className={`${profileInputCls} appearance-none cursor-pointer`}
                value={ext.professionalStatus}
                onChange={(e) => {
                  const status = e.target.value as ProfessionalStatus
                  patchExt({ professionalStatus: status, openToWork: status === 'Open to Work' })
                }}
              >
                {PROFESSIONAL_STATUSES.map((s) => <option key={s} value={s} className="bg-[#161722]">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Total Experience</label>
              <input className={profileInputCls} value={ext.totalExperience} onChange={(e) => patchExt({ totalExperience: e.target.value })} placeholder="2.3 Years" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Current Company</label>
              <input className={profileInputCls} value={ext.currentCompany} onChange={(e) => patchExt({ currentCompany: e.target.value })} placeholder="ABC Technologies" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Current Role</label>
              <input className={profileInputCls} value={ext.currentRole} onChange={(e) => patchExt({ currentRole: e.target.value })} placeholder="Software Developer" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Expected Salary</label>
              <input className={profileInputCls} value={ext.expectedSalary} onChange={(e) => patchExt({ expectedSalary: e.target.value })} placeholder="₹12 LPA" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Current Salary <span className="text-[#5c5d72]">(optional)</span></label>
              <input className={profileInputCls} value={ext.currentSalary} onChange={(e) => patchExt({ currentSalary: e.target.value })} placeholder="₹8 LPA" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-[#8b8ca8]">Employment Type Looking For</label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((type) => {
                const active = ext.employmentTypes.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleEmploymentType(type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'border-[#6366f1]/50 bg-[#6366f1]/20 text-[#a5b4fc]'
                        : 'border-[#2d2e3e] bg-[#0b0c14] text-[#8b8ca8] hover:border-[#6366f1]/40'
                    }`}
                  >
                    {active ? '✓ ' : ''}{type}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <SkillsSection
          skills={ext.skills}
          onChange={(skills) => updateExt((prev) => ({ ...prev, skills }))}
        />
        <ProjectSection
          projects={ext.projects}
          onChange={(projects) => updateExt((prev) => ({ ...prev, projects }))}
        />
        <ExperienceSection
          experiences={ext.experiences}
          onChange={(experiences) => updateExt((prev) => ({ ...prev, experiences }))}
        />
        <EducationSection
          education={ext.education}
          onChange={(education) => updateExt((prev) => ({ ...prev, education }))}
        />
        <CertificationsSection
          certifications={ext.certifications}
          onChange={(certifications) => updateExt((prev) => ({ ...prev, certifications }))}
        />

        {/* Social & Links */}
        <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
          <ProfileSectionHeader icon={ExternalLink} title="Social & Links" desc="GitHub, LinkedIn, and portfolio help recruiters verify your work" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">GitHub URL</label>
              <input
                className={profileInputCls}
                value={githubUrl}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">LinkedIn URL</label>
              <input
                className={profileInputCls}
                value={linkedinUrl}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8b8ca8]">Portfolio / Website URL</label>
            <input className={profileInputCls} type="url" value={portfolioUrl} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://yourportfolio.com" />
          </div>
        </div>

        <PrivacySettingsSection privacy={ext.privacy} onChange={(privacy) => patchExt({ privacy })} />

        {(saved || saveError || indexWarning) && (
          <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            saveError
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : indexWarning
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}>
            {saveError ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            <span>{saveError ?? indexWarning ?? 'Profile saved! Recruiters can now view your updated candidate profile.'}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white dc-gradient-btn transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving
            ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</>
            : <><Save size={16} /> Save profile</>}
        </button>
      </form>

      {showRecruiterPreview && (
        <RecruiterPreview
          name={name}
          title={role}
          photoUrl={ext.photoDataUrl}
          devScore={ext.devScore}
          preview={ext.recruiterPreview}
          onClose={() => setShowRecruiterPreview(false)}
        />
      )}
    </div>
  )
}
