import {
  RECRUITER_CONVERSATIONS,
  type ChatMessage,
  type RecruiterConversation,
} from '../data/recruiterMessagesData'

const STORAGE_KEY = 'dc_recruiter_messages'

export type ConversationTab = 'all' | 'unread' | 'starred'

function formatTimeNow(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function loadRecruiterConversations(): RecruiterConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RecruiterConversation[]) : structuredClone(RECRUITER_CONVERSATIONS)
  } catch {
    return structuredClone(RECRUITER_CONVERSATIONS)
  }
}

export function saveRecruiterConversations(conversations: RecruiterConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

export function filterConversations(
  conversations: RecruiterConversation[],
  tab: ConversationTab,
  search: string,
): RecruiterConversation[] {
  let list = [...conversations]

  if (tab === 'unread') list = list.filter((c) => c.unreadCount > 0)
  if (tab === 'starred') list = list.filter((c) => c.starred)

  const q = search.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (c) =>
        c.candidateName.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    )
  }

  return list.sort((a, b) => {
    const unreadDiff = b.unreadCount - a.unreadCount
    if (tab === 'all' && unreadDiff !== 0) return unreadDiff
    return a.candidateName.localeCompare(b.candidateName)
  })
}

export function sendMessage(
  conversations: RecruiterConversation[],
  conversationId: string,
  text: string,
): RecruiterConversation[] {
  const trimmed = text.trim()
  if (!trimmed) return conversations

  const msg: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'recruiter',
    text: trimmed,
    time: formatTimeNow(),
    read: true,
  }

  const next = conversations.map((c) => {
    if (c.id !== conversationId) return c
    return {
      ...c,
      messages: [...c.messages, msg],
      lastMessage: trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed,
      lastMessageTime: msg.time,
      unreadCount: 0,
    }
  })

  saveRecruiterConversations(next)
  return next
}

export function markConversationRead(
  conversations: RecruiterConversation[],
  conversationId: string,
): RecruiterConversation[] {
  const next = conversations.map((c) =>
    c.id === conversationId ? { ...c, unreadCount: 0 } : c,
  )
  saveRecruiterConversations(next)
  return next
}

export function toggleConversationStar(
  conversations: RecruiterConversation[],
  conversationId: string,
): RecruiterConversation[] {
  const next = conversations.map((c) =>
    c.id === conversationId ? { ...c, starred: !c.starred } : c,
  )
  saveRecruiterConversations(next)
  return next
}

export function saveConversationNotes(
  conversations: RecruiterConversation[],
  conversationId: string,
  notes: string,
): RecruiterConversation[] {
  const next = conversations.map((c) =>
    c.id === conversationId ? { ...c, recruiterNotes: notes } : c,
  )
  saveRecruiterConversations(next)
  return next
}

export function getUnreadTotal(conversations: RecruiterConversation[]): number {
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0)
}
