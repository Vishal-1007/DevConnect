import { useRef, useState } from 'react'
import { FileText, Loader2, Upload } from 'lucide-react'
import { useUploadAiResumeMutation, type ResumeParseResult } from '../../api/aiInterviewApi'
import { extractApiError } from '../../lib/extractApiError'

interface ResumeUploaderProps {
  onParsed: (data: ResumeParseResult) => void
  parsed?: ResumeParseResult | null
}

export function ResumeUploader({ onParsed, parsed }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [upload, { isLoading, error }] = useUploadAiResumeMutation()
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      return
    }
    setFileName(file.name)
    try {
      const result = await upload(file).unwrap()
      onParsed(result)
    } catch {
      setFileName(null)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border-2 border-dashed border-[#2d2e3e] bg-[#0b0c14]/60 p-8 text-center hover:border-[#6366f1]/50 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) void handleFile(file)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-[#8b8ca8]">
            <Loader2 size={28} className="animate-spin text-[#818cf8]" />
            <p className="text-sm">Extracting resume content…</p>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto text-[#818cf8] mb-2" />
            <p className="text-sm text-white font-medium">Drop your resume here or click to browse</p>
            <p className="text-xs text-[#8b8ca8] mt-1">PDF or DOCX · Max 10MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{extractApiError(error) || 'Could not parse resume'}</p>
      )}

      {parsed && (
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white font-medium">
              <FileText size={16} className="text-[#818cf8]" />
              {fileName ?? 'Resume parsed'}
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-[#818cf8] hover:text-white"
            >
              Replace
            </button>
          </div>
          {parsed.username && (
            <p className="text-xs text-[#8b8ca8]">
              Name: <span className="text-white">{parsed.username}</span>
            </p>
          )}
          {parsed.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {parsed.skills.slice(0, 10).map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-[#6366f1]/10 text-[#a5b4fc] border border-[#6366f1]/20">
                  {s}
                </span>
              ))}
            </div>
          )}
          {parsed.projects.length > 0 && (
            <p className="text-xs text-[#8b8ca8]">
              Projects: <span className="text-white">{parsed.projects.slice(0, 2).join(' · ')}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
