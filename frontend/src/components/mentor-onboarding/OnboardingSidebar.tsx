import { motion } from 'framer-motion'
import {
  BadgeCheck, BookOpen, Clock, ExternalLink, Heart, HelpCircle, Lock, Mail, Sparkles, Wallet,
} from 'lucide-react'
import { BENEFIT_ITEMS, ONBOARDING_STEPS } from './constants'
import { GlassCard } from './ui'

const BENEFIT_ICONS = {
  wallet: Wallet,
  badge: BadgeCheck,
  heart: Heart,
  clock: Clock,
} as const

interface OnboardingSidebarProps {
  currentStep: number
}

export function OnboardingSidebar({ currentStep }: OnboardingSidebarProps) {
  const progress = Math.round((currentStep / ONBOARDING_STEPS.length) * 100)

  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Application Progress</p>
          <span className="text-xs text-[#818cf8] font-bold">{progress}%</span>
        </div>
        <p className="text-xs text-[#8b8ca8] mb-3">Step {currentStep} of {ONBOARDING_STEPS.length}</p>
        <div className="h-2 rounded-full bg-[#1c1d2a] overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#818cf8]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <ul className="space-y-2">
          {ONBOARDING_STEPS.map((step, i) => {
            const num = i + 1
            const active = num === currentStep
            const done = num < currentStep
            return (
              <li
                key={step.id}
                className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  active ? 'bg-[#6366f1]/15 text-white' : done ? 'text-[#a5b4fc]' : 'text-[#5c5d72]'
                }`}
              >
                <span
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    active
                      ? 'bg-[#6366f1] text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                      : done
                      ? 'bg-[#6366f1]/30 text-[#c7d2fe]'
                      : 'bg-[#2d2e3e] text-[#5c5d72]'
                  }`}
                >
                  {done ? '✓' : num}
                </span>
                <div>
                  <p className="font-semibold">{step.label}</p>
                  <p className={`text-[10px] mt-0.5 ${active ? 'text-[#c7d2fe]' : 'text-[#5c5d72]'}`}>
                    {step.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#818cf8]" />
          Why Become a Mentor?
        </h3>
        <div className="space-y-2">
          {BENEFIT_ITEMS.map((item) => {
            const Icon = BENEFIT_ICONS[item.icon as keyof typeof BENEFIT_ICONS] ?? Wallet
            return (
              <motion.div
                key={item.title}
                whileHover={{ x: 4 }}
                className={`rounded-xl border border-[#2d2e3e]/60 bg-gradient-to-br ${item.color} p-3`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 text-[#818cf8] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    <p className="text-[10px] text-[#8b8ca8] mt-0.5">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#818cf8]" />
          Need Help?
        </h3>
        <div className="space-y-2">
          <a
            href="https://docs.devconnect.local/mentor-guide"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border border-[#2d2e3e] text-xs text-[#a5b4fc] hover:border-[#6366f1]/40 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> View Mentor Guide</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="mailto:support@devconnect.app"
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border border-[#2d2e3e] text-xs text-[#a5b4fc] hover:border-[#6366f1]/40 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Contact Support</span>
            <Lock className="w-3.5 h-3.5 opacity-50" />
          </a>
        </div>
      </GlassCard>
    </div>
  )
}
