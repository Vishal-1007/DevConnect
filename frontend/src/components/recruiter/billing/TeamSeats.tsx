import { UserPlus, Users } from 'lucide-react'
import type { RecruiterBillingData } from '../../../data/recruiterBillingData'

type Props = {
  teamSeats: RecruiterBillingData['teamSeats']
  onAddSeat?: () => void
}

export function TeamSeats({ teamSeats, onAddSeat }: Props) {
  const pct = Math.round((teamSeats.used / teamSeats.total) * 100)

  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2">
        <Users size={16} className="text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Team Seats</h3>
      </div>

      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[#8b8ca8]">Current</span>
        <span className="font-medium text-white">
          {teamSeats.used} / {teamSeats.total} Used
        </span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#0b0c14]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {teamSeats.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                {member.avatar}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{member.name}</p>
                <p className="text-[10px] text-[#8b8ca8]">{member.role}</p>
              </div>
            </div>
            {member.isAdmin && (
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                Admin
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSeat}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/20"
      >
        <UserPlus size={14} />
        Add Recruiter Seat
      </button>
    </div>
  )
}
