import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bot, Clock, Loader2, Mic, MicOff, Pause, Play, Square, Volume2 } from 'lucide-react'
import {
  useEndAiInterviewMutation,
  useGetAiInterviewSessionQuery,
  useSubmitAiAnswerMutation,
  type AiInterviewSession,
} from '../../api/aiInterviewApi'
import { InterviewResult } from './InterviewResult'

const ROBOT_IMAGE = '/assets/mock-interview/ai-robot.png'
const MAX_QUESTIONS = 10
const SILENCE_MS = 10000
const AUTO_LISTEN_DELAY_MS = 1000

type InterviewState =
  | 'INTRO_SPEAKING'
  | 'QUESTION_SPEAKING'
  | 'WAITING_FOR_ANSWER'
  | 'LISTENING'
  | 'PROCESSING_ANSWER'
  | 'GENERATING_NEXT_QUESTION'
  | 'FINISHED'
  | 'PAUSED'

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

function speakText(text: string): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return Promise.resolve()

  const maxMs = Math.min(30000, Math.max(8000, trimmed.length * 60))

  return new Promise((resolve) => {
    console.log('AI speaking started')
    const synth = window.speechSynthesis
    synth.cancel()

    let settled = false
    const finish = (reason: string) => {
      if (settled) return
      settled = true
      window.clearInterval(resumeTicker)
      window.clearTimeout(hardTimeout)
      console.log('AI speaking ended', reason)
      resolve()
    }

    const utter = new SpeechSynthesisUtterance(trimmed)
    utter.rate = 0.95
    utter.lang = 'en-US'
    const voices = synth.getVoices()
    const voice =
      voices.find((v) => v.lang.startsWith('en') && v.localService) ??
      voices.find((v) => v.lang.startsWith('en'))
    if (voice) utter.voice = voice

    utter.onend = () => finish('onend')
    utter.onerror = () => finish('onerror')

    const hardTimeout = window.setTimeout(() => {
      synth.cancel()
      finish('timeout')
    }, maxMs)

    // Chrome often pauses TTS mid-utterance; keep it alive
    const resumeTicker = window.setInterval(() => {
      if (!settled && synth.paused) synth.resume()
    }, 250)

    synth.speak(utter)
    window.setTimeout(() => {
      if (!settled) synth.resume()
    }, 120)
  })
}

function extractQuestion(
  data: AiInterviewSession | null | undefined
): { questionId: string; question: string; questionOrder: number } | null {
  if (!data) return null
  const cq = data.currentQuestion
  if (!cq?.question) return null
  const questionId = cq.questionId ?? (cq as { id?: string }).id
  if (!questionId) return null
  return {
    questionId: String(questionId),
    question: cleanDisplayQuestion(cq.question),
    questionOrder: cq.questionOrder ?? data.questionNumber ?? 1,
  }
}

function cleanDisplayQuestion(text: string): string {
  return text.replace(/\s*\[\d+\]\s*$/, '').trim()
}

/** Speak but never block the interview flow longer than maxMs */
async function speakWithCap(text: string, maxMs = 12000): Promise<void> {
  await Promise.race([speakText(text), delay(maxMs)])
  window.speechSynthesis.cancel()
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function stateLabel(state: InterviewState): string {
  switch (state) {
    case 'INTRO_SPEAKING':
    case 'QUESTION_SPEAKING':
      return 'AI is speaking…'
    case 'WAITING_FOR_ANSWER':
      return 'Get ready to answer…'
    case 'LISTENING':
      return 'Listening…'
    case 'PROCESSING_ANSWER':
      return 'Processing answer…'
    case 'GENERATING_NEXT_QUESTION':
      return 'Generating next question…'
    case 'PAUSED':
      return 'Microphone paused'
    case 'FINISHED':
      return 'Interview complete'
    default:
      return 'Ready'
  }
}

function isSpeakingState(state: InterviewState): boolean {
  return state === 'INTRO_SPEAKING' || state === 'QUESTION_SPEAKING'
}

function isBusyState(state: InterviewState): boolean {
  return state === 'PROCESSING_ANSWER' || state === 'GENERATING_NEXT_QUESTION'
}

export function AIInterviewRoom() {
  const { interviewId } = useParams<{ interviewId: string }>()
  const navigate = useNavigate()

  const [answer, setAnswer] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [interviewState, setInterviewState] = useState<InterviewState>('INTRO_SPEAKING')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [lastFeedback, setLastFeedback] = useState<string | null>(null)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1)
  const [showIntro, setShowIntro] = useState(true)

  const interviewStateRef = useRef<InterviewState>('INTRO_SPEAKING')
  const bootstrapRef = useRef(false)
  const flowAbortedRef = useRef(false)
  const submitInProgressRef = useRef(false)
  const questionIdRef = useRef<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const listeningRef = useRef(false)
  const pausedRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answerRef = useRef('')
  const liveRef = useRef('')
  const listenStartRef = useRef<number | null>(null)
  const listenSessionRef = useRef(0)
  const interviewIdRef = useRef<string | null>(null)

  const { data: session, isLoading, refetch } = useGetAiInterviewSessionQuery(interviewId!, {
    skip: !interviewId,
  })
  const [submitAnswer, { isLoading: submitting }] = useSubmitAiAnswerMutation()
  const [endInterview, { isLoading: ending }] = useEndAiInterviewMutation()

  useEffect(() => { answerRef.current = answer }, [answer])
  useEffect(() => { liveRef.current = liveTranscript }, [liveTranscript])
  useEffect(() => { interviewIdRef.current = interviewId ?? null }, [interviewId])

  const setFlowState = useCallback((state: InterviewState) => {
    interviewStateRef.current = state
    setInterviewState(state)
  }, [])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const getCombinedTranscript = useCallback(() => {
    const live = liveRef.current.trim()
    const base = answerRef.current.trim()
    if (live && base) return `${base} ${live}`
    return live || base
  }, [])

  const stopListeningInternal = useCallback(() => {
    listeningRef.current = false
    clearSilenceTimer()
    setLiveTranscript('')
    try {
      recognitionRef.current?.stop()
    } catch {
      /* already stopped */
    }
  }, [clearSilenceTimer])

  const setupRecognition = useCallback((): SpeechRecognitionInstance | null => {
    if (recognitionRef.current) return recognitionRef.current
    const Ctor = getSpeechRecognition()
    if (!Ctor) return null

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition
    return recognition
  }, [])

  const startSilenceTimer = useCallback(
    (sessionId: number, onTimeout: () => void) => {
      clearSilenceTimer()
      silenceTimerRef.current = setTimeout(() => {
        if (listenSessionRef.current !== sessionId) return
        if (submitInProgressRef.current) return
        console.log('Silence timeout triggered')
        onTimeout()
      }, SILENCE_MS)
    },
    [clearSilenceTimer]
  )

  const handleSilenceTimeout = useCallback((reason: 'NO_RESPONSE' | 'SILENCE_AFTER_SPEECH') => {
    if (submitInProgressRef.current) return
    listeningRef.current = false
    clearSilenceTimer()
    try {
      recognitionRef.current?.stop()
    } catch {
      /* already stopped */
    }
    setLiveTranscript('')
    const answer = reason === 'NO_RESPONSE' ? '' : getCombinedTranscript()
    void handleAnswerSubmitRef.current?.({ answer, reason })
  }, [clearSilenceTimer, getCombinedTranscript])

  const beginListening = useCallback(async () => {
    if (flowAbortedRef.current || pausedRef.current) return
    if (isBusyState(interviewStateRef.current)) return

    window.speechSynthesis.cancel()
    setFlowState('WAITING_FOR_ANSWER')
    await delay(AUTO_LISTEN_DELAY_MS)

    if (flowAbortedRef.current || pausedRef.current) return
    if (isBusyState(interviewStateRef.current)) return

    const recognition = setupRecognition()
    if (!recognition) {
      setVoiceError('Speech recognition is not supported. Type your answer and tap Submit.')
      return
    }

    const sessionId = ++listenSessionRef.current
    setVoiceError(null)
    listeningRef.current = true
    listenStartRef.current = Date.now()
    setAnswer('')
    setLiveTranscript('')
    setFlowState('LISTENING')
    console.log('Mic started')

    recognition.onresult = (event) => {
      if (pausedRef.current || listenSessionRef.current !== sessionId) return
      if (interviewStateRef.current !== 'LISTENING') return

      let interim = ''
      let heardFinalSpeech = false

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          const trimmed = text.trim()
          if (trimmed.length >= 2) {
            heardFinalSpeech = true
            setAnswer((prev) => (prev.trim() ? `${prev.trim()} ${trimmed}` : trimmed))
          }
        } else if (text.trim().length >= 3) {
          interim += text
        }
      }

      setLiveTranscript(interim)

      if (heardFinalSpeech) {
        startSilenceTimer(sessionId, () => handleSilenceTimeout('SILENCE_AFTER_SPEECH'))
      }
    }

    recognition.onend = () => {
      if (
        listeningRef.current &&
        !pausedRef.current &&
        listenSessionRef.current === sessionId &&
        interviewStateRef.current === 'LISTENING'
      ) {
        try {
          recognition.start()
        } catch {
          /* already running */
        }
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return
      if (event.error !== 'aborted') {
        setVoiceError('Voice input failed. You can type your answer instead.')
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        listeningRef.current = false
        pausedRef.current = false
        setFlowState('WAITING_FOR_ANSWER')
      }
    }

    try {
      recognition.start()
    } catch {
      /* already started */
    }

    startSilenceTimer(sessionId, () => handleSilenceTimeout('NO_RESPONSE'))
  }, [handleSilenceTimeout, setFlowState, setupRecognition, startSilenceTimer])

  const moveToNextQuestion = useCallback(
    async (response: AiInterviewSession) => {
      if (response.completed) {
        console.log('Interview completed')
        setFlowState('FINISHED')
        void refetch()
        return
      }

      let next = extractQuestion(response)
      if (!next) {
        console.warn('No question in submit response — refetching session')
        const refreshed = await refetch()
        next = extractQuestion(refreshed.data)
      }

      if (!next) {
        const fallbackText = response.nextQuestion?.trim()
        if (fallbackText) {
          console.warn('Using nextQuestion text — refetching for question id')
          const refreshed = await refetch()
          next = extractQuestion(refreshed.data)
          if (!next) {
            setActiveQuestion(fallbackText)
            setFlowState('QUESTION_SPEAKING')
            await speakWithCap(fallbackText)
            setFlowState('WAITING_FOR_ANSWER')
            await beginListening()
            return
          }
        }
      }

      if (!next) {
        console.error('No next question returned from server', response)
        setVoiceError('Could not load the next question. Please refresh the page.')
        submitInProgressRef.current = false
        return
      }

      console.log('Advancing to question', next.questionOrder, next.questionId)
      questionIdRef.current = next.questionId
      setCurrentQuestionNum(next.questionOrder)
      setActiveQuestion(next.question)

      const transition = response.transitionMessage?.trim()
      const spoken = transition ? `${transition} ${next.question}` : next.question

      setFlowState('QUESTION_SPEAKING')
      await speakWithCap(spoken)

      setFlowState('WAITING_FOR_ANSWER')
      await beginListening()
    },
    [beginListening, refetch, setFlowState]
  )

  const handleAnswerSubmitRef = useRef<
    (opts: { answer: string; reason?: string }) => Promise<void>
  >(async () => {})

  const handleAnswerSubmit = useCallback(
    async (opts: { answer: string; reason?: string }) => {
      if (submitInProgressRef.current) {
        console.log('Submit skipped: already in progress')
        return
      }
      const id = interviewIdRef.current
      const qId = questionIdRef.current
      if (!id || !qId) {
        console.error('Submit blocked: missing interviewId or questionId', { id, qId })
        return
      }

      const finalAnswer = opts.answer.trim()
      if (!finalAnswer && opts.reason !== 'NO_RESPONSE' && opts.reason !== 'SILENCE_AFTER_SPEECH') {
        return
      }

      submitInProgressRef.current = true
      listenSessionRef.current += 1
      stopListeningInternal()

      const answerTimeSeconds = listenStartRef.current
        ? Math.max(0, Math.round((Date.now() - listenStartRef.current) / 1000))
        : 0
      listenStartRef.current = null

      setAnswer(finalAnswer)
      setLiveTranscript('')
      setShowIntro(false)
      setFlowState('PROCESSING_ANSWER')
      console.log('Submitting answer', { reason: opts.reason, empty: !finalAnswer })

      try {
        setFlowState('GENERATING_NEXT_QUESTION')
        const response = await withTimeout(
          submitAnswer({
            interviewId: id,
            questionId: qId,
            answer: finalAnswer,
            answerTimeSeconds,
          }).unwrap(),
          60000,
          'Answer submit'
        )

        console.log('Submit succeeded', {
          completed: response.completed,
          questionId: response.currentQuestion?.questionId,
          nextQuestion: response.nextQuestion,
          transitionMessage: response.transitionMessage,
        })

        if (response.lastAnswerFeedback) setLastFeedback(response.lastAnswerFeedback)
        if (response.lastAnswerScore != null) setLastScore(response.lastAnswerScore)
        setAnswer('')

        await moveToNextQuestion(response)
      } catch (err) {
        console.error('Answer submit failed', err)
        setVoiceError('Could not submit your answer. Microphone will reopen.')
        setAnswer('')
        submitInProgressRef.current = false
        await beginListening()
        return
      }
      submitInProgressRef.current = false
    },
    [beginListening, moveToNextQuestion, setFlowState, stopListeningInternal, submitAnswer]
  )

  useEffect(() => {
    handleAnswerSubmitRef.current = handleAnswerSubmit
  }, [handleAnswerSubmit])

  const beginListeningRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    beginListeningRef.current = beginListening
  }, [beginListening])

  useEffect(() => {
    if (!session || session.completed || bootstrapRef.current) return
    if (!session.introMessage || !session.currentQuestion?.questionId) return

    bootstrapRef.current = true
    const first = session.currentQuestion

    questionIdRef.current = first.questionId
    setCurrentQuestionNum(first.questionOrder)
    setActiveQuestion(cleanDisplayQuestion(first.question))

    void (async () => {
      try {
        setFlowState('INTRO_SPEAKING')
        await speakWithCap(session.introMessage, 15000)

        setFlowState('QUESTION_SPEAKING')
        await speakWithCap(cleanDisplayQuestion(first.question), 15000)

        setFlowState('WAITING_FOR_ANSWER')
        await beginListening()
      } catch (err) {
        console.error('Interview bootstrap failed', err)
        setVoiceError('Could not start voice interview. You can still type answers.')
        setFlowState('WAITING_FOR_ANSWER')
        await beginListening()
      }
    })()
  }, [session, beginListening, setFlowState])

  // Safety net: never stay stuck on "AI is speaking" — open mic after 15s
  useEffect(() => {
    if (!isSpeakingState(interviewState)) return
    const watchdog = window.setTimeout(() => {
      if (!isSpeakingState(interviewStateRef.current)) return
      if (submitInProgressRef.current || listeningRef.current) return
      console.warn('Speaking watchdog: forcing microphone open')
      window.speechSynthesis.cancel()
      void beginListeningRef.current()
    }, 15000)
    return () => window.clearTimeout(watchdog)
  }, [interviewState])

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    return () => {
      flowAbortedRef.current = true
      stopListeningInternal()
      window.speechSynthesis.cancel()
    }
  }, [stopListeningInternal])

  function openMicNow() {
    window.speechSynthesis.cancel()
    pausedRef.current = false
    void beginListening()
  }

  function togglePauseMic() {
    if (isSpeakingState(interviewState)) {
      openMicNow()
      return
    }
    if (isBusyState(interviewState)) return

    if (pausedRef.current) {
      pausedRef.current = false
      void beginListening()
    } else {
      pausedRef.current = true
      stopListeningInternal()
      setFlowState('PAUSED')
    }
  }

  async function handleEnd() {
    flowAbortedRef.current = true
    stopListeningInternal()
    window.speechSynthesis.cancel()
    if (!interviewId) return
    if (!window.confirm('End this interview early?')) {
      flowAbortedRef.current = false
      return
    }
    await endInterview(interviewId)
    void refetch()
  }

  if (!interviewId) {
    return <div className="p-6 text-[#8b8ca8]">Invalid interview session.</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-[#8b8ca8]">
        <Loader2 className="animate-spin" /> Loading interview…
      </div>
    )
  }

  if (session?.completed && session.result) {
    return (
      <div className="p-6 min-h-full bg-[#0b0c14]">
        <InterviewResult
          result={session.result}
          candidateName={session.candidateName}
          onBack={() => navigate('/mock-interviews')}
        />
      </div>
    )
  }

  const question = cleanDisplayQuestion(
    activeQuestion ?? session?.currentQuestion?.question ?? 'Preparing your first question…'
  )
  const displayAnswer = liveTranscript ? (answer ? `${answer} ${liveTranscript}` : liveTranscript) : answer
  const isSpeaking = isSpeakingState(interviewState)
  const isBusy = isBusyState(interviewState) || submitting
  const isListening = interviewState === 'LISTENING'

  return (
    <div className="p-4 sm:p-6 min-h-full bg-[#0b0c14]">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={ROBOT_IMAGE} alt="" className="w-12 h-12 rounded-xl object-cover border border-[#6366f1]/30" />
            <div>
              <p className="text-sm font-bold text-white">AI Interviewer</p>
              <p className="text-xs text-[#818cf8]">{session?.targetRole} · {session?.interviewType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#818cf8] bg-[#6366f1]/15 border border-[#6366f1]/30 px-2.5 py-1 rounded-lg">
              Q {currentQuestionNum}/{MAX_QUESTIONS}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#8b8ca8] bg-[#161722] border border-[#2d2e3e] px-3 py-1.5 rounded-lg">
              <Clock size={14} className="text-[#818cf8]" />
              {formatElapsed(elapsed)}
            </span>
            <button
              type="button"
              onClick={() => void handleEnd()}
              disabled={ending}
              className="flex items-center gap-1.5 text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10"
            >
              <Square size={12} /> End
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-[#161722] border border-[#2d2e3e] px-4 py-2.5">
          {isSpeaking && <Volume2 size={14} className="text-[#818cf8] animate-pulse" />}
          {isListening && <Mic size={14} className="text-red-400 animate-pulse" />}
          {isBusy && <Loader2 size={14} className="text-[#818cf8] animate-spin" />}
          <span
            className={`text-xs font-semibold ${
              isListening ? 'text-red-400' : isSpeaking ? 'text-[#818cf8]' : 'text-[#8b8ca8]'
            }`}
          >
            {stateLabel(interviewState)}
          </span>
        </div>

        {showIntro && session?.introMessage && (
          <div className="rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/25 p-4">
            <div className="flex gap-3">
              <Bot size={18} className="text-[#818cf8] shrink-0 mt-0.5" />
              <p className="text-sm text-[#b4b5c8] leading-relaxed">{session.introMessage}</p>
            </div>
            <button type="button" onClick={() => setShowIntro(false)} className="mt-3 text-xs text-[#818cf8] hover:text-white">
              Hide intro →
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-[#161722] border border-[#2d2e3e] p-6">
          <p className="text-[10px] uppercase tracking-wide text-[#818cf8] font-bold mb-2">
            Question {currentQuestionNum} of {MAX_QUESTIONS}
          </p>
          <p className="text-base sm:text-lg text-white leading-relaxed">{question}</p>
        </div>

        {lastFeedback && (
          <div className="rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10px] uppercase text-[#8b8ca8]">Previous answer feedback</p>
              {lastScore != null && (
                <span className="text-[10px] font-bold text-[#818cf8]">Score: {lastScore}/100</span>
              )}
            </div>
            <p className="text-xs text-[#b4b5c8]">{lastFeedback}</p>
          </div>
        )}

        <div className="rounded-2xl bg-[#161722] border border-[#2d2e3e] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-[#8b8ca8]">Your Answer (live transcript)</label>
            {isListening && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 animate-pulse">
                <span aria-hidden>🔴</span> Recording
              </span>
            )}
          </div>
          <textarea
            value={displayAnswer}
            onChange={(e) => {
              setAnswer(e.target.value)
              setLiveTranscript('')
            }}
            rows={5}
            readOnly={isListening && interviewState !== 'PAUSED'}
            placeholder={
              isSpeaking
                ? 'Listen to the interviewer… microphone opens after the question'
                : isListening
                  ? 'Speak your answer — auto-submits after 10s of silence'
                  : 'Waiting for microphone…'
            }
            className="w-full rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm p-3 focus:outline-none focus:border-[#6366f1] resize-none"
          />
          {voiceError && <p className="text-xs text-red-400">{voiceError}</p>}
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <button
              type="button"
              onClick={togglePauseMic}
              disabled={isBusy}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isSpeaking
                  ? 'border-[#818cf8]/50 text-[#818cf8] bg-[#6366f1]/10'
                  : interviewState === 'PAUSED'
                  ? 'border-emerald-400/50 text-emerald-400 bg-emerald-400/10'
                  : isListening
                    ? 'border-red-400/50 text-red-400 bg-red-400/10'
                    : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              {isSpeaking
                ? <><Mic size={14} /> Open Mic Now</>
                : interviewState === 'PAUSED'
                ? <><Play size={14} /> Resume Mic</>
                : isListening
                  ? <><Pause size={14} /> Pause Mic</>
                  : <><Mic size={14} /> Mic (auto)</>}
            </button>
            {(isListening || isSpeaking) && (
              <button
                type="button"
                disabled={isBusy || !questionIdRef.current}
                onClick={() => void handleAnswerSubmit({ answer: '', reason: 'NO_RESPONSE' })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
              >
                Skip (no answer)
              </button>
            )}
            <button
              type="button"
              disabled={isBusy || !displayAnswer.trim() || !questionIdRef.current}
              onClick={() => void handleAnswerSubmit({ answer: displayAnswer.trim() })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <MicOff size={16} />}
              {isBusy ? 'Processing…' : 'Submit Answer'}
            </button>
          </div>
          <p className="text-[10px] text-[#5c5d72]">
            The interview runs automatically: intro → question → mic → answer → next question. Silence for 10 seconds submits a blank answer (score 0) and continues.
          </p>
        </div>
      </div>
    </div>
  )
}
