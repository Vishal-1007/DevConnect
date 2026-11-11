import { useRef, useState } from 'react'
import { FileText, Download, Eye, Trash2, Upload, CheckCircle2, Clock, X } from 'lucide-react'
import { ProfileSectionHeader } from './profileUi'
import type { ResumeInfo } from '../../data/candidateProfileData'

type Props = {
  resume: ResumeInfo | null
  onChange: (resume: ResumeInfo | null) => void
}

function isResumeFile(file: File) {
  return (
    file.type === 'application/pdf' ||
    file.type === 'application/msword' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.(pdf|doc|docx)$/i.test(file.name)
  )
}

function downloadResume(resume: ResumeInfo) {
  if (resume.dataUrl) {
    const a = document.createElement('a')
    a.href = resume.dataUrl
    a.download = resume.fileName
    a.click()
    return
  }

  const placeholder = `Resume: ${resume.fileName}\n\nUpload a new resume file to enable full preview and download.`
  const blob = new Blob([placeholder], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = resume.fileName.replace(/\.[^.]+$/, '') + '.txt'
  a.click()
  URL.revokeObjectURL(url)
}

export function ResumeUpload({ resume, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [showPreview, setShowPreview] = useState(false)

  function handleUpload(file: File | undefined) {
    if (!file) return
    if (!isResumeFile(file)) return
    if (file.size > 5 * 1024 * 1024) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      onChange({
        fileName: file.name,
        uploadedAt: new Date().toISOString().slice(0, 10),
        status: 'Pending',
        dataUrl: reader.result,
        mimeType: file.type || 'application/octet-stream',
      })
    }
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleDelete() {
    onChange(null)
    setShowPreview(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
        <ProfileSectionHeader
          icon={FileText}
          title="Resume"
          desc="Recruiters use your resume alongside DevScore for hiring decisions"
        />

        {!resume ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2d2e3e] bg-[#0b0c14]/60 py-10 transition hover:border-violet-500/40"
          >
            <Upload size={24} className="text-violet-400" />
            <span className="text-sm font-medium text-white">Upload Resume PDF / DOC</span>
            <span className="text-xs text-[#5c5d72]">Max 5MB · PDF or Word document</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
                <FileText size={20} className="text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{resume.fileName}</p>
                <p className="text-xs text-[#8b8ca8]">
                  Uploaded: {new Date(resume.uploadedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  resume.status === 'Verified'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}>
                  {resume.status === 'Verified' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                  {resume.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1 rounded-lg border border-[#2d2e3e] bg-white/5 px-3 py-2 text-xs text-[#c4c5d6] hover:text-white"
              >
                <Eye size={13} />
                Preview
              </button>
              <button
                type="button"
                onClick={() => downloadResume(resume)}
                className="flex items-center gap-1 rounded-lg border border-[#2d2e3e] bg-white/5 px-3 py-2 text-xs text-[#c4c5d6] hover:text-white"
              >
                <Download size={13} />
                Download
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />

        {resume && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            Replace resume
          </button>
        )}
      </div>

      {showPreview && resume && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2d2e3e] px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-white">Resume Preview</h3>
                <p className="text-xs text-[#8b8ca8]">{resume.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-2 text-[#8b8ca8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-[#0b0c14] p-4">
              {resume.dataUrl && resume.mimeType?.includes('pdf') ? (
                <iframe
                  title="Resume preview"
                  src={resume.dataUrl}
                  className="h-[70vh] w-full rounded-lg border border-[#2d2e3e]"
                />
              ) : resume.dataUrl ? (
                <div className="flex h-[40vh] flex-col items-center justify-center text-center">
                  <FileText size={40} className="mb-3 text-violet-400" />
                  <p className="text-sm text-white">Word document uploaded</p>
                  <p className="mt-1 text-xs text-[#8b8ca8]">Use Download to save {resume.fileName}</p>
                  <button
                    type="button"
                    onClick={() => downloadResume(resume)}
                    className="mt-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Download file
                  </button>
                </div>
              ) : (
                <div className="flex h-[40vh] flex-col items-center justify-center text-center">
                  <FileText size={40} className="mb-3 text-violet-400" />
                  <p className="text-sm text-white">Sample resume on file</p>
                  <p className="mt-1 max-w-sm text-xs text-[#8b8ca8]">
                    Re-upload your resume to enable in-browser preview. You can still download a placeholder file.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadResume(resume)}
                    className="mt-4 rounded-xl border border-[#2d2e3e] px-4 py-2 text-sm text-white hover:border-violet-500/40"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
