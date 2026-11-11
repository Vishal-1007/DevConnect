import { X } from 'lucide-react'

interface ImageLightboxProps {
  src: string
  alt?: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-[#161722]/80 text-white hover:bg-[#6366f1]/30"
        aria-label="Close"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt={alt ?? 'Post image'}
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
