import { apiUrl } from '../config'
import type { CommunityPostUpload } from '../api/types'

export async function uploadCommunityFile(
  file: File,
  kind: 'image' | 'attachment',
  accessToken: string,
  onProgress?: (percent: number) => void,
): Promise<CommunityPostUpload> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('kind', kind)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', apiUrl('/api/users/posts/upload'))
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CommunityPostUpload)
        } catch {
          reject(new Error('Invalid upload response'))
        }
        return
      }
      let message = 'Something went wrong'
      try {
        const parsed = JSON.parse(xhr.responseText) as { message?: string }
        if (parsed.message) message = parsed.message
      } catch {
        // ignore
      }
      reject(new Error(message))
    }

    xhr.onerror = () => reject(new Error('Something went wrong'))
    xhr.send(form)
  })
}

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp'
export const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
    return 'Only PNG, JPG, JPEG, and WEBP images are supported'
  }
  if (file.size > MAX_IMAGE_BYTES) return 'Image size should be less than 5MB'
  return null
}

export function validateAttachmentFile(file: File): string | null {
  if (!file.name.match(/\.(pdf|docx?|txt|zip)$/i)) {
    return 'Only PDF, DOC, DOCX, TXT, and ZIP attachments are supported'
  }
  if (file.size > MAX_ATTACHMENT_BYTES) return 'Attachment size should be less than 20MB'
  return null
}
