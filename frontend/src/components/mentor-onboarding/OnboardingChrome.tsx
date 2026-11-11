import { motion } from 'framer-motion'
import {
  BadgeCheck, Clock, FileCheck, Heart, IndianRupee, Landmark, Send, Shield, Sparkles, User,
} from 'lucide-react'
import { ONBOARDING_STEPS } from './constants'
import type { OnboardingStepId } from './types'

const ICONS = {
  user: User,
  shield: Shield,
  sparkles: Sparkles,
  'indian-rupee': IndianRupee,
  landmark: Landmark,
  'file-check': FileCheck,
  send: Send,
} as const

interface OnboardingProgressTrackerProps {
  currentStep: number
  onStepClick?: (step: number) => void
}

export function OnboardingProgressTracker({ currentStep, onStepClick }: OnboardingProgressTrackerProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0 px-1">
        {ONBOARDING_STEPS.map((step, index) => {
          const stepNum = index + 1
          const active = stepNum === currentStep
          const done = stepNum < currentStep
          const Icon = ICONS[step.icon as keyof typeof ICONS] ?? User

          return (
            <div key={step.id} className="flex items-center">
              {index > 0 && (
                <div className={`h-0.5 w-8 sm:w-12 mx-1 rounded-full transition-colors ${done || active ? 'bg-gradient-to-r from-[#6366f1] to-[#818cf8]' : 'bg-[#2d2e3e]'}`} />
              )}
              <motion.button
                type="button"
                onClick={() => onStepClick?.(stepNum)}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-1.5 min-w-[72px] group"
              >
                <div
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                    active
                      ? 'border-[#6366f1] bg-[#6366f1]/20 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                      : done
                      ? 'border-[#6366f1] bg-[#6366f1] text-white'
                      : 'border-[#2d2e3e] bg-[#161722] text-[#5c5d72] group-hover:border-[#6366f1]/40'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="step-glow"
                      className="absolute inset-0 rounded-full bg-[#6366f1]/20 animate-pulse"
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 ${active ? 'text-[#c7d2fe]' : done ? 'text-white' : ''}`} />
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight ${active ? 'text-white' : done ? 'text-[#a5b4fc]' : 'text-[#5c5d72]'}`}>
                  {step.shortLabel}
                </span>
              </motion.button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function stepIdForIndex(index: number): OnboardingStepId {
  return ONBOARDING_STEPS[index]?.id ?? 'basic'
}

export function OnboardingHero() {
  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#c7d2fe] text-xs font-semibold mb-3 shadow-[0_0_16px_rgba(99,102,241,0.25)]">
        <BadgeCheck className="w-3.5 h-3.5" />
        Trusted Mentor Program
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Become a Mentor</h1>
      <p className="text-sm sm:text-base text-[#8b8ca8] mt-2 max-w-2xl leading-relaxed">
        Share your knowledge, inspire developers, and build your professional mentorship brand on DevConnect.
      </p>
    </div>
  )
}

export function TrustSection() {
  const items = [
    { icon: Shield, title: 'Trusted Platform', subtitle: 'Verified mentor ecosystem' },
    { icon: Clock, title: '10K+ Active Learners', subtitle: 'Growing developer community' },
    { icon: Sparkles, title: '4.9 Average Rating', subtitle: 'Top-rated mentorship' },
    { icon: Heart, title: 'Secure & Safe', subtitle: 'Encrypted payouts & calls' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
      {items.map(({ icon: Icon, title, subtitle }) => (
        <motion.div
          key={title}
          whileHover={{ y: -2, boxShadow: '0 0 24px rgba(99,102,241,0.15)' }}
          className="rounded-xl border border-[#2d2e3e]/80 bg-[#12131c]/50 backdrop-blur-sm p-4 text-center hover:border-[#6366f1]/30 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-[#6366f1]/15 flex items-center justify-center mx-auto mb-2">
            <Icon className="w-4 h-4 text-[#818cf8]" />
          </div>
          <p className="text-xs font-semibold text-white">{title}</p>
          <p className="text-[10px] text-[#5c5d72] mt-0.5">{subtitle}</p>
        </motion.div>
      ))}
    </div>
  )
}
