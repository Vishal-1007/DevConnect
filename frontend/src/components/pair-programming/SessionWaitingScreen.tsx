import { useEffect, useState } from 'react'
import { Loader2, Clock, Copy, CheckCircle2 } from 'lucide-react'
import { useGetPairSessionByCodeQuery, type PairSession } from '../../api/pairProgrammingApi'

interface Props {
  sessionCode: string
  onActive: (session: PairSession) => void
  onRejected?: () => void
}

export function SessionWaitingScreen({ sessionCode, onActive, onRejected }: Props) {
  const { data: session, error } = useGetPairSessionByCodeQuery(sessionCode, {
    pollingInterval: 3000,
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!session) return
    if (session.status === 'ACTIVE') onActive(session)
    if (session.status === 'CANCELLED' || session.status === 'COMPLETED') onRejected?.()
  }, [session, onActive, onRejected])

  async function copyCode() {
    await navigator.clipboard.writeText(sessionCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const errMsg =
    error && 'status' in error
      ? error.status === 404
        ? 'Session not found'
        : 'Could not load session'
      : null

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#6366f1]/20 flex items-center justify-center mb-5">
        {session?.status === 'ACTIVE' ? (
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        ) : (
          <Loader2 className="w-8 h-8 text-[#818cf8] animate-spin" />
        )}
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Waiting for mentor approval…</h2>
      <p className="text-sm text-[#8b8ca8] max-w-md mb-6">
        Your mentor has been notified. Once they accept, you will be redirected to the shared coding workspace.
      </p>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#161722] border border-[#2d2e3e] mb-4">
        <Clock size={16} className="text-[#818cf8]" />
        <span className="text-sm text-[#8b8ca8]">Session code:</span>
        <span className="text-lg font-mono font-bold text-white tracking-wider">{sessionCode}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="ml-2 p-1.5 rounded-lg hover:bg-[#2d2e3e] text-[#8b8ca8] hover:text-white"
          title="Copy code"
        >
          {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      {session && (
        <div className="text-xs text-[#8b8ca8] space-y-1">
          <p>Challenge: <span className="text-white">{session.problemTitle}</span></p>
          <p>Language: <span className="text-white capitalize">{session.language}</span></p>
          <p>Your role: <span className="text-white capitalize">{session.hostRole}</span></p>
        </div>
      )}
      {errMsg && <p className="text-sm text-red-400 mt-4">{errMsg}</p>}
      {session?.status === 'CANCELLED' && (
        <p className="text-sm text-red-400 mt-4">Your pair programming request was declined.</p>
      )}
    </div>
  )
}
