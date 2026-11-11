import { useCallback, useEffect } from 'react'
import { useSignaling, type SignalingMessage } from './useSignaling'
import { useMatchFlow } from './useMatchFlow'
import { useAppDispatch, useAppSelector } from '../hooks'
import { matchSessionActions } from '../store/matchSessionSlice'
import { useLazyGetProfileQuery } from '../api/userApi'

/**
 * Subscribes to STOMP match events from matching-service (via chat-service relay)
 * and keeps Redux session state in sync in real time.
 */
export function useLiveMatchEvents(userId: string | undefined) {
  const dispatch = useAppDispatch()
  const session = useAppSelector((s) => s.matchSession)
  const { finalizeMatch, requeueLearnerSearch } = useMatchFlow()
  const [fetchPartnerProfile] = useLazyGetProfileQuery()

  const onMessage = useCallback(
    async (msg: SignalingMessage) => {
      if (!msg.type?.startsWith('match-')) return

      const assignmentId = msg.assignmentId
      const fromId = msg.from

      switch (msg.type) {
        case 'match-request': {
          if (!assignmentId || !fromId) return
          let displayName = msg.fromName ?? 'Learner'
          try {
            const p = await fetchPartnerProfile(fromId).unwrap()
            displayName = p.displayName ?? p.username ?? displayName
          } catch { /* use fallback */ }
          dispatch(matchSessionActions.setPendingRequest({
            assignmentId,
            partner: {
              id: fromId,
              displayName,
              role: msg.partnerRole ?? 'LEARNER',
              bio: null,
            },
            criteria: msg.criteria ?? null,
          }))
          break
        }
        case 'match-assigned': {
          if (!assignmentId || !fromId) return
          let displayName = msg.fromName ?? 'Mentor'
          try {
            const p = await fetchPartnerProfile(fromId).unwrap()
            displayName = p.displayName ?? p.username ?? displayName
          } catch { /* use fallback */ }
          dispatch(matchSessionActions.setWaitingAccept({
            assignmentId,
            partner: {
              id: fromId,
              displayName,
              role: msg.partnerRole ?? 'MENTOR',
              bio: null,
            },
            criteria: msg.criteria ?? null,
          }))
          break
        }
        case 'match-accepted': {
          if (!assignmentId || !fromId) return
          if (session.status === 'matched' || session.status === 'in_call') return
          await finalizeMatch(fromId, assignmentId)
          break
        }
        case 'match-rejected':
        case 'match-expired':
          if (session.liveRole === 'LEARNER') {
            void requeueLearnerSearch()
          } else {
            dispatch(matchSessionActions.backToLiveAvailable())
          }
          break
        case 'match-cancelled':
          if (session.liveRole === 'MENTOR') {
            dispatch(matchSessionActions.backToLiveAvailable())
          } else {
            dispatch(matchSessionActions.endSession())
          }
          break
        case 'match-ended':
          dispatch(matchSessionActions.endSession())
          break
        default:
          break
      }
    },
    [dispatch, fetchPartnerProfile, finalizeMatch, requeueLearnerSearch, session.liveRole, session.status],
  )

  const { connected } = useSignaling(userId, onMessage)

  useEffect(() => {
    void connected
  }, [connected])

  return { connected }
}
