import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, ToggleLeft } from 'lucide-react'
import {
  useGetFeatureFlagsQuery,
  useToggleFeatureFlagMutation,
  type FeatureFlag,
} from '../../api/adminFeaturesApi'

function ToggleSwitch({
  enabled,
  loading,
  onToggle,
}: {
  enabled: boolean
  loading?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        enabled ? 'bg-violet-600' : 'bg-[#2d2e3e]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function AdminFeatureManagementPanel() {
  const { data, isLoading, isFetching, refetch } = useGetFeatureFlagsQuery(undefined, {
    pollingInterval: 15000,
  })
  const [toggleFeature, { isLoading: toggling }] = useToggleFeatureFlagMutation()
  const [confirmToggle, setConfirmToggle] = useState<FeatureFlag | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const categories = useMemo(() => {
    if (!data?.features) return []
    return [...new Set(data.features.map((f) => f.category))]
  }, [data])

  async function applyToggle(key: string, enabled: boolean) {
    setPendingKey(key)
    try {
      await toggleFeature({ key, enabled }).unwrap()
    } finally {
      setPendingKey(null)
      setConfirmToggle(null)
    }
  }

  function handleToggle(feature: FeatureFlag) {
    const next = !feature.enabled
    if (feature.critical && !next) {
      setConfirmToggle(feature)
      return
    }
    void applyToggle(feature.key, next)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  const features = data?.features ?? []
  const enabledCount = data?.enabledCount ?? 0
  const totalCount = data?.totalCount ?? features.length

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {confirmToggle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl p-6 w-96 max-w-[90vw]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h3 className="font-bold text-white">Disable {confirmToggle.label}?</h3>
            </div>
            <p className="text-xs text-[#8b8ca8] mb-5">
              This is a critical feature. Disabling it affects all users immediately — no redeploy required.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmToggle(null)}
                className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void applyToggle(confirmToggle.key, false)}
                disabled={toggling}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ToggleLeft size={20} className="text-violet-400" />
            Feature Management
          </h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">
            {enabledCount}/{totalCount} features active — toggle without redeploying
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#3d3e52] mb-3">{cat}</p>
            <div className="space-y-2">
              {features
                .filter((f) => f.category === cat)
                .map((feat) => (
                  <div
                    key={feat.key}
                    className={`bg-[#161722] border rounded-xl p-4 flex items-center gap-4 transition-colors ${
                      feat.enabled ? 'border-[#2d2e3e]' : 'border-[#1e1f2e] opacity-60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        feat.enabled ? 'bg-violet-500/15' : 'bg-[#1c1d2a]'
                      }`}
                    >
                      <ToggleLeft size={18} className={feat.enabled ? 'text-violet-400' : 'text-[#5c5d72]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-white">{feat.label}</span>
                        {feat.critical && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-semibold">
                            CRITICAL
                          </span>
                        )}
                        {!feat.enabled && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-semibold">
                            OFF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5c5d72]">{feat.description}</p>
                      {feat.updatedByUsername && (
                        <p className="text-[9px] text-[#3d3e52] mt-1">
                          Last updated by {feat.updatedByUsername}
                        </p>
                      )}
                    </div>
                    <ToggleSwitch
                      enabled={feat.enabled}
                      loading={pendingKey === feat.key}
                      onToggle={() => handleToggle(feat)}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
