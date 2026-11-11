import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  useGetPairSessionByCodeQuery,
  useJoinPairSessionByCodeMutation,
} from '../api/pairProgrammingApi'
import { PairProgrammingWorkspace } from '../components/pair-programming/PairProgrammingWorkspace'
import { SessionWaitingScreen } from '../components/pair-programming/SessionWaitingScreen'
import { PROGRAMMING_LANGUAGES } from '../api/codingProblemsApi'
import type { PairProgrammingMeta } from '../store/matchSessionSlice'

function sessionToMeta(session: {
  language: string
  problemId: string
  problemTitle: string
  problemDescription: string
  difficulty: string
  currentCode: string
  hostRole: string
}): PairProgrammingMeta {
  const lang = PROGRAMMING_LANGUAGES.find((l) => l.id === session.language)
  return {
    languageId: session.language,
    languageLabel: lang?.label ?? session.language,
    taskId: session.problemId,
    taskTitle: session.problemTitle,
    taskDescription: session.problemDescription,
    difficulty: session.difficulty,
    starterCode: session.currentCode ?? '',
    role: session.hostRole === 'navigator' ? 'navigator' : 'driver',
  }
}

export function PairSessionPage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const normalizedCode = code.trim().toUpperCase()

  const { data: session, isLoading, error, refetch } = useGetPairSessionByCodeQuery(normalizedCode, {
    skip: !normalizedCode,
    pollingInterval: 5000,
  })
  const [joinSession, { isLoading: joining }] = useJoinPairSessionByCodeMutation()

  const meta = useMemo(() => (session ? sessionToMeta(session) : null), [session])

  useEffect(() => {
    if (session?.status === 'ACTIVE' && normalizedCode) {
      void joinSession(normalizedCode)
    }
  }, [session?.status, normalizedCode, joinSession])

  if (!normalizedCode) {
    return (
      <div className="p-6 text-center text-[#8b8ca8]">
        Invalid session code. <Link to="/pair-programming" className="text-[#818cf8] hover:underline">Go back</Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-[#8b8ca8] gap-2">
        <Loader2 className="animate-spin" size={20} /> Loading session…
      </div>
    )
  }

  if (error || !session) {
    const notFound = error && 'status' in error && error.status === 404
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">{notFound ? 'Session not found' : 'Could not load session'}</p>
        <Link to="/pair-programming" className="text-sm text-[#818cf8] hover:underline">Back to Pair Programming</Link>
      </div>
    )
  }

  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Session already ended</p>
        <Link to="/pair-programming" className="text-sm text-[#818cf8] hover:underline">Start a new session</Link>
      </div>
    )
  }

  if (session.status === 'WAITING') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <SessionWaitingScreen
          sessionCode={normalizedCode}
          onActive={() => void refetch()}
          onRejected={() => navigate('/pair-programming')}
        />
      </div>
    )
  }

  if (session.status === 'ACTIVE' && meta) {
    if (joining) {
      return (
        <div className="flex items-center justify-center min-h-[320px] text-[#8b8ca8] gap-2">
          <Loader2 className="animate-spin" size={20} /> Joining session…
        </div>
      )
    }
    return <PairProgrammingWorkspace sessionId={session.id} meta={meta} sessionCode={normalizedCode} />
  }

  return null
}
