import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useGetApplicationDraftQuery,
  useSaveApplicationDraftMutation,
  useSubmitMentorApplicationMutation,
} from '../../api/mentorApplicationApi'
import { EMPTY_MENTOR_APPLICATION, type MentorApplicationFormData } from './types'

function mergeDraft(partial: Partial<MentorApplicationFormData> | null | undefined): MentorApplicationFormData {
  if (!partial) return { ...EMPTY_MENTOR_APPLICATION }
  return {
    ...EMPTY_MENTOR_APPLICATION,
    ...partial,
    agreements: { ...EMPTY_MENTOR_APPLICATION.agreements, ...partial.agreements },
    skills: partial.skills ?? [],
    categories: partial.categories ?? [],
    languages: partial.languages ?? [],
  }
}

export function useMentorOnboarding(initialDraft?: MentorApplicationFormData | null, initialStep = 1) {
  const { data: serverDraft } = useGetApplicationDraftQuery(undefined, { refetchOnMountOrArgChange: true })
  const [saveDraft] = useSaveApplicationDraftMutation()
  const [submitApplication, { isLoading: submitting }] = useSubmitMentorApplicationMutation()

  const [step, setStep] = useState(initialStep)
  const [form, setForm] = useState<MentorApplicationFormData>(() => mergeDraft(initialDraft))
  const [toast, setToast] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    if (serverDraft?.data) {
      setForm(mergeDraft(serverDraft.data))
      setStep(serverDraft.currentStep ?? 1)
      hydrated.current = true
    } else if (initialDraft) {
      setForm(mergeDraft(initialDraft))
      setStep(initialStep)
      hydrated.current = true
    }
  }, [serverDraft, initialDraft, initialStep])

  const patch = useCallback((updates: Partial<MentorApplicationFormData>) => {
    setForm((prev) => ({
      ...prev,
      ...updates,
      agreements: updates.agreements ? { ...prev.agreements, ...updates.agreements } : prev.agreements,
    }))
  }, [])

  const persistDraft = useCallback(async (nextStep = step) => {
    try {
      await saveDraft({ currentStep: nextStep, data: form }).unwrap()
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    } catch {
      setToast('Could not save draft. Changes kept locally.')
    }
  }, [form, saveDraft, step])

  useEffect(() => {
    const timer = setTimeout(() => {
      void persistDraft(step)
    }, 2500)
    return () => clearTimeout(timer)
  }, [form, step, persistDraft])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function goNext() {
    await persistDraft(Math.min(step + 1, 7))
    setStep((s) => Math.min(s + 1, 7))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function submit() {
    try {
      await submitApplication({ data: form }).unwrap()
      showToast('Application submitted successfully!')
      return true
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message ?? 'Submission failed'
      showToast(msg)
      return false
    }
  }

  return {
    step,
    setStep,
    form,
    patch,
    goNext,
    goBack,
    submit,
    submitting,
    toast,
    draftSaved,
    persistDraft,
  }
}
