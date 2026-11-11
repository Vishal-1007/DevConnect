import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Send, X } from 'lucide-react'
import { useCreateMentorshipRequestMutation } from '../../api/mentorshipApi'
import type { MarketplaceMentor } from '../../api/marketplaceApi'

const GOALS = [
  'Interview Preparation',
  'Job Switch',
  'Career Guidance',
  'System Design',
  'DSA',
  'Backend Development',
]

interface Props {
  mentor: MarketplaceMentor
  onClose: () => void
  onSuccess?: () => void
}

export function RequestMentorshipModal({ mentor, onClose, onSuccess }: Props) {
  const [goal, setGoal] = useState(GOALS[0])
  const [message, setMessage] = useState('')
  const [create, { isLoading }] = useCreateMentorshipRequestMutation()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    setError(null)
    try {
      await create({ mentorId: mentor.mentorId, goal, message: message.trim() || undefined }).unwrap()
      setSent(true)
      onSuccess?.()
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message ?? 'Could not send request'
      if (msg.toLowerCase().includes('active mentorship')) {
        setError(msg)
      } else if (msg.toLowerCase().includes('pending')) {
        setSent(true)
      } else {
        setError(msg)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#161722] border border-[#2d2e3e] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Request Mentorship</h2>
            <p className="text-xs text-[#8b8ca8] mt-0.5">Send a request to {mentor.displayName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#8b8ca8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-6 text-center">
            <p className="text-emerald-400 font-semibold mb-2">Request pending</p>
            <p className="text-sm text-[#8b8ca8]">
              Your mentorship request to {mentor.displayName} is pending. They will be notified and can accept from their dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
              <Link to="/my-mentorship-requests" onClick={onClose} className="px-4 py-2 rounded-xl border border-[#6366f1]/40 text-[#c7d2fe] text-sm font-semibold hover:bg-[#6366f1]/10">
                View My Requests
              </Link>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl dc-gradient-btn text-white text-sm font-semibold">Done</button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8b8ca8] mb-1.5 block">Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white"
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8b8ca8] mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={`Hi ${mentor.displayName.split(' ')[0]}, I'm preparing for SDE-2 interviews and would like long-term mentorship.`}
                className="w-full px-3 py-2 rounded-xl bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white placeholder-[#5c5d72] resize-none focus:outline-none focus:border-[#6366f1]/50"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#2d2e3e] text-[#8b8ca8] text-sm font-semibold hover:text-white">Cancel</button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void handleSend()}
                className="flex-1 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
