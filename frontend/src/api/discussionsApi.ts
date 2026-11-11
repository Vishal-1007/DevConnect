import type { CreateDiscussionThread, DiscussionReply, DiscussionThread } from './types'
import { devConnectApi } from './baseApi'

export const discussionsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listDiscussions: build.query<
      DiscussionThread[],
      { topic?: string; q?: string; limit?: number } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        const topic = params?.topic
        const q = params?.q
        if (topic && topic !== 'all') search.set('topic', topic)
        if (q?.trim()) search.set('q', q.trim())
        search.set('limit', String(params?.limit ?? 50))
        return `/api/users/discussions?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Discussions' as const, id })),
              { type: 'Discussions', id: 'LIST' },
            ]
          : [{ type: 'Discussions', id: 'LIST' }],
    }),
    getDiscussion: build.query<DiscussionThread, string>({
      query: (id) => `/api/users/discussions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Discussions', id }],
    }),
    createDiscussion: build.mutation<DiscussionThread, CreateDiscussionThread>({
      query: (body) => ({
        url: '/api/users/discussions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Discussions', id: 'LIST' },
        { type: 'Leaderboard', id: 'LIST' },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
    listReplies: build.query<DiscussionReply[], string>({
      query: (threadId) => `/api/users/discussions/${threadId}/replies`,
      providesTags: (_result, _error, threadId) => [
        { type: 'Discussions', id: `${threadId}-replies` },
      ],
    }),
    addReply: build.mutation<DiscussionReply, { threadId: string; content: string }>({
      query: ({ threadId, content }) => ({
        url: `/api/users/discussions/${threadId}/replies`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { threadId }) => [
        { type: 'Discussions', id: threadId },
        { type: 'Discussions', id: 'LIST' },
        { type: 'Discussions', id: `${threadId}-replies` },
        { type: 'Leaderboard', id: 'LIST' },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
    markSolved: build.mutation<DiscussionThread, { threadId: string; replyId: string }>({
      query: ({ threadId, replyId }) => ({
        url: `/api/users/discussions/${threadId}/solved/${replyId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { threadId }) => [
        { type: 'Discussions', id: threadId },
        { type: 'Discussions', id: 'LIST' },
        { type: 'Discussions', id: `${threadId}-replies` },
        { type: 'Leaderboard', id: 'LIST' },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
  }),
})

export const {
  useListDiscussionsQuery,
  useGetDiscussionQuery,
  useCreateDiscussionMutation,
  useListRepliesQuery,
  useAddReplyMutation,
  useMarkSolvedMutation,
} = discussionsApi
