import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Camera, CameraOff, Circle, Copy, ExternalLink, Loader2, Mic, MicOff,
  MonitorUp, PenLine, PhoneOff, Play, Settings, Share2, UserPlus, Users,
} from 'lucide-react'
import { useAppSelector } from '../../hooks'
import { useGetMyProfileQuery } from '../../api/userApi'
import { useMatchFlow } from '../../hooks/useMatchFlow'
import { useWebRTC } from '../../hooks/useWebRTC'
import { usePairCollaboration } from '../../hooks/usePairCollaboration'
import {
  useEndPairSessionMutation,
  useGetPairSessionQuery,
  useListPairChatQuery,
  useRunPairCodeMutation,
  useSavePairCodeMutation,
  useSavePairNoteMutation,
  useSavePairWhiteboardMutation,
  useSendPairChatMutation,
  type PairSession,
  type RunCodeResult,
  type SessionSummary,
} from '../../api/pairProgrammingApi'
import { formatCallDuration } from '../../lib/formatTime'
import { avatarUrl } from '../../lib/avatar'
import type { PairProgrammingMeta } from '../../store/matchSessionSlice'
import { SessionSummaryModal } from './SessionSummaryModal'
import { canEditPairCode, MONACO_EDITOR_OPTIONS } from '../../lib/pairEditorPermissions'

const LANG_MAP: Record<string, string> = {
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  react: 'javascript',
  nodejs: 'javascript',
}

interface Props {
  sessionId: string
  meta: PairProgrammingMeta
  sessionCode?: string
}

type SideTab = 'chat' | 'notes' | 'whiteboard' | 'resources'
type BottomTab = 'tests' | 'output' | 'console'

export function PairProgrammingWorkspace({ sessionId, meta, sessionCode }: Props) {
  const account = useAppSelector((s) => s.auth.account)
  const { data: profile } = useGetMyProfileQuery()
  const { session: matchSession, endSession, startCall } = useMatchFlow()
  const myUserId = account?.id ?? ''
  const myName = profile?.displayName ?? account?.username ?? 'You'

  const { data: pairSession, refetch } = useGetPairSessionQuery(sessionId, { pollingInterval: 10_000 })
  const [saveCode] = useSavePairCodeMutation()
  const [runCode, { isLoading: running }] = useRunPairCodeMutation()
  const [sendChat] = useSendPairChatMutation()
  const { data: chatMessages = [], refetch: refetchChat } = useListPairChatQuery(sessionId, { pollingInterval: 3000 })
  const [saveNote] = useSavePairNoteMutation()
  const [saveWhiteboard] = useSavePairWhiteboardMutation()
  const [endPair] = useEndPairSessionMutation()

  const [code, setCode] = useState(meta.starterCode)
  const [language, setLanguage] = useState(meta.languageId)
  const [sideTab, setSideTab] = useState<SideTab>('chat')
  const [bottomTab, setBottomTab] = useState<BottomTab>('tests')
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null)
  const [note, setNote] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [remoteTyping, setRemoteTyping] = useState(false)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [selectedTest, setSelectedTest] = useState(0)
  const [copied, setCopied] = useState(false)
  const saveTimer = useRef<number | null>(null)
  const whiteboardRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const strokes = useRef<{ x: number; y: number }[][]>([])

  const monacoLang = LANG_MAP[language] ?? 'java'
  const startedAt = pairSession?.startedAt ? Date.parse(pairSession.startedAt) : Date.now()
  const [timer, setTimer] = useState('00:00:00')

  const {
    callState, localStream, remoteStream, micEnabled, cameraEnabled,
    startCall: webrtcStart, hangUp, toggleMic, toggleCamera, startPreview,
  } = useWebRTC(myUserId, myName)

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (pairSession?.currentCode) setCode(pairSession.currentCode)
    if (pairSession?.noteContent != null) setNote(pairSession.noteContent)
  }, [pairSession?.currentCode, pairSession?.noteContent])

  useEffect(() => {
    const id = window.setInterval(() => setTimer(formatCallDuration(startedAt)), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream ?? null
      if (localStream) localVideoRef.current.play().catch(() => {})
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream ?? null
      if (remoteStream) remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream])

  useEffect(() => {
    const partner = matchSession.partner
    const remote = pairSession?.participants.find((p) => p.userId !== myUserId)
    const remoteId = partner?.id ?? remote?.userId
    const remoteName = partner?.displayName ?? remote?.displayName ?? 'Partner'
    if (remoteId && callState === 'idle') {
      void startPreview()
      webrtcStart(remoteId, remoteName)
      if (partner) startCall()
    }
  }, [matchSession.partner, pairSession?.participants, myUserId, callState, startPreview, webrtcStart, startCall])

  const onCollab = useCallback((msg: Parameters<typeof usePairCollaboration>[3] extends (m: infer M) => void ? M : never) => {
    if (msg.type === 'code-change' && msg.code != null) setCode(msg.code)
    if (msg.type === 'note-update' && msg.noteContent != null) setNote(msg.noteContent)
    if (msg.type === 'typing') setRemoteTyping(Boolean(msg.typing))
  }, [])

  const { publish } = usePairCollaboration(sessionId, myUserId, myName, onCollab)

  const myParticipant = pairSession?.participants.find((p) => p.userId === myUserId)
  const partnerParticipant = pairSession?.participants.find((p) => p.userId !== myUserId)

  const canEdit = useMemo(
    () => canEditPairCode(myParticipant?.role, meta.role, pairSession?.status),
    [myParticipant?.role, meta.role, pairSession?.status]
  )

  const sessionEnded =
    pairSession?.status === 'COMPLETED' || pairSession?.status === 'CANCELLED'

  useEffect(() => {
    console.log('Editor editable:', canEdit, {
      role: myParticipant?.role ?? meta.role,
      status: pairSession?.status,
    })
  }, [canEdit, myParticipant?.role, meta.role, pairSession?.status])

  const persistCode = useCallback((next: string, lang: string) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void saveCode({ sessionId, code: next, language: lang })
    }, 600)
  }, [saveCode, sessionId])

  function handleCodeChange(next: string | undefined) {
    if (next == null || !canEdit) return
    setCode(next)
    persistCode(next, language)
    publish({
      sessionId,
      type: 'code-change',
      fromUserId: myUserId,
      fromName: myName,
      code: next,
      language,
    })
  }

  async function handleRun() {
    setBottomTab('output')
    try {
      const result = await runCode({
        sessionId,
        code,
        language,
        problemId: meta.taskId,
      }).unwrap()
      setRunResult(result)
      setBottomTab('tests')
    } catch {
      setRunResult(null)
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim()) return
    await sendChat({ sessionId, message: chatInput.trim() }).unwrap()
    publish({
      sessionId,
      type: 'chat-message',
      fromUserId: myUserId,
      fromName: myName,
      message: chatInput.trim(),
    })
    setChatInput('')
    void refetchChat()
  }

  async function handleNoteChange(value: string) {
    setNote(value)
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void saveNote({ sessionId, content: value })
      publish({ sessionId, type: 'note-update', fromUserId: myUserId, noteContent: value })
    }, 700)
  }

  async function handleEndSession() {
    hangUp()
    try {
      const result = await endPair({ sessionId }).unwrap()
      setSummary(result)
    } finally {
      if (matchSession.status !== 'idle') {
        await endSession()
      }
    }
  }

  function handleShareLink() {
    const code = sessionCode ?? pairSession?.sessionCode ?? ''
    const url = `${window.location.origin}/pair-session/${code}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const difficultyColor = meta.difficulty === 'easy'
    ? 'text-emerald-400'
    : meta.difficulty === 'medium'
      ? 'text-amber-400'
      : 'text-red-400'

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#0b0c14] -m-6">
      {/* Top session bar */}
      <header className="shrink-0 flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-[#2d2e3e] bg-[#12131c]/95 backdrop-blur-md">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <Circle className="w-2 h-2 fill-emerald-400" /> LIVE
        </span>
        {(sessionCode ?? pairSession?.sessionCode) && (
          <span className="text-xs font-mono text-[#818cf8] bg-[#6366f1]/10 px-2 py-0.5 rounded border border-[#6366f1]/30">
            {sessionCode ?? pairSession?.sessionCode}
          </span>
        )}
        <span className="text-xs text-[#8b8ca8]">Problem: <strong className="text-white">{meta.taskTitle}</strong></span>
        <span className={`text-xs capitalize ${difficultyColor}`}>{meta.difficulty}</span>
        <span className="text-xs text-[#8b8ca8]">Language: <strong className="text-white">{meta.languageLabel}</strong></span>
        <span className="text-xs text-[#8b8ca8]">Driver: <strong className="text-white">{myParticipant?.role === 'driver' ? myName : partnerParticipant?.displayName ?? '—'}</strong></span>
        {partnerParticipant && (
          <span className="text-xs text-[#8b8ca8]">Partner: <strong className="text-[#a5b4fc]">{partnerParticipant.displayName}</strong></span>
        )}
        <span className="text-xs text-[#8b8ca8] flex items-center gap-1"><Users className="w-3 h-3" /> {pairSession?.participants.length ?? 1}</span>
        <span className="text-xs font-mono text-white bg-[#161722] px-2 py-0.5 rounded border border-[#2d2e3e]">{timer}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161722] border border-[#2d2e3e] text-[#c7d2fe] hover:border-[#6366f1]/40">
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </button>
          <button type="button" onClick={handleShareLink} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161722] border border-[#2d2e3e] text-[#c7d2fe] hover:border-[#6366f1]/40">
            <Share2 className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Share Link'}
          </button>
          <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8]">
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
          <button type="button" onClick={() => void handleEndSession()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/40 text-red-300 hover:bg-red-500/10">
            End Session
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Editor column ~70% */}
        <div className="flex-[7] flex flex-col min-w-0 border-r border-[#2d2e3e]">
          <div className="flex items-center justify-between px-3 py-2 bg-[#161722] border-b border-[#2d2e3e]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#818cf8] font-semibold">Solution.{monacoLang === 'python' ? 'py' : monacoLang === 'java' ? 'java' : 'js'}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs bg-[#0b0c14] border border-[#2d2e3e] rounded px-2 py-1 text-white"
              >
                {['java', 'javascript', 'typescript', 'python'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={running || sessionEnded}
              onClick={() => void handleRun()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold dc-gradient-btn text-white disabled:opacity-50"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run Code
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                ...MONACO_EDITOR_OPTIONS,
                readOnly: !canEdit,
              }}
            />
          </div>

          {/* Bottom panel */}
          <div className="h-48 shrink-0 border-t border-[#2d2e3e] bg-[#12131c] flex flex-col">
            <div className="flex gap-1 px-2 pt-1 border-b border-[#2d2e3e]">
              {(['tests', 'output', 'console'] as BottomTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBottomTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-t-lg ${
                    bottomTab === tab ? 'bg-[#161722] text-white border border-b-0 border-[#2d2e3e]' : 'text-[#8b8ca8]'
                  }`}
                >
                  {tab === 'tests' ? 'Test Cases' : tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-3 text-xs font-mono">
              {bottomTab === 'tests' && runResult && (
                <div className="flex gap-3 h-full">
                  <div className="w-36 shrink-0 space-y-1">
                    {runResult.testCases.map((tc, i) => (
                      <button
                        key={tc.name}
                        type="button"
                        onClick={() => setSelectedTest(i)}
                        className={`w-full text-left px-2 py-1 rounded ${selectedTest === i ? 'bg-[#6366f1]/20 text-white' : 'text-[#8b8ca8]'} ${tc.passed ? 'border-l-2 border-emerald-400' : 'border-l-2 border-red-400'}`}
                      >
                        {tc.name}
                      </button>
                    ))}
                  </div>
                  {runResult.testCases[selectedTest] && (
                    <div className="flex-1 space-y-2 text-[#b4b5c8]">
                      <p><span className="text-[#5c5d72]">Input:</span> {runResult.testCases[selectedTest].input}</p>
                      <p><span className="text-[#5c5d72]">Expected:</span> {runResult.testCases[selectedTest].expectedOutput}</p>
                      <p><span className="text-[#5c5d72]">Your Output:</span> {runResult.testCases[selectedTest].actualOutput || '—'}</p>
                      <p className={runResult.testCases[selectedTest].passed ? 'text-emerald-400' : 'text-red-400'}>
                        {runResult.testCases[selectedTest].passed ? 'Passed' : 'Failed'} · {runResult.testCases[selectedTest].executionMs}ms
                      </p>
                    </div>
                  )}
                </div>
              )}
              {bottomTab === 'tests' && !runResult && (
                <p className="text-[#8b8ca8]">Run code to see test case results.</p>
              )}
              {bottomTab === 'output' && (
                <pre className="whitespace-pre-wrap text-emerald-400">{runResult?.stdout || 'No output yet.'}</pre>
              )}
              {bottomTab === 'console' && (
                <pre className="whitespace-pre-wrap text-amber-300">{runResult?.stderr || 'Console clear.'}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar ~30% */}
        <aside className="flex-[3] min-w-[280px] max-w-[420px] flex flex-col bg-[#12131c]">
          {/* Video participants */}
          <div className="p-3 space-y-2 border-b border-[#2d2e3e]">
            <ParticipantCard
              label="You"
              name={myName}
              role={myParticipant?.role ?? meta.role}
              videoRef={localVideoRef}
              streamReady={Boolean(localStream)}
              cameraEnabled={cameraEnabled}
            />
            <ParticipantCard
              label="Partner"
              name={partnerParticipant?.displayName ?? 'Waiting…'}
              role={partnerParticipant?.role ?? 'navigator'}
              videoRef={remoteVideoRef}
              streamReady={Boolean(remoteStream)}
              cameraEnabled
              avatarOnly={!remoteStream}
              avatarName={partnerParticipant?.displayName ?? 'Partner'}
            />
            <div className="grid grid-cols-5 gap-1 pt-1">
              <MediaBtn active={micEnabled} onClick={toggleMic} icon={micEnabled ? Mic : MicOff} label="Mic" />
              <MediaBtn active={cameraEnabled} onClick={toggleCamera} icon={cameraEnabled ? Camera : CameraOff} label="Cam" />
              <MediaBtn active={false} onClick={() => {}} icon={MonitorUp} label="Share" />
              <MediaBtn active={sideTab === 'whiteboard'} onClick={() => setSideTab('whiteboard')} icon={PenLine} label="Board" />
              <button type="button" onClick={() => void handleEndSession()} className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-red-500/15 text-red-300 text-[9px] font-bold">
                <PhoneOff className="w-3.5 h-3.5" /> Leave
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2d2e3e]">
            {(['chat', 'notes', 'whiteboard', 'resources'] as SideTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSideTab(tab)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide ${
                  sideTab === tab ? 'text-[#a5b4fc] border-b-2 border-[#6366f1]' : 'text-[#5c5d72]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {sideTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.map((m) => (
                    <div key={m.id} className={`text-xs ${m.senderId === myUserId ? 'text-right' : ''}`}>
                      <p className="text-[10px] text-[#5c5d72] mb-0.5">{m.senderName ?? 'User'}</p>
                      <p className={`inline-block px-2.5 py-1.5 rounded-xl ${m.senderId === myUserId ? 'bg-[#6366f1]/25 text-white' : 'bg-[#161722] text-[#d1d2e0]'}`}>
                        {m.message}
                      </p>
                    </div>
                  ))}
                  {remoteTyping && <p className="text-[10px] text-[#818cf8]">Partner is typing…</p>}
                </div>
                <div className="p-2 border-t border-[#2d2e3e] flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value)
                      publish({ sessionId, type: 'typing', fromUserId: myUserId, typing: true })
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSendChat()}
                    placeholder="Type a message…"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-xs text-white"
                  />
                  <button type="button" onClick={() => void handleSendChat()} className="px-3 py-2 rounded-lg dc-gradient-btn text-white text-xs font-bold">Send</button>
                </div>
              </>
            )}

            {sideTab === 'notes' && (
              <textarea
                value={note}
                onChange={(e) => void handleNoteChange(e.target.value)}
                placeholder="Shared session notes…"
                className="flex-1 m-2 p-3 rounded-xl bg-[#0b0c14] border border-[#2d2e3e] text-xs text-[#d1d2e0] resize-none focus:outline-none focus:border-[#6366f1]/40"
              />
            )}

            {sideTab === 'whiteboard' && (
              <WhiteboardPanel
                canvasRef={whiteboardRef}
                strokes={strokes}
                drawing={drawing}
                onUpdate={(json) => {
                  void saveWhiteboard({ sessionId, jsonData: json })
                  publish({ sessionId, type: 'whiteboard-update', fromUserId: myUserId, whiteboardJson: json })
                }}
              />
            )}

            {sideTab === 'resources' && (
              <ResourcesPanel session={pairSession} meta={meta} />
            )}
          </div>
        </aside>
      </div>

      {summary && <SessionSummaryModal summary={summary} onClose={() => setSummary(null)} />}
    </div>
  )
}

function ParticipantCard({
  label, name, role, videoRef, streamReady, cameraEnabled, avatarOnly, avatarName,
}: {
  label: string
  name: string
  role: string
  videoRef?: React.RefObject<HTMLVideoElement | null>
  streamReady?: boolean
  cameraEnabled?: boolean
  avatarOnly?: boolean
  avatarName?: string
}) {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-[#161722] border border-[#2d2e3e]">
      {!avatarOnly && streamReady && cameraEnabled && videoRef ? (
        <video ref={videoRef} autoPlay playsInline muted={label === 'You'} className="w-full h-full object-cover" />
      ) : (
        <img src={avatarUrl(avatarName ?? name, 200)} alt="" className="w-full h-full object-cover opacity-90" />
      )}
      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#6366f1]/90 text-white">{label}</span>
      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-xs font-semibold text-white truncate">{name}</p>
        <p className="text-[10px] text-white/70 capitalize">{role}</p>
      </div>
    </div>
  )
}

function MediaBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Mic; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold ${
        active ? 'bg-[#6366f1]/20 text-[#c7d2fe]' : 'bg-[#161722] text-[#8b8ca8]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )
}

function WhiteboardPanel({
  canvasRef, strokes, drawing, onUpdate,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  strokes: React.MutableRefObject<{ x: number; y: number }[][]>
  drawing: React.MutableRefObject<boolean>
  onUpdate: (json: string) => void
}) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#818cf8'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    function drawAll() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const stroke of strokes.current) {
        if (stroke.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(stroke[0].x, stroke[0].y)
        for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
        ctx.stroke()
      }
    }

    function pos(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function onDown(e: MouseEvent) {
      drawing.current = true
      strokes.current.push([pos(e)])
    }
    function onMove(e: MouseEvent) {
      if (!drawing.current) return
      strokes.current[strokes.current.length - 1].push(pos(e))
      drawAll()
    }
    function onUp() {
      if (!drawing.current) return
      drawing.current = false
      onUpdate(JSON.stringify(strokes.current))
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    drawAll()
    return () => {
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [canvasRef, drawing, onUpdate, strokes])

  return (
    <div className="flex-1 p-2">
      <canvas ref={canvasRef} width={360} height={240} className="w-full h-full rounded-xl bg-[#0b0c14] border border-[#2d2e3e] cursor-crosshair" />
    </div>
  )
}

function ResourcesPanel({ session, meta }: { session?: PairSession; meta: PairProgrammingMeta }) {
  const resources = session?.resources ?? []
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <section>
        <h4 className="font-bold text-white mb-1">Problem Statement</h4>
        <p className="text-[#8b8ca8] leading-relaxed">{meta.taskDescription}</p>
      </section>
      {(session?.constraints?.length ?? 0) > 0 && (
        <section>
          <h4 className="font-bold text-white mb-1">Constraints</h4>
          <ul className="list-disc pl-4 text-[#8b8ca8] space-y-0.5">
            {session!.constraints.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </section>
      )}
      {(session?.hints?.length ?? 0) > 0 && (
        <section>
          <h4 className="font-bold text-white mb-1">Hints</h4>
          <ul className="list-disc pl-4 text-[#8b8ca8] space-y-0.5">
            {session!.hints.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </section>
      )}
      {resources.length > 0 && (
        <section>
          <h4 className="font-bold text-white mb-1">Documentation</h4>
          <ul className="space-y-1">
            {resources.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#818cf8] hover:underline">
                  {r.title} <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
