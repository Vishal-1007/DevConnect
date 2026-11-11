import type { ReactNode } from 'react'
import { Loader2, ToggleLeft } from 'lucide-react'
import { useGetPlatformFeaturesQuery, isFeatureEnabled } from '../api/platformFeaturesApi'

export function FeatureGate({
  feature,
  fallback,
  children,
}: {
  feature: string
  fallback?: ReactNode
  children: ReactNode
}) {
  const { data: flags, isLoading } = useGetPlatformFeaturesQuery(undefined, {
    pollingInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </div>
    )
  }

  if (flags?.maintenanceMode && feature !== 'maintenanceMode') {
    return (
      fallback ?? (
        <div className="max-w-lg mx-auto mt-16 bg-[#161722] border border-[#2d2e3e] rounded-xl p-8 text-center">
          <ToggleLeft size={32} className="text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Platform under maintenance</h2>
          <p className="text-sm text-[#8b8ca8]">
            DevConnect is undergoing scheduled maintenance. Please check back shortly.
          </p>
        </div>
      )
    )
  }

  if (!isFeatureEnabled(flags, feature)) {
    return (
      fallback ?? (
        <div className="max-w-lg mx-auto mt-16 bg-[#161722] border border-[#2d2e3e] rounded-xl p-8 text-center">
          <ToggleLeft size={32} className="text-[#5c5d72] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Feature temporarily unavailable</h2>
          <p className="text-sm text-[#8b8ca8]">
            This feature has been disabled by platform administrators. Please check back later.
          </p>
        </div>
      )
    )
  }

  return <>{children}</>
}
