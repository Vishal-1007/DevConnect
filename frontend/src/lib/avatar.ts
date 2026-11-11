export function avatarUrl(name: string, size = 80): string {
  const encoded = encodeURIComponent(name || 'User')
  return `https://ui-avatars.com/api/?name=${encoded}&background=6366f1&color=fff&size=${size}`
}
