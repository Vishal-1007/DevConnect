import { useState } from 'react'
import { Loader2, Star, X } from 'lucide-react'
import { useSubmitMentorFeedbackMutation } from '../../api/mentorshipApi'

type Props = {
  mentorId: string
  mentorName: string
  onClose: () => void
}

export function SubmitMentorFeedbackModal({ mentorId, mentorName, onClose }: Props) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [improvementSuggestion, setImprovementSuggestion] = useState('')
  const [submit, { isLoading, error }] = useSubmitMentorFeedbackMutation()

  const save = async () => {
    await submit({
      mentorId,
      rating,
      comment: comment.trim(),
      improvementSuggestion: improvementSuggestion.trim() || undefined,
    }).unwrap()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Rate {mentorName}</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-[#8b8ca8] mb-2">Your rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="p-1"
                >
                  <Star
                    size={22}
                    className={value <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#3d3e52]'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8b8ca8]">Feedback comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share what went well in your mentorship sessions..."
              className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-[#8b8ca8]">Improvement suggestion (optional)</label>
            <textarea
              value={improvementSuggestion}
              onChange={(e) => setImprovementSuggestion(e.target.value)}
              rows={2}
              placeholder="What could improve future sessions?"
              className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-violet-500"
            />
          </div>
          {error && (
            <p className="text-xs text-red-300">Could not submit feedback. You may have already reviewed this mentor.</p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={isLoading || !comment.trim()}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  )
}
