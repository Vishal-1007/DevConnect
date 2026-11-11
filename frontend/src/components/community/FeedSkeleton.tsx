export function FeedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="dc-glass-card rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full bg-[#2d2e3e]" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-32 rounded bg-[#2d2e3e]" />
              <div className="h-3 w-full rounded bg-[#2d2e3e]/70" />
              <div className="h-3 w-4/5 rounded bg-[#2d2e3e]/50" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 rounded-lg bg-[#2d2e3e]" />
                <div className="h-6 w-16 rounded-lg bg-[#2d2e3e]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
