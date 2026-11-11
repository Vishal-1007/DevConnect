import { CheckCheck } from 'lucide-react'
import type { ChatMessage } from '../../../data/recruiterMessagesData'
import { AttachmentPreview } from './AttachmentPreview'

type Props = {
  message: ChatMessage
  candidateAvatar: string
}

export function MessageBubble({ message, candidateAvatar }: Props) {
  const isRecruiter = message.sender === 'recruiter'

  return (
    <div className={`flex ${isRecruiter ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] gap-2 sm:max-w-[75%] ${isRecruiter ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isRecruiter && (
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
            {candidateAvatar}
          </div>
        )}
        <div>
          {message.dateLabel && (
            <p className="mb-3 text-center text-[11px] text-[#5c5d72]">{message.dateLabel}</p>
          )}
          <div
            className={`rounded-2xl px-4 py-2.5 ${
              isRecruiter
                ? 'rounded-br-md bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white'
                : 'rounded-bl-md border border-[#2d2e3e] bg-[#0b0c14]/80 text-[#e4e5f0]'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
            {message.attachment && (
              <div className="mt-2">
                <AttachmentPreview attachment={message.attachment} />
              </div>
            )}
          </div>
          <div className={`mt-1 flex items-center gap-1.5 ${isRecruiter ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-[#5c5d72]">{message.time}</span>
            {isRecruiter && message.read && (
              <CheckCheck size={12} className="text-blue-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
