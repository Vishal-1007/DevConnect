import { Check, Loader2, Settings } from 'lucide-react'
import type { RecruiterIntegrationProvider, RecruiterIntegrationView } from '../../../types/recruiterIntegration'
import { SettingsCard } from './SettingsLayout'

type Props = {
  integrations: RecruiterIntegrationView[]
  loading?: boolean
  connectingProvider?: RecruiterIntegrationProvider | null
  onConnect: (integration: RecruiterIntegrationView) => void
  onManage: (integration: RecruiterIntegrationView) => void
}

export function IntegrationSettings({
  integrations,
  loading,
  connectingProvider,
  onConnect,
  onManage,
}: Props) {
  return (
    <SettingsCard
      title="Integrations"
      description="Connect calendar and video tools for interview scheduling"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-[#8b8ca8]">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading integrations...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {integrations.map((integration) => {
            const isConnecting = connectingProvider === integration.provider

            return (
              <div
                key={integration.provider}
                className="flex items-center justify-between rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2d2e3e]/60 bg-[#161722] text-[10px] font-bold text-violet-300">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{integration.name}</p>
                      {integration.connected && (
                        <span className="flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
                          <Check size={10} />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b8ca8]">{integration.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() =>
                    integration.connected ? onManage(integration) : onConnect(integration)
                  }
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                    integration.connected
                      ? 'border border-[#2d2e3e] bg-white/5 text-[#8b8ca8] hover:text-white'
                      : 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white hover:opacity-90'
                  }`}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Connecting...
                    </>
                  ) : integration.connected ? (
                    <>
                      <Settings size={12} />
                      Manage
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </SettingsCard>
  )
}
