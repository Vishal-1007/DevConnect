import { Sparkles, X, CheckCircle2 } from 'lucide-react'
import { useGetFeatureFlagsQuery, useToggleFeatureFlagMutation } from '../../api/adminFeaturesApi'

const PRO_FEATURES = [
  'Advanced analytics & cohort reports',
  'AI-powered content moderation',
  'Fraud detection & payment risk scoring',
  'Priority support & SLA monitoring',
  'Custom feature flags & A/B experiments',
]

export function AdminProAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useGetFeatureFlagsQuery(undefined, { skip: !open })
  const [toggleFeature, { isLoading }] = useToggleFeatureFlagMutation()

  const proEnabled = data?.flags?.proAdminToolkit ?? false

  if (!open) return null

  async function handleUpgrade() {
    await toggleFeature({ key: 'proAdminToolkit', enabled: true }).unwrap()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161722] border border-violet-500/30 rounded-2xl p-6 w-full max-w-md relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5c5d72] hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={20} className="text-violet-400" />
          <h3 className="text-lg font-bold text-white">Pro Admin Toolkit</h3>
        </div>
        <p className="text-xs text-[#8b8ca8] mb-4 leading-relaxed">
          Enterprise-grade controls for scaling, security, and revenue management — built for
          production SaaS operations.
        </p>
        <ul className="space-y-2 mb-5">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs text-[#a5a6bb]">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>
        {proEnabled ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-xs text-emerald-400 font-semibold text-center">
            Pro Admin toolkit is active on this environment
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            Enable Pro Admin
          </button>
        )}
      </div>
    </div>
  )
}
