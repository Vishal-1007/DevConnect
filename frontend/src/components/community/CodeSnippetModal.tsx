import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { X } from 'lucide-react'

const LANGUAGES = ['Java', 'JavaScript', 'React', 'Python', 'SQL', 'HTML', 'CSS'] as const

interface CodeSnippetModalProps {
  open: boolean
  onClose: () => void
  onInsert: (language: string, content: string) => void
}

export function CodeSnippetModal({ open, onClose, onInsert }: CodeSnippetModalProps) {
  const [language, setLanguage] = useState<string>('Java')
  const [code, setCode] = useState('')

  if (!open) return null

  function handleInsert() {
    const trimmed = code.trim()
    if (!trimmed) return
    const lines = code.split('\n').length
    if (lines > 500) return
    onInsert(language.toLowerCase(), code)
    setCode('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="dc-glass-card rounded-2xl w-full max-w-2xl p-5 shadow-2xl border border-[#6366f1]/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Add Code Snippet</h3>
          <button type="button" onClick={onClose} className="text-[#8b8ca8] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs text-[#8b8ca8] mb-1.5">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full h-10 px-3 mb-4 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <div className="rounded-xl overflow-hidden border border-[#2d2e3e] mb-4">
          <Editor
            height="280px"
            language={language.toLowerCase() === 'react' ? 'javascript' : language.toLowerCase()}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>

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
            disabled={!code.trim()}
            onClick={handleInsert}
            className="px-4 py-2 rounded-xl text-sm font-semibold dc-gradient-btn text-white disabled:opacity-50"
          >
            Insert Code
          </button>
        </div>
      </div>
    </div>
  )
}
