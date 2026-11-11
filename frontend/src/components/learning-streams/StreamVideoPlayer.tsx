import {
  AlertCircle, ChevronLeft, ChevronRight, Loader2, Maximize, Pause, Play,
  SkipForward, Volume2, VolumeX,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AUTOPLAY_COUNTDOWN_SECONDS, formatPlayerTime, INTRO_SKIP_SECONDS } from '../../lib/streamPlayerUtils'
import { resolveStreamVideoSrc } from '../../lib/streamUpload'
import { useStreamKeyboardShortcuts } from '../../hooks/useStreamKeyboardShortcuts'
import { useAppSelector } from '../../hooks'
import { StreamAutoplayOverlay } from './StreamAutoplayOverlay'
import type { FlatLesson } from '../../hooks/useLessonNavigation'
import type { StreamPlayerPreferences } from '../../hooks/useStreamPlayerPreferences'

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

interface StreamVideoPlayerProps {
  lesson: FlatLesson
  resumeSeconds: number
  prefs: StreamPlayerPreferences
  autoplayEnabled: boolean
  previousLesson: FlatLesson | null
  nextLesson: FlatLesson | null
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  onPause: (seconds: number) => void
  onTimeUpdate: (seconds: number, duration: number) => void
  onEnded: () => void
  onCompleted: (seconds: number) => void
  onVolumeChange: (volume: number) => void
  onPlaybackRateChange: (rate: number) => void
  onAutoplayCancel: () => void
}

export function StreamVideoPlayer({
  lesson,
  resumeSeconds,
  prefs,
  autoplayEnabled,
  previousLesson,
  nextLesson,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onPause,
  onTimeUpdate,
  onEnded,
  onCompleted,
  onVolumeChange,
  onPlaybackRateChange,
  onAutoplayCancel,
}: StreamVideoPlayerProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const videoSrc = useMemo(
    () => resolveStreamVideoSrc(lesson.videoUrl, accessToken),
    [lesson.videoUrl, accessToken],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const completedRef = useRef(false)
  const [playing, setPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffering, setBuffering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [muted, setMuted] = useState(prefs.volume === 0)
  const [volume, setVolume] = useState(prefs.volume)
  const [playbackRate, setPlaybackRate] = useState(prefs.playbackRate)
  const [showAutoplay, setShowAutoplay] = useState(false)
  const [countdown, setCountdown] = useState(AUTOPLAY_COUNTDOWN_SECONDS)
  const [resumeBanner, setResumeBanner] = useState(resumeSeconds > 5)

  const applyResume = useCallback((video: HTMLVideoElement) => {
    if (resumeSeconds > 0 && resumeSeconds < (video.duration || Number.MAX_SAFE_INTEGER) - 3) {
      video.currentTime = resumeSeconds
      setCurrentTime(resumeSeconds)
    }
  }, [resumeSeconds])

  useEffect(() => {
    completedRef.current = false
    setError(null)
    setBuffering(true)
    setPlaying(true)
    setCurrentTime(0)
    setDuration(0)
    setShowAutoplay(false)
    setCountdown(AUTOPLAY_COUNTDOWN_SECONDS)
    setResumeBanner(resumeSeconds > 5)
  }, [lesson.id, resumeSeconds])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume
    video.playbackRate = playbackRate
    video.muted = muted || volume === 0
  }, [volume, playbackRate, muted, lesson.id])

  useEffect(() => {
    if (!showAutoplay || !nextLesson) return
    if (countdown <= 0) {
      onNext()
      setShowAutoplay(false)
      return
    }
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [showAutoplay, countdown, nextLesson, onNext])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
      onPause(Math.floor(video.currentTime))
    }
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      await container.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const skipIntro = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(INTRO_SKIP_SECONDS, video.duration || INTRO_SKIP_SECONDS)
  }

  const handleEnded = () => {
    setPlaying(false)
    onEnded()
    if (!completedRef.current) {
      completedRef.current = true
      onCompleted(Math.floor(duration))
    }
    if (autoplayEnabled && nextLesson) {
      setShowAutoplay(true)
      setCountdown(AUTOPLAY_COUNTDOWN_SECONDS)
    }
  }

  useStreamKeyboardShortcuts({
    enabled: !error,
    videoRef,
    onPrevious,
    onNext,
    canGoPrevious,
    canGoNext,
  })

  return (
    <div ref={containerRef} className="relative flex flex-1 flex-col bg-black">
      <div className="relative flex flex-1 items-center justify-center">
        {buffering && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <Loader2 size={32} className="animate-spin text-violet-400" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
            <AlertCircle size={36} className="text-rose-400" />
            <p className="text-sm text-white font-semibold">Unable to play this lesson</p>
            <p className="text-xs text-[#8b8ca8]">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setBuffering(true)
                videoRef.current?.load()
              }}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
            >
              Retry
            </button>
          </div>
        )}

        {resumeBanner && (
          <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-violet-500/30 bg-[#12131c]/90 px-4 py-1.5 text-[11px] text-violet-200 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
            Continue where you left off
          </div>
        )}

        <video
          ref={videoRef}
          key={lesson.id}
          src={videoSrc}
          autoPlay
          playsInline
          className="h-full w-full max-h-full object-contain"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget
            setDuration(video.duration || lesson.durationSeconds || 0)
            setBuffering(false)
            applyResume(video)
            video.volume = volume
            video.playbackRate = playbackRate
            video.muted = muted || volume === 0
          }}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
          onPlay={() => {
            setPlaying(true)
            setResumeBanner(false)
          }}
          onPause={() => {
            setPlaying(false)
            onPause(Math.floor(videoRef.current?.currentTime ?? 0))
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget
            const seconds = video.currentTime
            setCurrentTime(seconds)
            setBuffering(false)
            onTimeUpdate(seconds, video.duration || lesson.durationSeconds || 0)

            const dur = video.duration || lesson.durationSeconds || 0
            if (!completedRef.current && dur > 0 && seconds / dur >= 0.9) {
              completedRef.current = true
              onCompleted(Math.floor(seconds))
            }
          }}
          onError={() => setError('The video source could not be loaded. Check your connection or try again later.')}
          onEnded={handleEnded}
        />

        {showAutoplay && nextLesson && (
          <StreamAutoplayOverlay
            countdown={countdown}
            nextLesson={nextLesson}
            onCancel={() => {
              setShowAutoplay(false)
              onAutoplayCancel()
            }}
            onPlayNow={() => {
              setShowAutoplay(false)
              onNext()
            }}
          />
        )}
      </div>

      <div className="border-t border-[#2d2e3e] bg-[#12131c]/95 px-4 py-3 backdrop-blur-md">
        <div className="mb-2 flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || lesson.durationSeconds || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const video = videoRef.current
              if (!video) return
              const next = Number(e.target.value)
              video.currentTime = next
              setCurrentTime(next)
            }}
            className="h-1 flex-1 cursor-pointer accent-violet-500"
          />
          <span className="shrink-0 text-[10px] text-[#8b8ca8] tabular-nums">
            {formatPlayerTime(currentTime)} / {formatPlayerTime(duration || lesson.durationSeconds)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={togglePlay}
              className="rounded-lg border border-[#2d2e3e] bg-[#161722] p-2 text-white transition hover:border-violet-500/50 hover:text-violet-300">
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button type="button" disabled={!canGoPrevious} onClick={onPrevious}
              className="rounded-lg border border-[#2d2e3e] bg-[#161722] p-2 text-white transition hover:border-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            <button type="button" disabled={!canGoNext} onClick={onNext}
              className="rounded-lg border border-[#2d2e3e] bg-[#161722] p-2 text-white transition hover:border-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
            {currentTime < INTRO_SKIP_SECONDS && (
              <button type="button" onClick={skipIntro}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-600/10 px-2.5 py-1.5 text-[10px] font-semibold text-violet-300 transition hover:bg-violet-600/20">
                <SkipForward size={12} /> Skip intro
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={playbackRate}
              onChange={(e) => {
                const rate = Number(e.target.value)
                setPlaybackRate(rate)
                onPlaybackRateChange(rate)
                if (videoRef.current) videoRef.current.playbackRate = rate
              }}
              className="rounded-lg border border-[#2d2e3e] bg-[#161722] px-2 py-1.5 text-[10px] text-[#8b8ca8] outline-none hover:border-violet-500/40"
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>{rate}x</option>
              ))}
            </select>

            <button type="button" onClick={() => {
              const nextMuted = !muted
              setMuted(nextMuted)
              if (videoRef.current) videoRef.current.muted = nextMuted
            }} className="rounded-lg border border-[#2d2e3e] bg-[#161722] p-2 text-white hover:border-violet-500/50">
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const next = Number(e.target.value)
                setVolume(next)
                setMuted(next === 0)
                onVolumeChange(next)
                if (videoRef.current) {
                  videoRef.current.volume = next
                  videoRef.current.muted = next === 0
                }
              }}
              className="w-20 accent-violet-500"
            />
            <button type="button" onClick={() => void toggleFullscreen()}
              className="rounded-lg border border-[#2d2e3e] bg-[#161722] p-2 text-white hover:border-violet-500/50">
              <Maximize size={16} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <NavPill disabled={!canGoPrevious} onClick={onPrevious} label="Previous Lesson" />
          <NavPill disabled={!canGoNext} onClick={onNext} label="Next Lesson" accent />
        </div>
      </div>
    </div>
  )
}

function NavPill({ label, onClick, disabled, accent }: { label: string; onClick: () => void; disabled?: boolean; accent?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        accent
          ? 'border border-violet-500/40 bg-violet-600/15 text-violet-200 hover:bg-violet-600/25 hover:shadow-[0_0_16px_rgba(124,58,237,0.25)]'
          : 'border border-[#2d2e3e] bg-[#161722]/80 text-[#8b8ca8] hover:border-violet-500/30 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}
