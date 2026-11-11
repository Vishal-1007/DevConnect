import { Construction } from 'lucide-react'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-14 h-14 rounded-xl bg-[#6366f1]/20 flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-[#818cf8]" />
      </div>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-sm text-[#8b8ca8] mt-2 max-w-md">
        This section is coming soon. The navigation matches the DevConnect design — backend
        integration will follow.
      </p>
    </div>
  )
}
