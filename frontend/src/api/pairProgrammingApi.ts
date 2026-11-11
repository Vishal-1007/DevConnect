import { devConnectApi } from './baseApi'

export interface PairParticipant {
  id: string
  userId: string
  displayName: string
  role: string
  micEnabled: boolean
  cameraEnabled: boolean
}

export interface PairSession {
  id: string
  sessionCode: string
  hostId: string
  mentorId: string | null
  assignmentId: string | null
  problemId: string
  problemTitle: string
  problemDescription: string
  language: string
  difficulty: string
  status: string
  currentCode: string
  hostRole: string
  allowMentorEdit: boolean
  mode: string
  startedAt: string | null
  endedAt: string | null
  participants: PairParticipant[]
  noteContent: string
  whiteboardJson: string
  hints: string[]
  constraints: string[]
  resources: { title: string; url: string }[]
}

export interface PairChatMessage {
  id: string
  senderId: string
  senderName: string | null
  message: string
  messageType: string
  createdAt: string
}

export interface TestCaseResult {
  name: string
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
  executionMs: number
}

export interface RunCodeResult {
  allPassed: boolean
  stdout: string
  stderr: string
  executionMs: number
  memoryKb: number
  testCases: TestCaseResult[]
}

export interface SessionSummary {
  sessionId: string
  durationSeconds: number
  problemTitle: string
  language: string
  problemSolved: boolean
  codeQualityScore: number
  pointsEarned: number
  mentorFeedback: string
  strengths: string[]
  weaknesses: string[]
  improvementAreas: string[]
}

export interface PairInvitation {
  id: string
  sessionId: string
  sessionCode: string
  senderId: string
  senderName: string
  language: string
  challenge: string
  role: string
  difficulty: string
  status: string
  createdAt: string
}

export const pairProgrammingApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    startMentorPairSession: build.mutation<
      PairSession,
      {
        mentorId: string
        problemId: string
        language: string
        role: string
      }
    >({
      query: (body) => ({ url: '/api/pair-programming/start', method: 'POST', body }),
      invalidatesTags: ['PairSessions', 'PairInvitations'],
    }),
    getPairSessionByCode: build.query<PairSession, string>({
      query: (code) => `/api/pair-programming/session/${encodeURIComponent(code)}`,
      providesTags: (_r, _e, code) => [{ type: 'PairSessions', id: code }],
    }),
    joinPairSessionByCode: build.mutation<PairSession, string>({
      query: (code) => ({
        url: `/api/pair-programming/join/${encodeURIComponent(code)}`,
        method: 'POST',
      }),
      invalidatesTags: ['PairSessions'],
    }),
    listIncomingPairInvitations: build.query<PairInvitation[], void>({
      query: () => '/api/pair-programming/invitations/incoming',
      providesTags: ['PairInvitations'],
    }),
    acceptPairInvitation: build.mutation<PairSession, { sessionId: string }>({
      query: (body) => ({ url: '/api/pair-programming/accept', method: 'POST', body }),
      invalidatesTags: ['PairSessions', 'PairInvitations'],
    }),
    rejectPairInvitation: build.mutation<PairSession, { sessionId: string }>({
      query: (body) => ({ url: '/api/pair-programming/reject', method: 'POST', body }),
      invalidatesTags: ['PairSessions', 'PairInvitations'],
    }),
    startPairSession: build.mutation<
      PairSession,
      {
        problemId: string
        language: string
        role: string
        assignmentId?: string
        partnerId?: string
        partnerName?: string
        partnerRole?: string
        allowMentorEdit?: boolean
      }
    >({
      query: (body) => ({ url: '/api/pair/start', method: 'POST', body }),
      invalidatesTags: ['PairSessions', 'CodingProblems', { type: 'Leaderboard', id: 'LIST' }, { type: 'UserStats', id: 'ME' }],
    }),
    joinPairSession: build.mutation<PairSession, { sessionCode: string }>({
      query: (body) => ({ url: '/api/pair/join', method: 'POST', body }),
      invalidatesTags: ['PairSessions'],
    }),
    getPairSession: build.query<PairSession, string>({
      query: (id) => `/api/pair/session/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PairSessions', id }],
    }),
    savePairCode: build.mutation<PairSession, { sessionId: string; code: string; language: string }>({
      query: (body) => ({ url: '/api/pair/code/save', method: 'POST', body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: 'PairSessions', id: sessionId }],
    }),
    runPairCode: build.mutation<
      RunCodeResult,
      { sessionId: string; code: string; language: string; problemId?: string }
    >({
      query: (body) => ({ url: '/api/pair/run-code', method: 'POST', body }),
    }),
    sendPairChat: build.mutation<
      PairChatMessage,
      { sessionId: string; message: string; messageType?: string }
    >({
      query: (body) => ({ url: '/api/pair/chat/send', method: 'POST', body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: 'PairChat', id: sessionId }],
    }),
    listPairChat: build.query<PairChatMessage[], string>({
      query: (sessionId) => `/api/pair/chat/${sessionId}`,
      providesTags: (_r, _e, sessionId) => [{ type: 'PairChat', id: sessionId }],
    }),
    savePairNote: build.mutation<PairSession, { sessionId: string; content: string }>({
      query: (body) => ({ url: '/api/pair/note/save', method: 'POST', body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: 'PairSessions', id: sessionId }],
    }),
    savePairWhiteboard: build.mutation<PairSession, { sessionId: string; jsonData: string }>({
      query: (body) => ({ url: '/api/pair/whiteboard/save', method: 'POST', body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: 'PairSessions', id: sessionId }],
    }),
    endPairSession: build.mutation<SessionSummary, { sessionId: string }>({
      query: (body) => ({ url: '/api/pair/end', method: 'POST', body }),
      invalidatesTags: ['PairSessions', { type: 'Leaderboard', id: 'LIST' }, { type: 'UserStats', id: 'ME' }],
    }),
    startPairRecording: build.mutation<{ id: string }, { sessionId: string }>({
      query: (body) => ({ url: '/api/pair/record/start', method: 'POST', body }),
    }),
    stopPairRecording: build.mutation<{ id: string; videoUrl: string | null }, { sessionId: string; videoUrl?: string }>({
      query: (body) => ({ url: '/api/pair/record/stop', method: 'POST', body }),
    }),
  }),
})

export const {
  useStartMentorPairSessionMutation,
  useGetPairSessionByCodeQuery,
  useJoinPairSessionByCodeMutation,
  useListIncomingPairInvitationsQuery,
  useAcceptPairInvitationMutation,
  useRejectPairInvitationMutation,
  useStartPairSessionMutation,
  useJoinPairSessionMutation,
  useGetPairSessionQuery,
  useSavePairCodeMutation,
  useRunPairCodeMutation,
  useSendPairChatMutation,
  useListPairChatQuery,
  useSavePairNoteMutation,
  useSavePairWhiteboardMutation,
  useEndPairSessionMutation,
  useStartPairRecordingMutation,
  useStopPairRecordingMutation,
} = pairProgrammingApi
