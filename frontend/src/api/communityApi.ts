import type {
  CommunityComment,
  CommunityFeedStats,
  CommunityPost,
  CommunityPostUpload,
  CreateCommunityPost,
} from './types'
import { devConnectApi } from './baseApi'

export const communityApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getFeedStats: build.query<CommunityFeedStats, void>({
      query: () => '/api/users/posts/stats',
      providesTags: [{ type: 'Feed', id: 'STATS' }],
    }),
    listFeed: build.query<
      CommunityPost[],
      { category?: string; q?: string; tag?: string; sort?: string; limit?: number } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.category && params.category !== 'all') search.set('category', params.category)
        if (params?.q?.trim()) search.set('q', params.q.trim())
        if (params?.tag?.trim()) search.set('tag', params.tag.trim())
        if (params?.sort?.trim()) search.set('sort', params.sort.trim())
        search.set('limit', String(params?.limit ?? 50))
        return `/api/users/posts?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Feed' as const, id })),
              { type: 'Feed', id: 'LIST' },
            ]
          : [{ type: 'Feed', id: 'LIST' }],
    }),
    createPost: build.mutation<CommunityPost, CreateCommunityPost>({
      query: (body) => ({
        url: '/api/users/posts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Feed', id: 'LIST' },
        { type: 'Feed', id: 'STATS' },
        { type: 'Leaderboard', id: 'LIST' },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
    uploadPostFile: build.mutation<CommunityPostUpload, { file: File; kind: 'image' | 'attachment' }>({
      query: ({ file, kind }) => {
        const form = new FormData()
        form.append('file', file)
        form.append('kind', kind)
        return {
          url: '/api/users/posts/upload',
          method: 'POST',
          body: form,
        }
      },
    }),
    votePoll: build.mutation<CommunityPost, { postId: string; optionId: string }>({
      query: ({ postId, optionId }) => ({
        url: `/api/users/posts/${postId}/poll/vote`,
        method: 'POST',
        body: { optionId },
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: 'Feed', id: postId },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    likePost: build.mutation<CommunityPost, string>({
      query: (postId) => ({
        url: `/api/users/posts/${postId}/likes`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: 'Feed', id: postId },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    unlikePost: build.mutation<CommunityPost, string>({
      query: (postId) => ({
        url: `/api/users/posts/${postId}/likes`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: 'Feed', id: postId },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    savePost: build.mutation<CommunityPost, string>({
      query: (postId) => ({
        url: `/api/users/posts/${postId}/save`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: 'Feed', id: postId },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    unsavePost: build.mutation<CommunityPost, string>({
      query: (postId) => ({
        url: `/api/users/posts/${postId}/save`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: 'Feed', id: postId },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    listComments: build.query<CommunityComment[], string>({
      query: (postId) => `/api/users/posts/${postId}/comments`,
      providesTags: (_result, _error, postId) => [{ type: 'Feed', id: `${postId}-comments` }],
    }),
    addComment: build.mutation<
      CommunityComment,
      { postId: string; content: string; parentCommentId?: string }
    >({
      query: ({ postId, content, parentCommentId }) => ({
        url: `/api/users/posts/${postId}/comments`,
        method: 'POST',
        body: { content, parentCommentId: parentCommentId ?? null },
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: 'Feed', id: postId },
        { type: 'Feed', id: 'LIST' },
        { type: 'Feed', id: `${postId}-comments` },
        { type: 'Leaderboard', id: 'LIST' },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
    deleteComment: build.mutation<void, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({
        url: `/api/users/posts/${postId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: 'Feed', id: postId },
        { type: 'Feed', id: 'LIST' },
        { type: 'Feed', id: `${postId}-comments` },
      ],
    }),
  }),
})

export const {
  useGetFeedStatsQuery,
  useListFeedQuery,
  useCreatePostMutation,
  useUploadPostFileMutation,
  useVotePollMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useListCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = communityApi
