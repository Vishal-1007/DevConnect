export const MODERATION_CATEGORIES = [
  'abusive_language',
  'spam',
  'hate_speech',
  'scam',
  'nsfw',
] as const

export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number]

export const categoryLabels: Record<ModerationCategory | 'manual_review', string> = {
  abusive_language: 'Abusive Language',
  spam: 'Spam',
  hate_speech: 'Hate Speech',
  scam: 'Scam',
  nsfw: 'NSFW',
  manual_review: 'Manual Review',
}

export const categoryColors: Record<ModerationCategory | 'manual_review', string> = {
  abusive_language: 'red',
  spam: 'amber',
  hate_speech: 'red',
  scam: 'orange',
  nsfw: 'purple',
  manual_review: 'blue',
}

export const statusLabels: Record<string, string> = {
  clear: 'Clear',
  flagged: 'Flagged',
  removed: 'Removed',
}

export const statusColors: Record<string, string> = {
  clear: 'green',
  flagged: 'amber',
  removed: 'red',
}
