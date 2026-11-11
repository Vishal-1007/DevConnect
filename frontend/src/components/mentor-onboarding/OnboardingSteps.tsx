import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, ChevronLeft, CloudUpload, Code2, Globe, Link2,
  Loader2, Lock, ShieldCheck, Upload,
} from 'lucide-react'
import { useUploadApplicationDocumentMutation } from '../../api/mentorApplicationApi'
import { formatInr } from '../../lib/money'
import { avatarUrl } from '../../lib/avatar'
import {
  CATEGORY_OPTIONS, EXPERIENCE_OPTIONS, LANGUAGE_OPTIONS, MIN_BIO_LENGTH,
  PLATFORM_COMMISSION, SKILL_OPTIONS,
} from './constants'
import type { MentorApplicationFormData } from './types'
import {
  ChipToggle, FieldLabel, GlassCard, GradientButton, SelectInput, TextArea, TextInput,
} from './ui'

interface StepProps {
  form: MentorApplicationFormData
  patch: (u: Partial<MentorApplicationFormData>) => void
  onNext: () => void
  onBack?: () => void
  errors: string[]
}

function StepNav({ onBack, onNext, nextLabel = 'Save & Continue', disabled }: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[#2d2e3e]/60">
      {onBack ? (
        <GradientButton variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
        </GradientButton>
      ) : <span />}
      <GradientButton onClick={onNext} disabled={disabled}>
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </GradientButton>
    </div>
  )
}

function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null
  return (
    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
      {errors.map((e) => <p key={e}>{e}</p>)}
    </div>
  )
}

function FileDrop({
  label,
  accept,
  currentUrl,
  onUploaded,
  type,
}: {
  label: string
  accept: string
  currentUrl?: string
  onUploaded: (url: string) => void
  type: 'PROFILE' | 'RESUME' | 'GOVERNMENT_ID'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [upload, { isLoading }] = useUploadApplicationDocumentMutation()
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (type === 'PROFILE') {
      setPreview(URL.createObjectURL(file))
    }
    const res = await upload({ type, file }).unwrap()
    onUploaded(res.url)
  }

  return (
    <div>
      <FieldLabel required={type !== 'GOVERNMENT_ID'}>{label}</FieldLabel>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) void handleFile(f)
        }}
        className="relative border-2 border-dashed border-[#2d2e3e] rounded-xl p-6 text-center cursor-pointer hover:border-[#6366f1]/50 hover:bg-[#6366f1]/5 transition-all"
      >
        {isLoading ? (
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#6366f1]" />
        ) : preview || currentUrl ? (
          <div className="flex flex-col items-center gap-2">
            {type === 'PROFILE' ? (
              <img src={preview ?? currentUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-[#6366f1]/40" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            )}
            <p className="text-xs text-emerald-400">Uploaded successfully</p>
          </div>
        ) : (
          <>
            <CloudUpload className="w-8 h-8 mx-auto text-[#6366f1] mb-2" />
            <p className="text-sm text-white font-medium">Drag & drop or click to upload</p>
            <p className="text-[10px] text-[#5c5d72] mt-1">{accept}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
      </div>
    </div>
  )
}

export function BasicInfoStep({ form, patch, onNext, errors }: StepProps) {
  return (
    <GlassCard className="p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white mb-1">Basic Information</h2>
      <p className="text-xs text-[#8b8ca8] mb-6">Tell us about your professional background</p>
      <ErrorList errors={errors} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div><FieldLabel required>Full Name</FieldLabel><TextInput value={form.fullName} onChange={(v) => patch({ fullName: v })} placeholder="Rahul Sharma" /></div>
        <div><FieldLabel required>Professional Headline</FieldLabel><TextInput value={form.headline} onChange={(v) => patch({ headline: v })} placeholder="Senior Backend Engineer | Java | Spring Boot" /></div>
        <div><FieldLabel required>Current Company</FieldLabel><TextInput value={form.company} onChange={(v) => patch({ company: v })} placeholder="Google / Amazon / Paytm" /></div>
        <div><FieldLabel required>Designation</FieldLabel><TextInput value={form.designation} onChange={(v) => patch({ designation: v })} placeholder="Senior Software Engineer" /></div>
        <div><FieldLabel required>Total Experience</FieldLabel><SelectInput value={form.experienceRange} onChange={(v) => patch({ experienceRange: v })} options={EXPERIENCE_OPTIONS} placeholder="Select experience" /></div>
        <div><FieldLabel required>Location</FieldLabel><TextInput value={form.location} onChange={(v) => patch({ location: v })} placeholder="Bangalore, India" /></div>
      </div>
      <div className="mt-4">
        <FileDrop label="Profile Picture" accept="JPG, PNG — Max 5MB" type="PROFILE" currentUrl={form.profilePictureUrl} onUploaded={(url) => patch({ profilePictureUrl: url })} />
      </div>
      <div className="mt-4">
        <FieldLabel required>Bio / About Yourself</FieldLabel>
        <TextArea value={form.bio} onChange={(v) => patch({ bio: v })} placeholder="Share your journey, expertise, and mentoring style…" rows={5} maxLength={2000} />
        <p className={`text-[10px] mt-1 ${form.bio.length >= MIN_BIO_LENGTH ? 'text-emerald-400' : 'text-[#5c5d72]'}`}>
          {form.bio.length} / {MIN_BIO_LENGTH} min characters
        </p>
      </div>
      <StepNav onNext={onNext} />
    </GlassCard>
  )
}

export function VerificationStep({ form, patch, onNext, onBack, errors }: StepProps) {
  return (
    <GlassCard className="p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#818cf8]" /> Professional Verification
      </h2>
      <p className="text-xs text-[#8b8ca8] mb-6">Help us verify your professional identity</p>
      <ErrorList errors={errors} />
      <div className="space-y-4">
        <div><FieldLabel required>LinkedIn URL</FieldLabel><div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5d72]" /><TextInput value={form.linkedinUrl} onChange={(v) => patch({ linkedinUrl: v })} placeholder="https://linkedin.com/in/yourprofile" /></div></div>
        <div><FieldLabel required>GitHub URL</FieldLabel><div className="relative"><Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5d72]" /><TextInput value={form.githubUrl} onChange={(v) => patch({ githubUrl: v })} placeholder="https://github.com/yourusername" /></div></div>
        <div><FieldLabel>Portfolio URL</FieldLabel><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5d72]" /><TextInput value={form.portfolioUrl} onChange={(v) => patch({ portfolioUrl: v })} placeholder="https://yourportfolio.com" /></div></div>
        <FileDrop label="Resume Upload" accept="PDF, DOC — Max 10MB" type="RESUME" currentUrl={form.resumeUrl} onUploaded={(url) => patch({ resumeUrl: url })} />
        <div><FieldLabel>Company Email Verification</FieldLabel><TextInput value={form.companyEmail} onChange={(v) => patch({ companyEmail: v })} placeholder="you@company.com" type="email" /></div>
        <FileDrop label="Government ID Upload (Optional)" accept="PDF, JPG, PNG" type="GOVERNMENT_ID" currentUrl={form.govIdUrl} onUploaded={(url) => patch({ govIdUrl: url })} />
      </div>
      <StepNav onBack={onBack} onNext={onNext} />
    </GlassCard>
  )
}

export function ExpertiseStep({ form, patch, onNext, onBack, errors }: StepProps) {
  function toggle(list: string[], item: string, key: 'skills' | 'categories' | 'languages') {
    const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
    patch({ [key]: next })
  }

  return (
    <GlassCard className="p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white mb-1">Expertise & Skills</h2>
      <p className="text-xs text-[#8b8ca8] mb-6">Select your technical skills and mentorship areas</p>
      <ErrorList errors={errors} />
      <div className="space-y-5">
        <div>
          <FieldLabel required>Technical Skills</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">{SKILL_OPTIONS.map((s) => <ChipToggle key={s} label={s} selected={form.skills.includes(s)} onClick={() => toggle(form.skills, s, 'skills')} />)}</div>
        </div>
        <div>
          <FieldLabel required>Mentorship Categories</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">{CATEGORY_OPTIONS.map((c) => <ChipToggle key={c} label={c} selected={form.categories.includes(c)} onClick={() => toggle(form.categories, c, 'categories')} />)}</div>
        </div>
        <div>
          <FieldLabel required>Languages Spoken</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">{LANGUAGE_OPTIONS.map((l) => <ChipToggle key={l} label={l} selected={form.languages.includes(l)} onClick={() => toggle(form.languages, l, 'languages')} />)}</div>
        </div>
      </div>
      <StepNav onBack={onBack} onNext={onNext} />
    </GlassCard>
  )
}

export function PricingStep({ form, patch, onNext, onBack, errors }: StepProps) {
  const videoPerMin = form.videoPricePerMinuteCents / 100
  const platformShare = videoPerMin * PLATFORM_COMMISSION
  const mentorShare = videoPerMin - platformShare

  return (
    <GlassCard className="p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white mb-1">Services & Pricing</h2>
      <p className="text-xs text-[#8b8ca8] mb-6">Set your rates for instant calls and sessions</p>
      <ErrorList errors={errors} />
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Audio Call Price (₹/min)', key: 'audioPricePerMinuteCents' as const, val: form.audioPricePerMinuteCents },
          { label: 'Video Call Price (₹/min)', key: 'videoPricePerMinuteCents' as const, val: form.videoPricePerMinuteCents },
          { label: 'Mock Interview Price (₹/session)', key: 'mockInterviewPriceCents' as const, val: form.mockInterviewPriceCents },
          { label: 'Resume Review Price (₹/session)', key: 'resumeReviewPriceCents' as const, val: form.resumeReviewPriceCents },
        ].map(({ label, key, val }) => (
          <motion.div key={key} whileHover={{ scale: 1.01 }} className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-4">
            <FieldLabel required={key.includes('PricePerMinute')}>{label}</FieldLabel>
            <input
              type="number"
              min={0}
              value={Math.round(val / 100)}
              onChange={(e) => patch({ [key]: Math.round(parseFloat(e.target.value || '0') * 100) })}
              className="w-full mt-1 bg-transparent border-b border-[#2d2e3e] py-2 text-2xl font-bold text-emerald-400 focus:outline-none focus:border-[#6366f1]"
            />
          </motion.div>
        ))}
      </div>
      <label className="flex items-center gap-3 mt-5 p-4 rounded-xl border border-[#2d2e3e] bg-[#6366f1]/5 cursor-pointer">
        <input type="checkbox" checked={form.instantCallEnabled} onChange={(e) => patch({ instantCallEnabled: e.target.checked })} className="w-4 h-4 accent-[#6366f1]" />
        <div>
          <p className="text-sm font-semibold text-white">Enable Instant Calls</p>
          <p className="text-[10px] text-[#8b8ca8]">Allow learners to call you directly from Find Match</p>
        </div>
      </label>
      <div className="mt-5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-xs font-semibold text-amber-300 mb-2">Platform Commission: 50% · Mentor Earnings: 50%</p>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-2 rounded-lg bg-[#161722]"><p className="text-[#8b8ca8]">User Pays</p><p className="text-white font-bold mt-1">{formatInr(form.videoPricePerMinuteCents)}/min</p></div>
          <div className="p-2 rounded-lg bg-[#161722]"><p className="text-[#8b8ca8]">Platform Gets</p><p className="text-amber-400 font-bold mt-1">₹{platformShare.toFixed(0)}</p></div>
          <div className="p-2 rounded-lg bg-[#161722]"><p className="text-[#8b8ca8]">You Get</p><p className="text-emerald-400 font-bold mt-1">₹{mentorShare.toFixed(0)}</p></div>
        </div>
      </div>
      <StepNav onBack={onBack} onNext={onNext} />
    </GlassCard>
  )
}

export function PayoutStep({ form, patch, onNext, onBack, errors }: StepProps) {
  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Payout Details</h2>
      </div>
      <p className="text-xs text-[#8b8ca8] mb-6">Your banking information is encrypted and secure</p>
      <ErrorList errors={errors} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div><FieldLabel required>Account Holder Name</FieldLabel><TextInput value={form.accountHolderName} onChange={(v) => patch({ accountHolderName: v })} /></div>
        <div><FieldLabel required>Bank Name</FieldLabel><TextInput value={form.bankName} onChange={(v) => patch({ bankName: v })} /></div>
        <div><FieldLabel required>Account Number</FieldLabel><TextInput value={form.accountNumber} onChange={(v) => patch({ accountNumber: v })} type="password" /></div>
        <div><FieldLabel required>IFSC Code</FieldLabel><TextInput value={form.ifscCode} onChange={(v) => patch({ ifscCode: v.toUpperCase() })} /></div>
        <div><FieldLabel>UPI ID</FieldLabel><TextInput value={form.upiId} onChange={(v) => patch({ upiId: v })} placeholder="name@upi" /></div>
        <div><FieldLabel required>PAN Number</FieldLabel><TextInput value={form.panNumber} onChange={(v) => patch({ panNumber: v.toUpperCase() })} /></div>
      </div>
      <StepNav onBack={onBack} onNext={onNext} />
    </GlassCard>
  )
}

export function AgreementsStep({ form, patch, onNext, onBack, errors }: StepProps) {
  const items = [
    { key: 'accurateDetails' as const, label: 'I confirm all details provided are accurate' },
    { key: 'mentorGuidelines' as const, label: 'I agree to DevConnect mentor guidelines' },
    { key: 'terms' as const, label: 'I agree to DevConnect terms of service' },
    { key: 'commission' as const, label: 'I understand the 50% platform commission on paid calls' },
  ]

  return (
    <GlassCard className="p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white mb-1">Agreements</h2>
      <p className="text-xs text-[#8b8ca8] mb-6">Please review and accept the following</p>
      <ErrorList errors={errors} />
      <div className="space-y-3">
        {items.map(({ key, label }) => (
          <label key={key} className="flex items-start gap-3 p-4 rounded-xl border border-[#2d2e3e] hover:border-[#6366f1]/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={form.agreements[key]}
              onChange={(e) => patch({ agreements: { ...form.agreements, [key]: e.target.checked } })}
              className="mt-0.5 w-4 h-4 accent-[#6366f1]"
            />
            <span className="text-sm text-[#c7d2fe]">{label}</span>
          </label>
        ))}
      </div>
      <StepNav onBack={onBack} onNext={onNext} />
    </GlassCard>
  )
}

export function ReviewStep({
  form, onBack, onSubmit, submitting,
}: {
  form: MentorApplicationFormData
  onBack?: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  return (
    <GlassCard className="p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white mb-1">Review & Submit</h2>
      <p className="text-xs text-[#8b8ca8] mb-6">Review your application before submitting for admin approval</p>
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 mb-5">
        <img src={form.profilePictureUrl || avatarUrl(form.fullName, 64)} alt="" className="w-16 h-16 rounded-full ring-2 ring-[#6366f1]/40 object-cover" />
        <div>
          <p className="font-bold text-white">{form.fullName}</p>
          <p className="text-xs text-[#a5b4fc]">{form.headline}</p>
          <p className="text-[10px] text-[#8b8ca8]">{form.designation} @ {form.company} · {form.location}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        <ReviewBlock title="Skills" items={form.skills} />
        <ReviewBlock title="Categories" items={form.categories} />
        <ReviewBlock title="Languages" items={form.languages} />
        <div className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
          <p className="text-[#818cf8] font-semibold mb-2">Pricing</p>
          <p className="text-[#8b8ca8]">Audio: {formatInr(form.audioPricePerMinuteCents)}/min</p>
          <p className="text-[#8b8ca8]">Video: {formatInr(form.videoPricePerMinuteCents)}/min</p>
          <p className="text-[#8b8ca8]">Mock Interview: {formatInr(form.mockInterviewPriceCents)}</p>
        </div>
        <div className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
          <p className="text-[#818cf8] font-semibold mb-2">Verification</p>
          <p className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> LinkedIn provided</p>
          <p className="text-emerald-400 flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3" /> GitHub provided</p>
          <p className={`flex items-center gap-1 mt-1 ${form.resumeUrl ? 'text-emerald-400' : 'text-red-400'}`}>
            <Upload className="w-3 h-3" /> Resume {form.resumeUrl ? 'uploaded' : 'missing'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[#2d2e3e]/60">
        {onBack && <GradientButton variant="ghost" onClick={onBack}><ChevronLeft className="w-4 h-4 inline mr-1" /> Edit</GradientButton>}
        <GradientButton onClick={onSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Submit Application
        </GradientButton>
      </div>
    </GlassCard>
  )
}

function ReviewBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
      <p className="text-[#818cf8] font-semibold mb-2">{title}</p>
      <div className="flex flex-wrap gap-1">{items.map((i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#6366f1]/15 text-[#c7d2fe]">{i}</span>)}</div>
    </div>
  )
}

export function validateStep(step: number, form: MentorApplicationFormData): string[] {
  const errors: string[] = []
  if (step === 1) {
    if (!form.fullName.trim()) errors.push('Full name is required')
    if (!form.headline.trim()) errors.push('Professional headline is required')
    if (!form.company.trim()) errors.push('Current company is required')
    if (!form.designation.trim()) errors.push('Designation is required')
    if (!form.experienceRange) errors.push('Experience range is required')
    if (!form.location.trim()) errors.push('Location is required')
    if (!form.profilePictureUrl) errors.push('Profile picture is required')
    if (form.bio.trim().length < MIN_BIO_LENGTH) errors.push(`Bio must be at least ${MIN_BIO_LENGTH} characters`)
  }
  if (step === 2) {
    if (!form.linkedinUrl.trim()) errors.push('LinkedIn URL is required')
    if (!form.githubUrl.trim()) errors.push('GitHub URL is required')
    if (!form.resumeUrl) errors.push('Resume upload is required')
  }
  if (step === 3) {
    if (!form.skills.length) errors.push('Select at least one skill')
    if (!form.categories.length) errors.push('Select at least one category')
    if (!form.languages.length) errors.push('Select at least one language')
  }
  if (step === 4) {
    if (form.audioPricePerMinuteCents <= 0) errors.push('Audio call price is required')
    if (form.videoPricePerMinuteCents <= 0) errors.push('Video call price is required')
  }
  if (step === 5) {
    if (!form.accountHolderName.trim()) errors.push('Account holder name is required')
    if (!form.bankName.trim()) errors.push('Bank name is required')
    if (!form.accountNumber.trim()) errors.push('Account number is required')
    if (!form.ifscCode.trim()) errors.push('IFSC code is required')
    if (!form.panNumber.trim()) errors.push('PAN number is required')
  }
  if (step === 6) {
    if (!form.agreements.accurateDetails) errors.push('Confirm details accuracy')
    if (!form.agreements.mentorGuidelines) errors.push('Accept mentor guidelines')
    if (!form.agreements.terms) errors.push('Accept terms of service')
    if (!form.agreements.commission) errors.push('Acknowledge platform commission')
  }
  return errors
}
