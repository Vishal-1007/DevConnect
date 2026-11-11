import { Check, Loader2, Settings, Shield, Unplug, X, Zap } from 'lucide-react'
import type { RecruiterIntegrationView } from '../../../types/recruiterIntegration'

type Props = {
  integration: RecruiterIntegrationView
  onClose: () => void
  onDisconnect: () => void
  disconnecting?: boolean
  testingConnection?: boolean
  onOpenSyncSettings?: () => void
  onAction?: (action: string) => void
}

function formatConnectedDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function IntegrationManageModal({
  integration,
  onClose,
  onDisconnect,
  disconnecting,
  testingConnection,
  onOpenSyncSettings,
  onAction,
}: Props) {
  const options = [
    { id: 'sync', label: 'Sync Settings', icon: Settings },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'test', label: 'Test Connection', icon: Zap },
  ] as const

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl">
        <div className="relative border-b border-[#2d2e3e]/60 p-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8b8ca8] hover:bg-[#2d2e3e] hover:text-white"
          >
            <X size={18} />
          </button>
          <h2 className="pr-8 text-lg font-bold text-white">
            Manage {integration.name} Integration
          </h2>
          <p className="mt-1 text-sm text-[#8b8ca8]">
            View connection details and manage settings
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8b8ca8]">Status</span>
                <span className="flex items-center gap-1 font-medium text-emerald-300">
                  <Check size={14} />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8b8ca8]">Connected Account</span>
                <span className="font-medium text-white">{integration.connectedEmail ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8b8ca8]">Connected Date</span>
                <span className="font-medium text-white">
                  {formatConnectedDate(integration.connectedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {options.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                disabled={id === 'test' && testingConnection}
                onClick={() =>
                  id === 'sync' ? onOpenSyncSettings?.() : onAction?.(label)
                }
                className="flex w-full items-center gap-2 rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3 text-left text-sm font-medium text-white transition hover:border-violet-500/30 hover:bg-violet-500/5 disabled:opacity-60"
              >
                <Check size={14} className="text-emerald-400" />
                <Icon size={16} className="text-violet-300" />
                {id === 'test' && testingConnection ? 'Testing Connection...' : label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
          >
            {disconnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unplug size={16} />
                Disconnect Integration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
