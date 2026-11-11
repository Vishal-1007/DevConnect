import { useCallback, useEffect, useRef, useState } from 'react'

export function useLocalMedia(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [streamReady, setStreamReady] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (!active) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setLocalStream(null)
      setStreamReady(false)
      return
    }

    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        setLocalStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setStreamReady(true)
        setMediaError(null)
      })
      .catch(() => {
        setMediaError('Camera or microphone access was denied.')
        setStreamReady(false)
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setLocalStream(null)
      setStreamReady(false)
    }
  }, [active])

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [streamReady])

  const toggleMic = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMicEnabled(track.enabled)
  }, [])

  const toggleCamera = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCameraEnabled(track.enabled)
  }, [])

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setLocalStream(null)
    setStreamReady(false)
  }, [])

  const forceMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = false
    setMicEnabled(false)
  }, [])

  const forceCameraOff = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = false
    setCameraEnabled(false)
  }, [])

  return {
    videoRef,
    localStream,
    micEnabled,
    cameraEnabled,
    mediaError,
    streamReady,
    toggleMic,
    toggleCamera,
    stopMedia,
    forceMute,
    forceCameraOff,
  }
}
