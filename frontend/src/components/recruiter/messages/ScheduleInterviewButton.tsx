import { Calendar } from 'lucide-react'

type Props = {
  onClick: () => void
}

export function ScheduleInterviewButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20"
    >
      <Calendar size={15} />
      Schedule Interview
    </button>
  )
}
