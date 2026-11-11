import type { ReactNode } from 'react'

/** Standard full-width scrollable shell for mentor dashboard panels. */
export function MentorPanelShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex-1 min-h-0 min-w-0 w-full overflow-y-auto ${className}`}>
      <div className="w-full max-w-none px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

export const MENTOR_STAT_GRID = 'grid grid-cols-2 lg:grid-cols-4 gap-3 w-full'

export function MentorFilterRow({
  children,
  search,
}: {
  children: ReactNode
  search?: ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {search && <div className="relative w-full lg:w-72 lg:shrink-0">{search}</div>}
    </div>
  )
}
