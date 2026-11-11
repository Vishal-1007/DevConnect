import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { OnboardingHero, OnboardingProgressTracker, TrustSection } from './OnboardingChrome'
import { OnboardingSidebar } from './OnboardingSidebar'
import {
  AgreementsStep, BasicInfoStep, ExpertiseStep, PayoutStep, PricingStep,
  ReviewStep, validateStep, VerificationStep,
} from './OnboardingSteps'
import { useMentorOnboarding } from './useMentorOnboarding'
import type { MentorApplicationFormData } from './types'

interface MentorOnboardingFlowProps {
  initialDraft?: MentorApplicationFormData | null
  initialStep?: number
  onSubmitted: () => void
}

export function MentorOnboardingFlow({ initialDraft, initialStep = 1, onSubmitted }: MentorOnboardingFlowProps) {
  const {
    step, setStep, form, patch, goNext, goBack, submit, submitting, toast, draftSaved,
  } = useMentorOnboarding(initialDraft, initialStep)

  const [errors, setErrors] = useState<string[]>([])

  function handleNext() {
    const stepErrors = validateStep(step, form)
    if (stepErrors.length) {
      setErrors(stepErrors)
      return
    }
    setErrors([])
    void goNext()
  }

  function handleStepClick(target: number) {
    if (target <= step) {
      setStep(target)
      setErrors([])
    }
  }

  async function handleSubmit() {
    const ok = await submit()
    if (ok) onSubmitted()
  }

  const stepProps = { form, patch, onNext: handleNext, onBack: step > 1 ? goBack : undefined, errors }

  return (
    <div className="space-y-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-[#161722] border border-[#6366f1]/40 text-sm text-white shadow-xl"
        >
          {toast}
        </motion.div>
      )}

      {draftSaved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-emerald-400"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Draft saved
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <OnboardingHero />
          <div className="mb-6">
            <OnboardingProgressTracker currentStep={step} onStepClick={handleStepClick} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && <BasicInfoStep {...stepProps} />}
              {step === 2 && <VerificationStep {...stepProps} />}
              {step === 3 && <ExpertiseStep {...stepProps} />}
              {step === 4 && <PricingStep {...stepProps} />}
              {step === 5 && <PayoutStep {...stepProps} />}
              {step === 6 && <AgreementsStep {...stepProps} />}
              {step === 7 && (
                <ReviewStep
                  form={form}
                  onBack={goBack}
                  onSubmit={() => void handleSubmit()}
                  submitting={submitting}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <TrustSection />
        </div>

        <div className="hidden xl:block">
          <OnboardingSidebar currentStep={step} />
        </div>
      </div>

      <div className="xl:hidden">
        <OnboardingSidebar currentStep={step} />
      </div>

      {submitting && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-[#161722] border border-[#6366f1]/30">
            <Loader2 className="w-10 h-10 animate-spin text-[#6366f1]" />
            <p className="text-sm text-white font-medium">Submitting your application…</p>
          </div>
        </div>
      )}
    </div>
  )
}
