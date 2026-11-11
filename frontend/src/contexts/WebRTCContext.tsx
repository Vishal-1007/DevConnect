// @refresh reset
/**
 * WebRTCContext — single shared WebRTC instance per page.
 *
 * Wrap the Mentor (or User) page with <WebRTCProvider> so that
 * VideoCallSection and IncomingCallDialog share the same RTCPeerConnection
 * rather than each creating their own, which caused conflicting call-requests.
 */
import { createContext, useContext, type ReactNode } from 'react'
import { useWebRTC, type CallState, type IncomingCall } from '../hooks/useWebRTC'

export interface WebRTCContextValue {
  callState: CallState
  peerId: string | null
  peerName: string
  incomingCall: IncomingCall | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micEnabled: boolean
  cameraEnabled: boolean
  connected: boolean
  startCall: (peerId: string, peerName: string) => void
  acceptCall: () => void
  rejectCall: () => void
  hangUp: () => void
  toggleMic: () => void
  toggleCamera: () => void
  startPreview: () => Promise<void>
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null)

export function WebRTCProvider({
  children,
  userId,
  name,
}: {
  children: ReactNode
  userId: string | undefined
  name: string
}) {
  const webrtc = useWebRTC(userId, name)

  return (
    <WebRTCContext.Provider value={webrtc}>
      {children}
    </WebRTCContext.Provider>
  )
}

/** Use inside any component nested under <WebRTCProvider>. */
export function useWebRTCContext(): WebRTCContextValue {
  const ctx = useContext(WebRTCContext)
  if (!ctx) throw new Error('useWebRTCContext must be used inside WebRTCProvider')
  return ctx
}

/** Returns null if no provider — safe for VideoCallSection used outside mentor flow. */
export function useWebRTCContextSafe(): WebRTCContextValue | null {
  return useContext(WebRTCContext)
}
