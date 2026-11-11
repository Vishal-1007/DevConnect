import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import {
  AlertTriangle,
  Clock,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Video,
  VideoOff,
} from 'lucide-react'
import {
  useEndMockInterviewSessionMutation,
  useGetMockInterviewSessionQuery,
  useStartMockInterviewSessionMutation,
} from '../api/mockInterviewApi'
import { useGetMyProfileQuery } from '../api/userApi'
import { useLocalMedia } from '../hooks/useLocalMedia'
import { useWebRTC } from '../hooks/useWebRTC'
import { useAppSelector } from '../hooks'
import { formatCallDuration } from '../lib/formatTime'
import { avatarUrl } from '../lib/avatar'

const EDITOR_LANGUAGES = [
  { id: 'java', label: 'Java' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
] as const

type EditorLanguage = (typeof EDITOR_LANGUAGES)[number]['id']

const STARTER_BY_LANGUAGE: Record<EditorLanguage, string> = {
  java: `public class Solution {
  public static void main(String[] args) {
    System.out.println("Mock interview workspace");
  }
}`,
  javascript: `function solve(input) {
  return input;
}

console.log(solve("example"));`,
  typescript: `function solve(input: string): string {
  return input;
}

console.log(solve("example"));`,
  python: `def solve(input_value: str) -> str:
    return input_value

print(solve("example"))`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << "Mock interview workspace" << endl;
  return 0;
}`,
}

type SideTab = 'chat' | 'notes'

interface ChatLine {
  id: string
  from: string
  text: string
  at: number
}

export function MockInterviewSessionPage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const normalizedCode = code.trim().toUpperCase()
  const account = useAppSelector((s) => s.auth.account)
  const { data: profile } = useGetMyProfileQuery()

  const { data: session, isLoading, error, refetch } = useGetMockInterviewSessionQuery(normalizedCode, {
    skip: !normalizedCode,
    pollingInterval: 8000,
  })
  const [startSession, { isLoading: starting }] = useStartMockInterviewSessionMutation()
  const [endSession, { isLoading: ending }] = useEndMockInterviewSessionMutation()

  const myUserId = account?.id ?? ''
  const myName = profile?.displayName ?? account?.username ?? 'You'
  const isLive = session?.status === 'LIVE'
  const inCall = isLive

  const partnerName =
    session?.request.learnerId === myUserId
      ? session.request.interviewerName
      : session?.request.learnerName ?? 'Interviewer'
  const partnerId =
    session?.request.learnerId === myUserId
      ? session.request.interviewerId
      : session?.request.learnerId

  const {
    callState,
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    startCall: webrtcStart,
    hangUp,
    toggleMic,
    toggleCamera,
    startPreview,
  } = useWebRTC(myUserId, myName)

  const {
    videoRef: localVideoRef,
    micEnabled: localMic,
    cameraEnabled: localCam,
    mediaError,
    streamReady,
    toggleMic: toggleLocalMic,
    toggleCamera: toggleLocalCam,
    stopMedia,
  } = useLocalMedia(inCall && callState === 'idle')

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const webrtcLocalRef = useRef<HTMLVideoElement | null>(null)

  const [language, setLanguage] = useState<EditorLanguage>('javascript')
  const [editorCode, setEditorCode] = useState(STARTER_BY_LANGUAGE.javascript)
  const [runOutput, setRunOutput] = useState('')
  const [sideTab, setSideTab] = useState<SideTab>('chat')
  const [note, setNote] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatLines, setChatLines] = useState<ChatLine[]>([])
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [timer, setTimer] = useState('00:00')
  const startedRef = useRef(false)

  function handleLanguageChange(next: EditorLanguage) {
    setLanguage(next)
    setEditorCode(STARTER_BY_LANGUAGE[next])
    setRunOutput('')
  }

  function handleRunCode() {
    if (language === 'javascript' || language === 'typescript') {
      try {
        const logs: string[] = []
        const mockConsole = { log: (...args: unknown[]) => logs.push(args.map(String).join(' ')) }
        // eslint-disable-next-line no-new-func
        new Function('console', editorCode)(mockConsole)
        setRunOutput(logs.join('\n') || '(no output)')
      } catch (err) {
        setRunOutput(String(err))
      }
      return
    }
    setRunOutput('Run is available for JavaScript and TypeScript in this session.')
  }

  useEffect(() => {
    if (!normalizedCode || !session || startedRef.current) return
    if (session.status === 'WAITING' && !starting) {
      startedRef.current = true
      void startSession({ sessionCode: normalizedCode })
        .unwrap()
        .then(() => {
          setStartedAt(Date.now())
          void refetch()
        })
        .catch(() => {
          startedRef.current = false
        })
    }
    if (isLive && !startedAt) {
      setStartedAt(session.startedAt ? Date.parse(session.startedAt) : Date.now())
    }
  }, [normalizedCode, session, startSession, starting, refetch, isLive, startedAt])

  useEffect(() => {
    if (!inCall || !partnerId) return
    if (callState === 'idle') {
      void startPreview()
      webrtcStart(partnerId, partnerName)
    }
  }, [inCall, partnerId, partnerName, callState, startPreview, webrtcStart])

  useEffect(() => {
    if (webrtcLocalRef.current) {
      const stream = callState !== 'idle' ? localStream : null
      webrtcLocalRef.current.srcObject = stream
      if (stream) webrtcLocalRef.current.play().catch(() => {})
    }
  }, [localStream, callState])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream])

  useEffect(() => {
    if (!startedAt) return
    const id = window.setInterval(() => setTimer(formatCallDuration(startedAt)), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  async function handleEnd() {
    hangUp()
    stopMedia()
    if (session?.id) {
      try {
        await endSession({ sessionId: session.id }).unwrap()
        navigate(`/mock-interviews/feedback/${session.id}`)
        return
      } catch {
        /* fall through */
      }
    }
    navigate('/mock-interviews')
  }

  function handleSendChat(e: FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatLines((prev) => [
      ...prev,
      { id: `${Date.now()}`, from: myName, text: chatInput.trim(), at: Date.now() },
    ])
    setChatInput('')
  }

  if (!normalizedCode) {
    return (
      <div className="p-6 text-center text-[#8b8ca8]">
        Invalid session code.{' '}
        <Link to="/mock-interviews" className="text-[#818cf8] hover:underline">
          Back to marketplace
        </Link>
      </div>
    )
  }

  if (isLoading || starting) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-[#8b8ca8] gap-2">
        <Loader2 className="animate-spin" size={20} /> Joining mock interview…
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Session not found</p>
        <Link to="/mock-interviews" className="text-sm text-[#818cf8] hover:underline">
          Back to Mock Interviews
        </Link>
      </div>
    )
  }

  if (session.status === 'COMPLETED') {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-white font-semibold mb-2">Session ended</p>
        <Link
          to={`/mock-interviews/feedback/${session.id}`}
          className="text-sm text-[#818cf8] hover:underline"
        >
          View feedback
        </Link>
      </div>
    )
  }

  const useWebRTCVideo = callState !== 'idle' && localStream

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#0b0c14] -m-6">
      <header className="shrink-0 flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-[#2d2e3e] bg-[#12131c]/95">
        <span className="text-xs font-bold text-emerald-400">LIVE MOCK INTERVIEW</span>
        <span className="text-xs font-mono text-[#818cf8] bg-[#6366f1]/10 px-2 py-0.5 rounded border border-[#6366f1]/30">
          {session.sessionCode}
        </span>
        <span className="text-xs text-[#8b8ca8]">
          {session.request.interviewType}
          {session.request.durationMinutes ? ` · ${session.request.durationMinutes} min` : ''}
        </span>
        <span className="text-xs text-[#8b8ca8] flex items-center gap-1">
          <Clock size={14} /> <span className="font-mono text-white">{timer}</span>
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            disabled={ending}
            onClick={() => void handleEnd()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 text-xs font-semibold hover:bg-red-500/10 disabled:opacity-50"
          >
            <PhoneOff size={14} /> {ending ? 'Ending…' : 'Leave / End'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="w-72 shrink-0 border-r border-[#2d2e3e] flex flex-col bg-[#12131c] p-3 gap-3 overflow-y-auto">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1b26] border border-[#2d2e3e]">
            {useWebRTCVideo ? (
              <video ref={webrtcLocalRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : inCall && streamReady && localCam ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <img src={avatarUrl(myName, 200)} alt="" className="w-full h-full object-cover opacity-90" />
            )}
            <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-emerald-500/90 text-white px-1.5 py-0.5 rounded">
              You
            </span>
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={useWebRTCVideo ? toggleMic : toggleLocalMic}
                className="p-1.5 rounded bg-black/50 text-white"
              >
                {(useWebRTCVideo ? micEnabled : localMic) ? <Mic size={14} /> : <MicOff size={14} />}
              </button>
              <button
                type="button"
                onClick={useWebRTCVideo ? toggleCamera : toggleLocalCam}
                className="p-1.5 rounded bg-black/50 text-white"
              >
                {(useWebRTCVideo ? cameraEnabled : localCam) ? <Video size={14} /> : <VideoOff size={14} />}
              </button>
            </div>
          </div>

          <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1b26] border border-[#2d2e3e]">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={avatarUrl(partnerName, 200)} alt="" className="w-full h-full object-cover opacity-90" />
            )}
            <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-[#6366f1] text-white px-1.5 py-0.5 rounded">
              {partnerName}
            </span>
          </div>

          {mediaError && <p className="text-[10px] text-amber-400">{mediaError}</p>}

          <div className="rounded-lg bg-[#161722] border border-[#2d2e3e] p-3">
            <h4 className="text-xs font-semibold text-white mb-2">Interview details</h4>
            <p className="text-[10px] text-[#8b8ca8]">{session.request.interviewType}</p>
            {session.request.scheduledAt && (
              <p className="text-[10px] text-[#818cf8] mt-1">
                Scheduled session with {partnerName}
              </p>
            )}
          </div>
        </div>

        <div className="flex-[3] flex flex-col min-w-0 border-r border-[#2d2e3e]">
          <div className="px-3 py-2 bg-[#161722] border-b border-[#2d2e3e] flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as EditorLanguage)}
              className="h-8 px-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs"
            >
              {EDITOR_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>{lang.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRunCode}
              className="ml-auto px-3 py-1 rounded-lg border border-[#6366f1]/40 text-[#a5b4fc] text-xs font-semibold hover:bg-[#6366f1]/10"
            >
              Run Code
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={editorCode}
              onChange={(v) => setEditorCode(v ?? '')}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          </div>
          {runOutput && (
            <pre className="shrink-0 max-h-24 overflow-auto px-3 py-2 bg-[#0b0c14] border-t border-[#2d2e3e] text-[10px] text-emerald-300 font-mono">
              {runOutput}
            </pre>
          )}
        </div>

        <div className="w-80 shrink-0 flex flex-col bg-[#12131c]">
          <div className="flex border-b border-[#2d2e3e]">
            {(['chat', 'notes'] as SideTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSideTab(t)}
                className={`flex-1 py-2 text-xs font-semibold capitalize ${
                  sideTab === t ? 'text-white border-b-2 border-[#6366f1]' : 'text-[#8b8ca8]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {sideTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatLines.length === 0 && (
                  <p className="text-xs text-[#8b8ca8] text-center py-6">Start the interview conversation.</p>
                )}
                {chatLines.map((line) => (
                  <div key={line.id} className="text-xs">
                    <span className="font-semibold text-white">{line.from}: </span>
                    <span className="text-[#b4b5c8]">{line.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="p-3 border-t border-[#2d2e3e] flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message…"
                  className="flex-1 h-9 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs"
                />
                <button type="submit" className="p-2 rounded-lg dc-gradient-btn text-white">
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Session notes…"
              className="flex-1 m-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs p-3 resize-none focus:outline-none focus:border-[#6366f1]"
            />
          )}
        </div>
      </div>
    </div>
  )
}
