import { useCallback, useEffect, useRef } from 'react'
import {
  useAcceptLiveMatchMutation,
  useCancelLiveMatchMutation,
  useEndLiveSessionMutation,
  useLazyGetLiveMatchStatusQuery,
  useLearnerSearchMutation,
  useMentorGoLiveMutation,
  useMentorGoOfflineMutation,
  useRejectLiveMatchMutation,
} from '../api/matchingApi'
import { useCreateConversationMutation } from '../api/chatApi'
import { useGetMyProfileQuery, useLazyGetProfileQuery } from '../api/userApi'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  matchSessionActions,
  type CodeReviewMeta,
  type InterviewMeta,
  type PairProgrammingMeta,
} from '../store/matchSessionSlice'
import type { LiveMatchStatus, UserProfile } from '../api/types'
import { extractApiError } from '../lib/extractApiError'

const STATUS_POLL_MS = 2000
const SEARCH_TIMEOUT_MS = 120000

function partnerProfileFallback(matchedUserId: string): UserProfile {
  const shortId = matchedUserId.slice(0, 8)
  return {
    id: matchedUserId,
    username: `user-${shortId}`,
    displayName: 'Partner',
    bio: null,
    avatarUrl: null,
    location: null,
    role: null,
    experienceLevel: null,
    learningGoals: null,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    skills: [],
    averageRating: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

function applyLiveStatus(
  status: LiveMatchStatus,
  dispatch: ReturnType<typeof useAppDispatch>,
  fetchPartnerProfile: ReturnType<typeof useLazyGetProfileQuery>[0],
  createConversation: ReturnType<typeof useCreateConversationMutation>[0],
) {
  const partnerId = status.partnerId
  const assignmentId = status.assignmentId

  if (status.assignmentStatus === 'PENDING_ACCEPT' && partnerId && assignmentId) {
    void (async () => {
      let partnerProfile: UserProfile
      try {
        partnerProfile = await fetchPartnerProfile(partnerId).unwrap()
      } catch {
        partnerProfile = partnerProfileFallback(partnerId)
      }
      const partner = {
        id: partnerId,
        displayName: partnerProfile.displayName ?? partnerProfile.username ?? 'Partner',
        role: partnerProfile.role ?? status.partnerRole,
        bio: partnerProfile.bio ?? null,
      }
      if (status.role === 'MENTOR') {
        dispatch(matchSessionActions.setPendingRequest({
          assignmentId,
          partner,
          criteria: status.criteria,
        }))
      } else {
        dispatch(matchSessionActions.setWaitingAccept({
          assignmentId,
          partner,
          criteria: status.criteria,
        }))
      }
    })()
    return
  }

  if (status.assignmentStatus === 'ACTIVE' && partnerId && assignmentId) {
    void (async () => {
      let partnerProfile: UserProfile
      try {
        partnerProfile = await fetchPartnerProfile(partnerId).unwrap()
      } catch {
        partnerProfile = partnerProfileFallback(partnerId)
      }
      const conversation = await createConversation({ participantIds: [partnerId] }).unwrap()
      dispatch(matchSessionActions.setMatched({
        partner: {
          id: partnerId,
          displayName: partnerProfile.displayName ?? partnerProfile.username ?? 'Partner',
          role: partnerProfile.role ?? status.partnerRole,
          bio: partnerProfile.bio ?? null,
        },
        conversationId: conversation.id,
        assignmentId,
      }))
    })()
    return
  }

  if (status.role === 'MENTOR' && status.liveEnabled && status.poolStatus === 'AVAILABLE') {
    dispatch(matchSessionActions.setMentorLive({ criteria: status.criteria ?? '' }))
    return
  }

  if (status.role === 'LEARNER' && status.poolStatus === 'AVAILABLE' && !status.assignmentId) {
    dispatch(matchSessionActions.setSearching({ criteria: status.criteria ?? '', role: 'LEARNER' }))
  }
}

export function useMatchFlow() {
  const dispatch = useAppDispatch()
  const session = useAppSelector((s) => s.matchSession)
  const { data: profile } = useGetMyProfileQuery()
  const [mentorGoLive] = useMentorGoLiveMutation()
  const [mentorGoOffline] = useMentorGoOfflineMutation()
  const [learnerSearch] = useLearnerSearchMutation()
  const [fetchStatus] = useLazyGetLiveMatchStatusQuery()
  const [acceptLiveMatch] = useAcceptLiveMatchMutation()
  const [rejectLiveMatch] = useRejectLiveMatchMutation()
  const [cancelLiveMatch] = useCancelLiveMatchMutation()
  const [endLiveSession] = useEndLiveSessionMutation()
  const [createConversation] = useCreateConversationMutation()
  const [fetchPartnerProfile] = useLazyGetProfileQuery()
  const pollRef = useRef(false)

  const pollUntilMatched = useCallback(async () => {
    if (pollRef.current) return
    pollRef.current = true
    const deadline = Date.now() + SEARCH_TIMEOUT_MS
    try {
      while (Date.now() < deadline) {
        const status = await fetchStatus().unwrap()
        if (status.assignmentStatus === 'PENDING_ACCEPT' || status.assignmentStatus === 'ACTIVE') {
          applyLiveStatus(status, dispatch, fetchPartnerProfile, createConversation)
          return
        }
        if (status.poolStatus === 'OFFLINE' && !status.assignmentId) {
          break
        }
        await sleep(STATUS_POLL_MS)
      }
      dispatch(matchSessionActions.setError('No mentors available right now. Please try again shortly.'))
    } catch (error) {
      dispatch(matchSessionActions.setError(extractApiError(error)))
    } finally {
      pollRef.current = false
    }
  }, [createConversation, dispatch, fetchPartnerProfile, fetchStatus])

  const startMatchAsMentor = useCallback(
    async (
      criteria: string,
      skills?: string[],
      experienceLevel?: string,
    ) => {
      try {
        const skillSet = skills?.length ? skills : profile?.skills ?? []
        const level = experienceLevel ?? profile?.experienceLevel ?? undefined
        const status = await mentorGoLive({
          criteria,
          skills: skillSet,
          experienceLevel: level,
        }).unwrap()
        dispatch(matchSessionActions.setMentorLive({
          criteria,
          assignmentId: status.assignmentId,
        }))
        if (status.assignmentStatus === 'PENDING_ACCEPT' && status.partnerId && status.assignmentId) {
          applyLiveStatus(status, dispatch, fetchPartnerProfile, createConversation)
        }
      } catch (error) {
        dispatch(matchSessionActions.setError(extractApiError(error)))
      }
    },
    [dispatch, fetchPartnerProfile, createConversation, mentorGoLive, profile?.experienceLevel, profile?.skills],
  )

  const startMatchAsLearner = useCallback(
    async (
      criteria: string,
      skills?: string[],
      experienceLevel?: string,
      interview?: InterviewMeta,
      pairProgramming?: PairProgrammingMeta,
      codeReview?: CodeReviewMeta,
    ) => {
      dispatch(matchSessionActions.setSearching({ criteria, role: 'LEARNER' }))
      if (interview) dispatch(matchSessionActions.setInterviewMeta(interview))
      if (pairProgramming) dispatch(matchSessionActions.setPairProgrammingMeta(pairProgramming))
      if (codeReview) dispatch(matchSessionActions.setCodeReviewMeta(codeReview))
      try {
        const skillSet = skills?.length ? skills : profile?.skills ?? []
        const level = experienceLevel ?? profile?.experienceLevel ?? undefined
        const status = await learnerSearch({
          criteria,
          skills: skillSet,
          experienceLevel: level,
        }).unwrap()

        if (status.assignmentStatus === 'PENDING_ACCEPT' && status.partnerId && status.assignmentId) {
          applyLiveStatus(status, dispatch, fetchPartnerProfile, createConversation)
          return
        }
        if (status.assignmentStatus === 'ACTIVE' && status.partnerId && status.assignmentId) {
          applyLiveStatus(status, dispatch, fetchPartnerProfile, createConversation)
          return
        }
        await pollUntilMatched()
      } catch (error) {
        dispatch(matchSessionActions.setError(extractApiError(error)))
      }
    },
    [
      dispatch,
      fetchPartnerProfile,
      createConversation,
      learnerSearch,
      pollUntilMatched,
      profile?.experienceLevel,
      profile?.skills,
    ],
  )

  /** Legacy entry — routes by role when possible. */
  const startMatch = useCallback(
    async (
      criteria: string,
      skills?: string[],
      experienceLevel?: string,
      interview?: InterviewMeta,
      pairProgramming?: PairProgrammingMeta,
      codeReview?: CodeReviewMeta,
      asMentor = false,
    ) => {
      if (asMentor) {
        await startMatchAsMentor(criteria, skills, experienceLevel)
      } else {
        await startMatchAsLearner(criteria, skills, experienceLevel, interview, pairProgramming, codeReview)
      }
    },
    [startMatchAsLearner, startMatchAsMentor],
  )

  const requeueLearnerSearch = useCallback(async () => {
    const criteria = session.criteria ?? 'Find a mentor for a live session'
    dispatch(matchSessionActions.backToSearching())
    try {
      const status = await learnerSearch({ criteria }).unwrap()
      if (status.assignmentStatus === 'PENDING_ACCEPT' || status.assignmentStatus === 'ACTIVE') {
        applyLiveStatus(status, dispatch, fetchPartnerProfile, createConversation)
        return
      }
      await pollUntilMatched()
    } catch (error) {
      dispatch(matchSessionActions.setError(extractApiError(error)))
    }
  }, [createConversation, dispatch, fetchPartnerProfile, learnerSearch, pollUntilMatched, session.criteria])

  const goOffline = useCallback(async () => {
    try {
      await mentorGoOffline().unwrap()
      dispatch(matchSessionActions.endSession())
    } catch (error) {
      dispatch(matchSessionActions.setError(extractApiError(error)))
    }
  }, [dispatch, mentorGoOffline])

  const finalizeMatch = useCallback(
    async (partnerId: string, assignmentId: string, partnerOverride?: typeof session.partner) => {
      if (session.status === 'matched' || session.status === 'in_call') return
      let partnerProfile: UserProfile
      try {
        partnerProfile = await fetchPartnerProfile(partnerId).unwrap()
      } catch {
        partnerProfile = partnerProfileFallback(partnerId)
      }
      const partner = partnerOverride ?? {
        id: partnerId,
        displayName: partnerProfile.displayName ?? partnerProfile.username ?? 'Partner',
        role: partnerProfile.role ?? null,
        bio: partnerProfile.bio ?? null,
      }
      const conversation = await createConversation({ participantIds: [partnerId] }).unwrap()
      dispatch(matchSessionActions.setMatched({
        partner,
        conversationId: conversation.id,
        assignmentId,
        interview: session.interview ?? undefined,
        pairProgramming: session.pairProgramming ?? undefined,
        codeReview: session.codeReview ?? undefined,
      }))
    },
    [createConversation, dispatch, fetchPartnerProfile, session.status, session.interview, session.pairProgramming, session.codeReview],
  )

  const acceptMatch = useCallback(async (assignmentId?: string) => {
    const id = assignmentId ?? session.assignmentId
    if (!id) return
    try {
      await acceptLiveMatch(id).unwrap()
      const partner = session.partner
      if (partner) {
        await finalizeMatch(partner.id, id, partner)
      }
    } catch (error) {
      dispatch(matchSessionActions.setError(extractApiError(error)))
    }
  }, [acceptLiveMatch, dispatch, finalizeMatch, session.assignmentId, session.partner])

  const rejectMatch = useCallback(async (assignmentId?: string) => {
    const id = assignmentId ?? session.assignmentId
    if (!id) return
    try {
      await rejectLiveMatch(id).unwrap()
      dispatch(matchSessionActions.backToLiveAvailable())
    } catch (error) {
      dispatch(matchSessionActions.setError(extractApiError(error)))
    }
  }, [dispatch, rejectLiveMatch, session.assignmentId])

  const cancelMatch = useCallback(async () => {
    try {
      await cancelLiveMatch().unwrap()
      dispatch(matchSessionActions.endSession())
    } catch (error) {
      dispatch(matchSessionActions.setError(extractApiError(error)))
    }
  }, [cancelLiveMatch, dispatch])

  const startCall = useCallback(() => {
    dispatch(matchSessionActions.startCall())
  }, [dispatch])

  const endSession = useCallback(async () => {
    try {
      if (session.status === 'matched' || session.status === 'in_call') {
        await endLiveSession().unwrap()
      } else if (session.status !== 'idle') {
        await cancelLiveMatch().unwrap()
      }
    } catch {
      // still reset local state
    }
    dispatch(matchSessionActions.endSession())
  }, [cancelLiveMatch, dispatch, endLiveSession, session.status])

  const clearError = useCallback(() => {
    dispatch(matchSessionActions.clearError())
  }, [dispatch])

  return {
    session,
    startMatch,
    startMatchAsMentor,
    startMatchAsLearner,
    goOffline,
    acceptMatch,
    rejectMatch,
    cancelMatch,
    requeueLearnerSearch,
    startCall,
    endSession,
    clearError,
    finalizeMatch,
    applyLiveStatusFromEvent: (status: LiveMatchStatus) =>
      applyLiveStatus(status, dispatch, fetchPartnerProfile, createConversation),
  }
}

/** Poll live status while mentor is live-waiting or learner is searching. */
export function useLiveMatchStatusPoll(enabled: boolean) {
  const dispatch = useAppDispatch()
  const [fetchStatus] = useLazyGetLiveMatchStatusQuery()
  const [createConversation] = useCreateConversationMutation()
  const [fetchPartnerProfile] = useLazyGetProfileQuery()

  useEffect(() => {
    if (!enabled) return
    const id = globalThis.setInterval(async () => {
      try {
        const status = await fetchStatus().unwrap()
        applyLiveStatus(status, dispatch, fetchPartnerProfile, createConversation)
      } catch {
        /* ignore transient poll errors */
      }
    }, STATUS_POLL_MS)
    return () => globalThis.clearInterval(id)
  }, [createConversation, dispatch, enabled, fetchPartnerProfile, fetchStatus])
}
