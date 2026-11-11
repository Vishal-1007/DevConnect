/**
 * MentorMentorshipPlansPanel — monetization packages with pricing and subscriptions.
 */
import { useState } from 'react'
import {
  Plus, Check, Trash2, Loader2, Package, Crown, Edit3, X, DollarSign, AlertTriangle, RefreshCw,
} from 'lucide-react'
import {
  useGetMentorPlansQuery,
  useCreateMentorPlanMutation,
  useUpdateMentorPlanMutation,
  useDeleteMentorPlanMutation,
  type MentorMentorshipPlan,
  type CreateMentorPlanRequest,
} from '../../api/mentorWorkspaceApi'

const PLAN_TYPES = [
  { id: 'one_on_one', label: '1:1 Mentorship' },
  { id: 'weekly', label: 'Weekly Mentorship' },
  { id: 'monthly', label: 'Monthly Coaching' },
  { id: 'mock_interview', label: 'Mock Interview Pack' },
  { id: 'job_switch', label: 'Job-Switch Roadmap' },
]

const BILLING_TYPES = [
  { id: 'one_time', label: 'One-time payment' },
  { id: 'weekly_subscription', label: 'Weekly subscription' },
  { id: 'monthly_subscription', label: 'Monthly subscription' },
]

const EMPTY_FORM: CreateMentorPlanRequest = {
  title: '',
  description: '',
  planType: 'one_on_one',
  billingType: 'one_time',
  priceCents: 5000,
  sessionLimit: 1,
  durationMinutes: 60,
  durationLabel: '60 min',
  premiumSupport: false,
  popular: false,
  active: true,
  features: ['Direct mentorship', 'Session notes'],
}

function PlanFormModal({
  initial,
  onClose,
  onSave,
  saving,
  error,
}: {
  initial: CreateMentorPlanRequest
  onClose: () => void
  onSave: (data: CreateMentorPlanRequest) => void
  saving: boolean
  error?: string
}) {
  const [form, setForm] = useState(initial)
  const [featureInput, setFeatureInput] = useState('')

  const addFeature = () => {
    if (!featureInput.trim()) return
    setForm((f) => ({ ...f, features: [...f.features, featureInput.trim()] }))
    setFeatureInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{initial.title ? 'Edit Plan' : 'Create Plan'}</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] text-[#5c5d72]">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#5c5d72]">Plan type</label>
              <select value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })}
                className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-2 py-2 text-xs text-white">
                {PLAN_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5c5d72]">Billing</label>
              <select value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value })}
                className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-2 py-2 text-xs text-white">
                {BILLING_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[#5c5d72]">Price ($)</label>
              <input type="number" min={0} step={1} value={form.priceCents / 100}
                onChange={(e) => setForm({ ...form, priceCents: Math.round(Number(e.target.value) * 100) })}
                className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] text-[#5c5d72]">Sessions</label>
              <input type="number" min={0} value={form.sessionLimit}
                onChange={(e) => setForm({ ...form, sessionLimit: Number(e.target.value) })}
                className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] text-[#5c5d72]">Duration (min)</label>
              <input type="number" min={15} value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs text-[#8b8ca8] cursor-pointer">
              <input type="checkbox" checked={form.premiumSupport} onChange={(e) => setForm({ ...form, premiumSupport: e.target.checked })} />
              Premium support
            </label>
            <label className="flex items-center gap-2 text-xs text-[#8b8ca8] cursor-pointer">
              <input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} />
              Mark as most popular
            </label>
            <label className="flex items-center gap-2 text-xs text-[#8b8ca8] cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Active / visible
            </label>
          </div>
          <div>
            <label className="text-[10px] text-[#5c5d72]">Features</label>
            <div className="flex gap-2 mt-1">
              <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                placeholder="Add feature..."
                className="flex-1 bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white" />
              <button type="button" onClick={addFeature} className="px-3 py-2 rounded-lg bg-violet-600 text-white text-xs">Add</button>
            </div>
            <ul className="mt-2 space-y-1">
              {form.features.map((f, i) => (
                <li key={f} className="flex items-center justify-between text-xs text-[#a5a6bb] bg-[#12131a] rounded px-2 py-1">
                  {f}
                  <button type="button" onClick={() => setForm((p) => ({ ...p, features: p.features.filter((_, j) => j !== i) }))} className="text-red-400"><X size={12} /></button>
                </li>
              ))}
            </ul>
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <button type="button" onClick={() => onSave(form)} disabled={saving || !form.title.trim()}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save Plan
          </button>
        </div>
      </div>
    </div>
  )
}

function planToForm(plan: MentorMentorshipPlan): CreateMentorPlanRequest {
  return {
    title: plan.title,
    description: plan.description,
    planType: plan.planType,
    billingType: plan.billingType,
    priceCents: plan.priceCents,
    sessionLimit: plan.sessionLimit,
    durationMinutes: plan.durationMinutes,
    durationLabel: plan.durationLabel,
    premiumSupport: plan.premiumSupport,
    popular: plan.popular,
    active: plan.active,
    features: plan.features,
  }
}

export function MentorMentorshipPlansPanel() {
  const { data: plans = [], isLoading, isError, refetch } = useGetMentorPlansQuery()
  const [createPlan, { isLoading: creating }] = useCreateMentorPlanMutation()
  const [updatePlan, { isLoading: updating }] = useUpdateMentorPlanMutation()
  const [deletePlan] = useDeleteMentorPlanMutation()
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; plan?: MentorMentorshipPlan } | null>(null)
  const [saveError, setSaveError] = useState('')

  const totalRevenuePotential = plans.reduce((s, p) => s + p.priceCents, 0)

  const handleSave = async (data: CreateMentorPlanRequest) => {
    setSaveError('')
    try {
      if (modal?.mode === 'edit' && modal.plan) {
        await updatePlan({ planId: modal.plan.id, body: data }).unwrap()
      } else {
        await createPlan(data).unwrap()
      }
      setModal(null)
    } catch {
      setSaveError('Could not save plan. Check your connection and try again.')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
  }

  if (isError) {
    return (
      <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
        <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3" />
        <p className="text-sm font-semibold text-white">Could not load mentorship plans</p>
        <p className="text-xs text-[#5c5d72] mt-1 mb-4">Please retry. If this persists, restart mentor-service.</p>
        <button type="button" onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Plans', value: plans.filter((p) => p.active).length, icon: Package, color: 'text-violet-400' },
          { label: 'Premium Plans', value: plans.filter((p) => p.premiumSupport).length, icon: Crown, color: 'text-amber-400' },
          { label: 'Package Value', value: `$${(totalRevenuePotential / 100).toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><Icon size={14} className={color} /><p className="text-[10px] text-[#5c5d72]">{label}</p></div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative bg-[#161722] border rounded-2xl p-5 ${plan.popular ? 'border-violet-500/50' : 'border-[#2d2e3e]'} ${!plan.active ? 'opacity-60' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] font-bold px-3 py-0.5 rounded-full">MOST POPULAR</div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-white">{plan.title}</p>
                <p className="text-[10px] text-[#5c5d72]">{plan.planTypeLabel} · {plan.sessionLimitLabel} · {plan.durationLabel}</p>
                <p className="text-[9px] text-violet-400 mt-0.5">{plan.billingTypeLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{plan.priceLabel}</p>
                <p className="text-[10px] text-[#5c5d72]">per package</p>
              </div>
            </div>
            {plan.premiumSupport && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/25 mb-3">
                <Crown size={10} /> Premium Support
              </span>
            )}
            <ul className="space-y-1.5 mb-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-[#a5a6bb]">
                  <Check size={12} className="text-emerald-400 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModal({ mode: 'edit', plan })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${plan.popular ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-[#1c1d2a] hover:bg-[#2d2e3e] text-white border border-[#2d2e3e]'}`}>
                <Edit3 size={11} className="inline mr-1" /> Edit Plan
              </button>
              <button type="button" onClick={() => deletePlan(plan.id).unwrap()}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2d2e3e] text-[#5c5d72] hover:text-red-400 hover:bg-[#2d2e3e]">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setModal({ mode: 'create' })}
          className="border-2 border-dashed border-[#2d2e3e] hover:border-violet-500/40 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-[#5c5d72] hover:text-white transition-colors min-h-[200px]">
          <Plus size={28} /><p className="text-sm font-semibold">Create New Plan</p>
        </button>
      </div>

      {modal && (
        <PlanFormModal
          initial={modal.mode === 'edit' && modal.plan ? planToForm(modal.plan) : EMPTY_FORM}
          onClose={() => { setModal(null); setSaveError('') }}
          onSave={handleSave}
          saving={creating || updating}
          error={saveError}
        />
      )}
    </div>
  )
}
