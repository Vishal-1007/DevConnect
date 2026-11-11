import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'

interface PollCreatorModalProps {
  open: boolean
  onClose: () => void
  onInsert: (question: string, options: string[]) => void
}

export function PollCreatorModal({ open, onClose, onInsert }: PollCreatorModalProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  if (!open) return null

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  function addOption() {
    if (options.length >= 5) return
    setOptions((prev) => [...prev, ''])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleInsert() {
    const trimmedQuestion = question.trim()
    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean)
    if (!trimmedQuestion || trimmedOptions.length < 2) return
    onInsert(trimmedQuestion, trimmedOptions)
    setQuestion('')
    setOptions(['', ''])
    onClose()
  }

  const filledOptions = options.filter((o) => o.trim()).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="dc-glass-card rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-[#6366f1]/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Create Poll</h3>
          <button type="button" onClick={onClose} className="text-[#8b8ca8] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs text-[#8b8ca8] mb-1.5">Question</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Which backend framework do you prefer?"
          className="w-full h-10 px-3 mb-4 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
        />

        <p className="text-xs text-[#8b8ca8] mb-2">Options (2–5)</p>
        <div className="space-y-2 mb-3">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 h-9 px-3 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-2 text-[#8b8ca8] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < 5 && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 text-xs text-[#818cf8] hover:text-white mb-4"
          >
            <Plus size={14} />
            Add Option
          </button>
        )}

        {filledOptions < 2 && (
          <p className="text-xs text-amber-400 mb-3">Please add at least two poll options</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-[#8b8ca8] border border-[#2d2e3e] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!question.trim() || filledOptions < 2}
            onClick={handleInsert}
            className="px-4 py-2 rounded-xl text-sm font-semibold dc-gradient-btn text-white disabled:opacity-50"
          >
            Add Poll
          </button>
        </div>
      </div>
    </div>
  )
}
