import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface MatchPartner {
  id: string
  displayName: string
  role: string | null
  bio: string | null
}

export type MatchSessionStatus =
  | 'idle'
  | 'live_available'
  | 'searching'
  | 'pending_request'
  | 'waiting_accept'
  | 'matched'
  | 'in_call'

export type LiveMatchRole = 'MENTOR' | 'LEARNER' | null

export interface InterviewMeta {
  typeId: string
  typeLabel: string
  difficulty: string
  focusTopic: string
  durationMinutes: number
}

export interface PairProgrammingMeta {
  languageId: string
  languageLabel: string
  taskId: string
  taskTitle: string
  taskDescription: string
  difficulty: string
  starterCode: string
  role: 'driver' | 'navigator'
}

export interface CodeReviewMeta {
  reviewTypeId: string
  reviewTypeLabel: string
  languageId: string
  languageLabel: string
  title: string
  description: string
  code: string
  focusAreas: string[]
}

export interface MatchSessionState {
  status: MatchSessionStatus
  liveRole: LiveMatchRole
  liveEnabled: boolean
  assignmentId: string | null
  partner: MatchPartner | null
  conversationId: string | null
  matchRequestId: string | null
  callStartedAt: number | null
  error: string | null
  criteria: string | null
  interview: InterviewMeta | null
  pairProgramming: PairProgrammingMeta | null
  codeReview: CodeReviewMeta | null
}

const initialState: MatchSessionState = {
  status: 'idle',
  liveRole: null,
  liveEnabled: false,
  assignmentId: null,
  partner: null,
  conversationId: null,
  matchRequestId: null,
  callStartedAt: null,
  error: null,
  criteria: null,
  interview: null,
  pairProgramming: null,
  codeReview: null,
}

const matchSessionSlice = createSlice({
  name: 'matchSession',
  initialState,
  reducers: {
    setMentorLive(state, action: PayloadAction<{ criteria: string; assignmentId?: string | null }>) {
      state.status = action.payload.assignmentId ? 'pending_request' : 'live_available'
      state.liveRole = 'MENTOR'
      state.liveEnabled = true
      state.assignmentId = action.payload.assignmentId ?? null
      state.error = null
      state.criteria = action.payload.criteria
      if (!action.payload.assignmentId) {
        state.partner = null
        state.conversationId = null
      }
    },
    setSearching(state, action: PayloadAction<{ criteria: string; role: LiveMatchRole }>) {
      state.status = 'searching'
      state.liveRole = action.payload.role
      state.error = null
      state.partner = null
      state.conversationId = null
      state.matchRequestId = null
      state.callStartedAt = null
      state.assignmentId = null
      state.criteria = action.payload.criteria
    },
    setPendingRequest(
      state,
      action: PayloadAction<{ assignmentId: string; partner: MatchPartner; criteria?: string | null }>
    ) {
      state.status = 'pending_request'
      state.liveRole = 'MENTOR'
      state.assignmentId = action.payload.assignmentId
      state.partner = action.payload.partner
      state.error = null
      if (action.payload.criteria) state.criteria = action.payload.criteria
    },
    setWaitingAccept(
      state,
      action: PayloadAction<{ assignmentId: string; partner: MatchPartner; criteria?: string | null }>
    ) {
      state.status = 'waiting_accept'
      state.liveRole = 'LEARNER'
      state.assignmentId = action.payload.assignmentId
      state.partner = action.payload.partner
      state.error = null
      if (action.payload.criteria) state.criteria = action.payload.criteria
    },
    setInterviewMeta(state, action: PayloadAction<InterviewMeta>) {
      state.interview = action.payload
    },
    setPairProgrammingMeta(state, action: PayloadAction<PairProgrammingMeta>) {
      state.pairProgramming = action.payload
    },
    setCodeReviewMeta(state, action: PayloadAction<CodeReviewMeta>) {
      state.codeReview = action.payload
    },
    setMatched(
      state,
      action: PayloadAction<{
        partner: MatchPartner
        conversationId: string
        matchRequestId?: string
        assignmentId?: string
        interview?: InterviewMeta
        pairProgramming?: PairProgrammingMeta
        codeReview?: CodeReviewMeta
      }>
    ) {
      state.status = 'matched'
      state.partner = action.payload.partner
      state.conversationId = action.payload.conversationId
      state.matchRequestId = action.payload.matchRequestId ?? null
      state.assignmentId = action.payload.assignmentId ?? state.assignmentId
      state.error = null
      if (action.payload.interview !== undefined) state.interview = action.payload.interview
      if (action.payload.pairProgramming !== undefined) state.pairProgramming = action.payload.pairProgramming
      if (action.payload.codeReview !== undefined) state.codeReview = action.payload.codeReview
    },
    startCall(state) {
      if (state.partner) {
        state.status = 'in_call'
        state.callStartedAt = Date.now()
      }
    },
    endSession() {
      return initialState
    },
    setError(state, action: PayloadAction<string>) {
      state.status = 'idle'
      state.error = action.payload
      state.liveEnabled = false
      state.liveRole = null
      state.assignmentId = null
    },
    clearError(state) {
      state.error = null
    },
    backToLiveAvailable(state) {
      if (state.liveRole === 'MENTOR' && state.liveEnabled) {
        state.status = 'live_available'
        state.assignmentId = null
        state.partner = null
        state.conversationId = null
      } else {
        return initialState
      }
    },
    backToSearching(state) {
      state.status = 'searching'
      state.assignmentId = null
      state.partner = null
      state.conversationId = null
    },
  },
})

export const matchSessionActions = matchSessionSlice.actions
export default matchSessionSlice.reducer
