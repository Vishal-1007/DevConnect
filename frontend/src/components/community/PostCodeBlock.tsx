import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { CommunityPostCode } from '../../api/types'

interface PostCodeBlockProps {
  code: CommunityPostCode
}

export function PostCodeBlock({ code }: PostCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const languageLabel = code.language.charAt(0).toUpperCase() + code.language.slice(1)

  return (
    <div className="mt-3 rounded-xl border border-[#2d2e3e] overflow-hidden bg-[#0b0c14]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2e3e] bg-[#161722]/80">
        <span className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-wide">
          {languageLabel}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-[#8b8ca8] hover:text-white"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-emerald-200 p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre">
        {code.content}
      </pre>
    </div>
  )
}
