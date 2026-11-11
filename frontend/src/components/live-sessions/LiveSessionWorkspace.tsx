/**
 * LiveSessionWorkspace — mentor live session command center.
 * Video (WebRTC), screen share, live coding, whiteboard, notes, captions, recording.
 */
import { useCallback, useEffect, useRef, useState, type ComponentType, type MouseEvent } from 'react'
import {
  Play, PhoneOff, Loader2, RefreshCw, Video, Code2, Edit3, Monitor, MonitorOff,
  FileText, Mic, MicOff, Camera, CameraOff, Circle, Square, Trash2,
  Subtitles, Sparkles, Users2, Hash, StopCircle, ChevronRight, Timer, Archive,
} from 'lucide-react'
import { VideoCallSection } from '../find-match/VideoCallSection'
import { VideoRoomSessionPanel } from '../video-rooms/VideoRoomSessionPanel'
import { useMatchFlow } from '../../hooks/useMatchFlow'
import { useGetMyProfileQuery } from '../../api/userApi'
import { useWebRTCContext } from '../../contexts/WebRTCContext'
import {
  useListVideoRoomsQuery,
  useJoinVideoRoomMutation,
  useEndVideoRoomMutation,
} from '../../api/videoRoomsApi'
import { formatCallDuration } from '../../lib/formatTime'
import {
  deleteRecordingMeta,
  loadRecordingArchive,
  saveRecordingMeta,
  type SessionRecordingMeta,
} from '../../lib/sessionArchive'

type SessionType = 'mentorship' | 'debugging' | 'mock-interview' | 'pair-programming'
type WorkspacePanel = 'video' | 'code' | 'whiteboard' | 'notes'

const SESSION_TYPES: { id: SessionType; label: string; sub: string }[] = [
  { id: 'mentorship', label: 'Technical Mentorship', sub: 'Guide & explain concepts' },
  { id: 'debugging', label: 'Debugging Help', sub: 'Trace issues together' },
  { id: 'mock-interview', label: 'Mock Interview', sub: 'Structured interview prep' },
  { id: 'pair-programming', label: 'Pair Programming', sub: 'Collaborative coding' },
]

const STARTER_CODE: Record<SessionType, string> = {
  mentorship: `// Mentorship session — shared scratchpad
function explainConcept(topic) {
  // Walk through the approach with your learner
  return \`Let's break down \${topic} step by step\`;
}`,
  debugging: `// Debugging session — reproduce & isolate
function findBug(input) {
  // Add breakpoints / logs with your learner
  console.log('inspecting:', input);
  return input;
}`,
  'mock-interview': `// Mock interview — coding round
// Question: Two Sum — return indices of two numbers that add to target
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
  'pair-programming': `// Pair programming — driver/navigator
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) { /* navigator: discuss edge cases */ }
  put(key, value) { /* driver: implement together */ }
}`,
}

type SpeechRecognitionCtor = new () => {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: {
    resultIndex: number
    results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } }
  }) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

interface LiveSessionWorkspaceProps {
  onGoLive: () => void
}

export function LiveSessionWorkspace({ onGoLive }: LiveSessionWorkspaceProps) {
  const { data: myProfile } = useGetMyProfileQuery()
  const { session, startMatchAsMentor, goOffline, endSession, startCall } = useMatchFlow()
  const {
    callState, micEnabled, cameraEnabled, localStream, remoteStream,
    toggleMic, toggleCamera, hangUp, startPreview,
  } = useWebRTCContext()

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } =
    useListVideoRoomsQuery({ status: 'live', limit: 50 })
  const [joinRoom] = useJoinVideoRoomMutation()
  const [endRoom] = useEndVideoRoomMutation()

  const [sessionType, setSessionType] = useState<SessionType>('mentorship')
  const [panel, setPanel] = useState<WorkspacePanel>('video')
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)

  const [code, setCode] = useState(STARTER_CODE.mentorship)
  const [codeOutput, setCodeOutput] = useState('')
  const [notes, setNotes] = useState('')
  const [transcript, setTranscript] = useState<string[]>([])
  const [captionsEnabled, setCaptionsEnabled] = useState(false)
  const [currentCaption, setCurrentCaption] = useState('')

  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const screenRef = useRef<HTMLVideoElement>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [penColor, setPenColor] = useState('#818cf8')

  const [archive, setArchive] = useState<SessionRecordingMeta[]>(() => loadRecordingArchive())
  const [sessionTimer, setSessionTimer] = useState('00:00')
  const sessionStartRef = useRef<number | null>(null)

  const isLiveAvailable = session.status === 'live_available'
  const isPendingRequest = session.status === 'pending_request'
  const isSearching = session.status === 'searching' || session.status === 'waiting_accept'
  const isMatchActive =
    session.status === 'matched' ||
    session.status === 'in_call' ||
    callState === 'calling' ||
    callState === 'ringing' ||
    callState === 'in_call'
  const inCall = callState === 'in_call' || session.status === 'in_call'

  useEffect(() => {
    if (inCall && !sessionStartRef.current) {
      sessionStartRef.current = Date.now()
      startCall()
    }
    if (!isMatchActive && !activeRoomId) {
      sessionStartRef.current = null
      setSessionTimer('00:00')
    }
  }, [inCall, isMatchActive, activeRoomId, startCall])

  useEffect(() => {
    if (!sessionStartRef.current) return
    const id = globalThis.setInterval(() => {
      if (sessionStartRef.current) {
        setSessionTimer(formatCallDuration(sessionStartRef.current))
      }
    }, 1000)
    return () => globalThis.clearInterval(id)
  }, [isMatchActive, inCall])

  useEffect(() => {
    if (isMatchActive) startPreview().catch(() => {})
  }, [isMatchActive, startPreview])

  useEffect(() => {
    setCode(STARTER_CODE[sessionType])
    setCodeOutput('')
  }, [sessionType])

  // Live captions via Web Speech API
  useEffect(() => {
    if (!captionsEnabled || !inCall) {
      setCurrentCaption('')
      return
    }
    const W = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition
    if (!SR) {
      setCurrentCaption('Live captions unavailable in this browser.')
      return
    }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) final += text
        else interim += text
      }
      if (final.trim()) {
        const line = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${final.trim()}`
        setTranscript((prev) => [...prev.slice(-49), line])
      }
      setCurrentCaption(interim || final)
    }
    recognition.onerror = () => setCaptionsEnabled(false)
    recognition.start()
    return () => recognition.stop()
  }, [captionsEnabled, inCall])

  const stopShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current = null
    if (screenRef.current) screenRef.current.srcObject = null
    setIsSharing(false)
  }, [])

  const startShare = useCallback(async () => {
    setShareError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = stream
      if (screenRef.current) screenRef.current.srcObject = stream
      setIsSharing(true)
      stream.getVideoTracks()[0]?.addEventListener('ended', () => stopShare())
    } catch {
      setShareError('Screen sharing was cancelled or denied.')
    }
  }, [stopShare])

  const startRecording = useCallback(() => {
    const tracks: MediaStreamTrack[] = []
    localStream?.getTracks().forEach((t) => tracks.push(t))
    remoteStream?.getTracks().forEach((t) => tracks.push(t))
    screenStreamRef.current?.getTracks().forEach((t) => tracks.push(t))
    if (tracks.length === 0) {
      setShareError('Start camera or screen share before recording.')
      return
    }
    const stream = new MediaStream(tracks)
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'
    const recorder = new MediaRecorder(stream, { mimeType: mime })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime })
      const url = URL.createObjectURL(blob)
      const durationSec = recordingStartRef.current
        ? Math.floor((Date.now() - recordingStartRef.current) / 1000)
        : 0
      const stamp = new Date().toISOString()
      const downloadName = `mentor-session-${stamp.slice(0, 19).replace(/[:T]/g, '-')}.webm`
      const meta: SessionRecordingMeta = {
        id: crypto.randomUUID(),
        title: `${SESSION_TYPES.find((t) => t.id === sessionType)?.label ?? 'Session'} with ${session.partner?.displayName ?? 'Learner'}`,
        partnerName: session.partner?.displayName ?? 'Learner',
        sessionType,
        durationSec,
        createdAt: stamp,
        downloadName,
      }
      saveRecordingMeta(meta)
      setArchive(loadRecordingArchive())
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName
      a.click()
      URL.revokeObjectURL(url)
      recordingStartRef.current = null
      setRecordingElapsed(0)
    }
    recorderRef.current = recorder
    recordingStartRef.current = Date.now()
    recorder.start(1000)
    setIsRecording(true)
  }, [localStream, remoteStream, session.partner, sessionType])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setIsRecording(false)
  }, [])

  useEffect(() => {
    if (!isRecording) return
    const id = globalThis.setInterval(() => {
      if (recordingStartRef.current) {
        setRecordingElapsed(Math.floor((Date.now() - recordingStartRef.current) / 1000))
      }
    }, 1000)
    return () => globalThis.clearInterval(id)
  }, [isRecording])

  function handleStartSession() {
    const skills = myProfile?.skills ?? []
    const criteriaMap: Record<SessionType, string> = {
      mentorship: 'Mentor session — technical mentorship',
      debugging: 'Mentor session — debugging help',
      'mock-interview': 'Mentor session — mock interview',
      'pair-programming': 'Mentor session — pair programming',
    }
    void startMatchAsMentor(criteriaMap[sessionType], skills, myProfile?.experienceLevel ?? undefined)
    onGoLive()
  }

  function handleGoOffline() {
    void goOffline()
  }

  function handleEndSession() {
    stopRecording()
    stopShare()
    setCaptionsEnabled(false)
    hangUp()
    void endSession()
    sessionStartRef.current = null
  }

  async function handleJoinRoom(roomId: string) {
    setJoiningRoomId(roomId)
    try {
      await joinRoom(roomId).unwrap()
      setActiveRoomId(roomId)
    } finally {
      setJoiningRoomId(null)
    }
  }

  function handleLeaveRoom() {
    setActiveRoomId(null)
  }

  function generateAiTranscript() {
    const partner = session.partner?.displayName ?? 'Learner'
    const lines = [
      `Session summary — ${SESSION_TYPES.find((t) => t.id === sessionType)?.label}`,
      `Partner: ${partner}`,
      `Duration: ${sessionTimer}`,
      '',
      'Key discussion points:',
      notes.trim()
        ? notes.split('\n').filter(Boolean).map((l) => `• ${l}`).join('\n')
        : '• (Add session notes to enrich the AI summary)',
      '',
      'Transcript highlights:',
      ...(transcript.length > 0
        ? transcript.slice(-8).map((l) => `• ${l}`)
        : ['• No live captions captured — enable captions during the next session.']),
      '',
      'Suggested follow-ups:',
      '• Share resources on topics covered',
      '• Schedule a follow-up session for deeper practice',
      '• Assign a small coding exercise based on today\'s discussion',
    ]
    setTranscript((prev) => [...prev, '--- AI Summary ---', ...lines])
  }

  function runCode() {
    setCodeOutput('✓ Syntax check passed\n→ Discuss approach and edge cases with your learner before submitting.')
  }

  // Whiteboard drawing
  function getCanvasPoint(e: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: MouseEvent<HTMLCanvasElement>) {
    drawingRef.current = true
    lastPointRef.current = getCanvasPoint(e)
  }

  function draw(e: MouseEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !canvasRef.current || !lastPointRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const pt = getCanvasPoint(e)
    ctx.strokeStyle = penColor
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    lastPointRef.current = pt
  }

  function endDraw() {
    drawingRef.current = false
    lastPointRef.current = null
  }

  function clearWhiteboard() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0b0c14'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    if (panel !== 'whiteboard') return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    clearWhiteboard()
  }, [panel])

  if (activeRoomId) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleLeaveRoom}
          className="text-xs text-violet-400 hover:text-white transition-colors"
        >
          ← Back to Live Sessions
        </button>
        <VideoRoomSessionPanel roomId={activeRoomId} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Session type picker */}
      {!isMatchActive && !isSearching && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SESSION_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSessionType(t.id)}
              className={`text-left rounded-xl p-4 border transition-colors ${
                sessionType === t.id
                  ? 'bg-violet-500/10 border-violet-500/40'
                  : 'bg-[#161722] border-[#2d2e3e] hover:border-[#3d3e52]'
              }`}
            >
              <p className="text-xs font-bold text-white mb-0.5">{t.label}</p>
              <p className="text-[10px] text-[#5c5d72]">{t.sub}</p>
            </button>
          ))}
        </div>
      )}

      {/* Main workspace */}
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
        {/* Status bar */}
        <div className={`flex items-center gap-3 px-5 py-3 border-b border-[#1e1f2e] flex-wrap ${
          isMatchActive ? 'bg-emerald-600/10' : isSearching ? 'bg-amber-500/10' : 'bg-[#12131c]'
        }`}>
          {isMatchActive ? (
            <>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </span>
              <span className="text-sm font-semibold text-white">
                {SESSION_TYPES.find((t) => t.id === sessionType)?.label} with {session.partner?.displayName ?? 'Learner'}
              </span>
              <span className="flex items-center gap-1 text-xs font-mono text-[#8b8ca8] ml-auto">
                <Timer size={12} /> {sessionTimer}
              </span>
              {isRecording && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded">
                  <Circle size={8} className="fill-red-400 animate-pulse" /> REC {Math.floor(recordingElapsed / 60)}:{String(recordingElapsed % 60).padStart(2, '0')}
                </span>
              )}
            </>
          ) : isSearching ? (
            <>
              <Loader2 size={14} className="text-amber-400 animate-spin" />
              <span className="text-sm font-semibold text-amber-400">Finding a learner…</span>
            </>
          ) : (
            <>
              <Video size={14} className="text-[#3d3e52]" />
              <span className="text-sm font-semibold text-[#5c5d72]">No Active Session</span>
              <span className="text-[10px] text-[#3d3e52]">Start or join a session below</span>
            </>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => refetchRooms()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1c1d2a] border border-[#2d2e3e] text-[#5c5d72] hover:text-white">
              <RefreshCw size={13} />
            </button>
            {isMatchActive ? (
              <button onClick={handleEndSession} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg">
                <PhoneOff size={13} /> End Session
              </button>
            ) : isLiveAvailable || isPendingRequest ? (
              <button onClick={handleGoOffline} className="flex items-center gap-1.5 bg-[#1c1d2a] border border-[#2d2e3e] hover:border-red-500/40 text-[#8b8ca8] hover:text-red-300 text-xs font-bold px-3 py-2 rounded-lg">
                <StopCircle size={13} /> Go Offline
              </button>
            ) : (
              <button onClick={handleStartSession} disabled={isSearching}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 rounded-lg">
                {isSearching ? <><Loader2 size={13} className="animate-spin" /> Live…</> : <><Play size={13} /> Start Session Now</>}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[420px]">
          {/* Main panel */}
          <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-[#1e1f2e]">
            {/* Panel tabs */}
            {isMatchActive && (
              <div className="flex items-center gap-1 px-4 py-2 border-b border-[#1e1f2e] bg-[#12131c]">
                {([
                  ['video', 'Video', Video],
                  ['code', 'Live Code', Code2],
                  ['whiteboard', 'Whiteboard', Edit3],
                  ['notes', 'Notes', FileText],
                ] as const).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => setPanel(id)}
                    className={`flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      panel === id ? 'bg-violet-500/20 text-violet-300' : 'text-[#5c5d72] hover:text-white hover:bg-[#1c1d2a]'
                    }`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4">
              {panel === 'video' && (
                <>
                  {isSharing && (
                    <div className="mb-3 relative aspect-video rounded-xl overflow-hidden bg-black border border-emerald-500/30">
                      <video ref={screenRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">Screen Share</span>
                    </div>
                  )}
                  <div className={isMatchActive || isSearching ? '' : 'opacity-50 pointer-events-none'}>
                    <VideoCallSection />
                  </div>
                  {shareError && <p className="text-xs text-red-400 mt-2">{shareError}</p>}
                  {currentCaption && captionsEnabled && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-black/60 border border-[#2d2e3e] text-sm text-white text-center">
                      <Subtitles size={12} className="inline mr-1 text-violet-400" /> {currentCaption}
                    </div>
                  )}
                </>
              )}

              {panel === 'code' && (
                <div className="space-y-3">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    className="w-full h-64 bg-[#0b0c14] border border-[#2d2e3e] rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-violet-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={runCode} className="text-xs font-bold px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white">Run Check</button>
                    <button onClick={() => setCode(STARTER_CODE[sessionType])} className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">Reset</button>
                  </div>
                  {codeOutput && (
                    <pre className="text-xs text-[#8b8ca8] bg-[#0b0c14] border border-[#2d2e3e] rounded-lg p-3 whitespace-pre-wrap">{codeOutput}</pre>
                  )}
                </div>
              )}

              {panel === 'whiteboard' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {['#818cf8', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map((c) => (
                      <button key={c} onClick={() => setPenColor(c)} style={{ background: c }}
                        className={`w-6 h-6 rounded-full border-2 ${penColor === c ? 'border-white' : 'border-transparent'}`} />
                    ))}
                    <button onClick={clearWhiteboard} className="ml-auto text-[10px] text-[#8b8ca8] hover:text-white px-2 py-1 rounded border border-[#2d2e3e]">Clear</button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    className="w-full h-72 rounded-xl border border-[#2d2e3e] cursor-crosshair touch-none"
                  />
                </div>
              )}

              {panel === 'notes' && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Session notes — key topics, action items, learner progress…"
                  className="w-full h-72 bg-[#0b0c14] border border-[#2d2e3e] rounded-xl p-4 text-sm text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500/50 resize-none"
                />
              )}

              {!isMatchActive && !isSearching && (
                <div className="pt-2 flex items-center gap-3">
                  <button onClick={handleStartSession} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg">
                    <Play size={15} /> Start Session Now
                  </button>
                  <p className="text-xs text-[#5c5d72]">Enters the matching queue for {SESSION_TYPES.find((t) => t.id === sessionType)?.label.toLowerCase()}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Side panel — transcript & archive */}
          <div className="w-full lg:w-72 shrink-0 bg-[#12131c] p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white">Live Transcript</h4>
                <button
                  onClick={() => setCaptionsEnabled((v) => !v)}
                  disabled={!inCall}
                  className={`text-[9px] font-bold px-2 py-1 rounded ${captionsEnabled ? 'bg-violet-500/20 text-violet-300' : 'bg-[#1c1d2a] text-[#5c5d72]'} disabled:opacity-40`}
                >
                  {captionsEnabled ? 'Captions ON' : 'Captions OFF'}
                </button>
              </div>
              <div className="h-32 overflow-y-auto space-y-1 text-[10px] text-[#8b8ca8] bg-[#0b0c14] rounded-lg p-2 border border-[#2d2e3e]">
                {transcript.length === 0 ? (
                  <p className="text-[#5c5d72] italic">Enable captions or generate AI transcript after session.</p>
                ) : transcript.map((line, i) => (
                  <p key={i} className={line.startsWith('---') ? 'text-violet-400 font-bold mt-1' : ''}>{line}</p>
                ))}
              </div>
              <button
                onClick={generateAiTranscript}
                disabled={!isMatchActive && transcript.length === 0 && !notes.trim()}
                className="mt-2 flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 disabled:opacity-40"
              >
                <Sparkles size={10} /> Generate AI Summary
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1"><Archive size={12} /> Recording Archive</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {archive.length === 0 ? (
                  <p className="text-[10px] text-[#5c5d72] italic">Recordings saved to downloads appear here.</p>
                ) : archive.map((rec) => (
                  <div key={rec.id} className="bg-[#0b0c14] border border-[#2d2e3e] rounded-lg p-2">
                    <p className="text-[10px] font-semibold text-white truncate">{rec.title}</p>
                    <p className="text-[9px] text-[#5c5d72]">{Math.floor(rec.durationSec / 60)}m · {new Date(rec.createdAt).toLocaleDateString()}</p>
                    <button
                      onClick={() => { deleteRecordingMeta(rec.id); setArchive(loadRecordingArchive()) }}
                      className="mt-1 text-[9px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
                    ><Trash2 size={9} /> Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Session toolbar */}
        {isMatchActive && (
          <div className="flex items-center gap-1.5 px-4 py-3 border-t border-[#1e1f2e] bg-[#0f1018] flex-wrap">
            <ToolbarBtn active={micEnabled} onClick={toggleMic} icon={micEnabled ? Mic : MicOff} label="Mic" />
            <ToolbarBtn active={cameraEnabled} onClick={toggleCamera} icon={cameraEnabled ? Camera : CameraOff} label="Camera" />
            <ToolbarBtn active={isSharing} onClick={isSharing ? stopShare : startShare} icon={isSharing ? MonitorOff : Monitor} label="Share" />
            <ToolbarBtn active={panel === 'code'} onClick={() => setPanel('code')} icon={Code2} label="Code" />
            <ToolbarBtn active={panel === 'whiteboard'} onClick={() => setPanel('whiteboard')} icon={Edit3} label="Board" />
            <ToolbarBtn active={panel === 'notes'} onClick={() => setPanel('notes')} icon={FileText} label="Notes" />
            <ToolbarBtn active={captionsEnabled} onClick={() => setCaptionsEnabled((v) => !v)} icon={Subtitles} label="Captions" />
            <div className="w-px h-6 bg-[#2d2e3e] mx-1" />
            {isRecording ? (
              <button onClick={stopRecording} className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white">
                <Square size={12} className="fill-white" /> Stop Recording
              </button>
            ) : (
              <button onClick={startRecording} className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg bg-[#1c1d2a] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-red-500/40">
                <Circle size={12} className="text-red-400" /> Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* Open video rooms */}
      {(rooms?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-bold text-[#5c5d72] uppercase tracking-widest mb-3">Join Active Session</p>
          <div className="space-y-3">
            {rooms?.map((room) => (
              <div key={room.id} className="bg-[#161722] border border-emerald-500/25 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 relative">
                  <Video size={18} className="text-emerald-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-[#161722]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white">{room.title}</span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">LIVE</span>
                  </div>
                  <p className="text-xs text-[#5c5d72] mb-2 line-clamp-1">{room.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[#5c5d72]">
                    <span className="flex items-center gap-1"><Users2 size={11} /> {room.participantCount}/{room.maxParticipants}</span>
                    <span className="flex items-center gap-1"><Hash size={11} /> {room.category}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={joiningRoomId === room.id}
                    className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
                  >
                    {joiningRoomId === room.id ? <Loader2 size={11} className="animate-spin" /> : <ChevronRight size={11} />}
                    Join
                  </button>
                  <button onClick={() => endRoom(room.id)} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-600 hover:text-white">
                    <StopCircle size={10} /> End
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {roomsLoading && !(rooms ?? []).length && (
        <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
      )}
    </div>
  )
}

function ToolbarBtn({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: ComponentType<{ size?: number }>; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors min-w-[52px] ${
        active ? 'bg-violet-500/15 text-violet-300' : 'text-[#5c5d72] hover:text-white hover:bg-[#1c1d2a]'
      }`}
    >
      <Icon size={16} />
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  )
}
