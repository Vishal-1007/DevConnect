import type { Conversation, Message } from './types'
import { devConnectApi } from './baseApi'

export const chatApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listConversations: build.query<Conversation[], void>({
      query: () => '/api/chats/conversations',
      providesTags: ['Conversations'],
    }),
    createConversation: build.mutation<
      Conversation,
      { participantIds: string[] }
    >({
      query: (body) => ({
        url: '/api/chats/conversations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Conversations'],
    }),
    listMessages: build.query<Message[], { conversationId: string; limit?: number }>({
      query: ({ conversationId, limit = 50 }) =>
        `/api/chats/conversations/${conversationId}/messages?limit=${limit}`,
      providesTags: (_result, _error, arg) => [
        { type: 'Messages', id: arg.conversationId },
      ],
    }),
    sendMessage: build.mutation<
      Message,
      { conversationId: string; content: string }
    >({
      query: ({ conversationId, content }) => ({
        url: `/api/chats/conversations/${conversationId}/messages`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Messages', id: arg.conversationId },
      ],
    }),
  }),
})

export const {
  useListConversationsQuery,
  useCreateConversationMutation,
  useListMessagesQuery,
  useSendMessageMutation,
} = chatApi
