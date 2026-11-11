import { useState, type FormEvent } from 'react'
import {
  useListConversationsQuery,
  useListMessagesQuery,
  useSendMessageMutation,
  useCreateConversationMutation,
} from '../api/chatApi'
import { useAppSelector } from '../hooks'
import { Alert, Button, Card, Input, PageTitle } from '../components/ui'

export function ChatPage() {
  const accountId = useAppSelector((s) => s.auth.account?.id)
  const { data: conversations, isLoading, error } = useListConversationsQuery()
  const [createConversation, { isLoading: creating }] = useCreateConversationMutation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: messages, refetch } = useListMessagesQuery(
    { conversationId: selectedId! },
    { skip: !selectedId }
  )
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation()
  const [content, setContent] = useState('')
  const [peerId, setPeerId] = useState('')

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!selectedId || !content.trim()) return
    await sendMessage({ conversationId: selectedId, content: content.trim() })
    setContent('')
    refetch()
  }

  async function startConversation(e: FormEvent) {
    e.preventDefault()
    if (!peerId.trim()) return
    const conv = await createConversation({
      participantIds: [peerId.trim()],
    }).unwrap()
    setSelectedId(conv.id)
    setPeerId('')
  }

  return (
    <div>
      <PageTitle title="Chat" subtitle="Conversations via the API gateway" />
      <Alert error={error} />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 !p-4">
          <h2 className="font-semibold text-slate-200 mb-3">Conversations</h2>
          {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {conversations?.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedId === c.id
                      ? 'bg-teal-500/20 text-teal-200'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {c.participants
                    .filter((p) => p !== accountId)
                    .map((p) => p.slice(0, 8))
                    .join(', ') || 'Conversation'}{' '}
                  <span className="text-slate-600">({c.participants.length})</span>
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={startConversation} className="mt-4 space-y-2 border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-500">Start chat (peer user UUID)</p>
            <Input
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
              placeholder="Participant UUID"
            />
            <Button type="submit" variant="secondary" disabled={creating} className="w-full">
              New conversation
            </Button>
          </form>
        </Card>
        <Card className="lg:col-span-2 !p-4 flex flex-col min-h-[360px]">
          {!selectedId ? (
            <p className="text-slate-500 text-sm">Select or start a conversation.</p>
          ) : (
            <>
              <ul className="flex-1 overflow-y-auto space-y-2 mb-4">
                {messages
                  ?.slice()
                  .reverse()
                  .map((m) => (
                    <li
                      key={m.id}
                      className={`text-sm max-w-[85%] rounded-lg px-3 py-2 ${
                        m.senderId === accountId
                          ? 'ml-auto bg-teal-600/30 text-teal-100'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {m.content}
                    </li>
                  ))}
              </ul>
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1"
                />
                <Button type="submit" disabled={sending}>
                  Send
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
