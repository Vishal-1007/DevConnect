import { Download, FileText } from 'lucide-react'
import type { MessageAttachment } from '../../../data/recruiterMessagesData'

type Props = {
  attachment: MessageAttachment
}

export function AttachmentPreview({ attachment }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
        <FileText size={18} className="text-red-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{attachment.name}</p>
        <p className="text-[11px] text-[#8b8ca8]">
          {attachment.fileType} · {attachment.size}
        </p>
      </div>
      <a
        href={attachment.url ?? '#'}
        download
        className="rounded-lg border border-white/10 bg-white/5 p-2 text-[#c4c5d6] hover:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <Download size={14} />
      </a>
    </div>
  )
}
