import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

interface MultiSelectFilterProps {
  label: string
  placeholder: string
  options: readonly string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function MultiSelectFilter({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOption(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  function removeOne(value: string) {
    onChange(selected.filter((v) => v !== value))
  }

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-[10px] font-medium text-[#8b8ca8] mb-1.5 uppercase tracking-wide">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full min-h-10 px-3 py-2 rounded-xl bg-[#0b0c14]/80 border text-left text-sm flex items-center justify-between gap-2 transition-colors ${
          open || selected.length > 0
            ? 'border-[#6366f1]/50 text-white'
            : 'border-[#2d2e3e] text-[#8b8ca8]'
        }`}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#8b8ca8] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25"
            >
              {value}
              <button
                type="button"
                onClick={() => removeOne(value)}
                className="hover:text-white"
                aria-label={`Remove ${value}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-1.5 w-full max-h-52 overflow-y-auto rounded-xl border border-[#2d2e3e] bg-[#161722] shadow-xl shadow-black/40 py-1">
          {options.map((option) => {
            const checked = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  checked
                    ? 'bg-[#6366f1]/15 text-white'
                    : 'text-[#b4b5c8] hover:bg-[#1c1d2a] hover:text-white'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked
                      ? 'bg-[#6366f1] border-[#6366f1]'
                      : 'border-[#2d2e3e] bg-[#0b0c14]'
                  }`}
                >
                  {checked && <Check size={10} className="text-white" />}
                </span>
                <span className="truncate">{option}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
