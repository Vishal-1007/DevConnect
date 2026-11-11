import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Download, Bookmark, Loader2, Eye, ExternalLink } from 'lucide-react'
import {
  useGetLearningResourceQuery,
  useSaveLearningResourceMutation,
  useUnsaveLearningResourceMutation,
} from '../api/learningContentApi'
import { ResourcePdfViewer } from '../components/learning-resources/ResourcePdfViewer'
import { downloadResourceFile, resolveResourceDownloadUrl, resolveResourcePreviewUrl } from '../lib/resourceFile'
import { useAppSelector } from '../hooks'

export function LearningResourceDetailPage() {
  const { resourceId = '' } = useParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { data: resource, isLoading, refetch } = useGetLearningResourceQuery(resourceId, { skip: !resourceId })
  const [save] = useSaveLearningResourceMutation()
  const [unsave] = useUnsaveLearningResourceMutation()
  const [downloading, setDownloading] = useState(false)

  if (isLoading || !resource) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  const isPdf = resource.fileType === 'pdf'
  const downloadUrl = resolveResourceDownloadUrl(resource.downloadUrl)

  if (import.meta.env.DEV) {
    console.log('[LearningResourceDetail] fileUrl:', resource.fileUrl, 'downloadUrl:', resource.downloadUrl)
  }

  async function handleDownload() {
    if (!resource || !downloadUrl || !accessToken) return
    setDownloading(true)
    try {
      const filename = `${resource.title}.${resource.fileType ?? 'file'}`
      await downloadResourceFile(downloadUrl, accessToken, filename)
      refetch()
    } finally {
      setDownloading(false)
    }
  }

  function handleOpenInNewTab() {
    if (!resource) return
    const preview = resolveResourcePreviewUrl(resource.fileUrl, accessToken)
    if (preview) {
      window.open(preview, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      <Link to="/resources" className="inline-flex items-center gap-1 text-xs text-[#8b8ca8] hover:text-white">
        <ChevronLeft size={14} /> Back to resources
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <p className="text-xs text-violet-400 font-semibold">{resource.categoryName} · {resource.difficulty}</p>
            <h1 className="text-2xl font-bold text-white mt-1">{resource.title}</h1>
            <p className="text-sm text-[#8b8ca8] mt-2">{resource.description}</p>
          </div>

          <ResourcePdfViewer
            resourceId={resource.id}
            title={resource.title}
            previewUrl={resource.fileUrl}
            accessToken={accessToken}
            isPdf={isPdf}
            onDownload={handleDownload}
            onOpenInNewTab={handleOpenInNewTab}
          />
        </div>

        <aside className="space-y-4">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 space-y-3">
            {downloadUrl && (
              <button type="button" onClick={handleDownload} disabled={downloading || !accessToken}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg">
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download
              </button>
            )}
            <button type="button" onClick={handleOpenInNewTab}
              className="w-full flex items-center justify-center gap-2 border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-sm py-2.5 rounded-lg">
              <ExternalLink size={14} /> Open in new tab
            </button>
            <button type="button" onClick={() => (resource.saved ? unsave(resource.id) : save(resource.id))}
              className="w-full flex items-center justify-center gap-2 border border-[#2d2e3e] text-[#8b8ca8] hover:text-amber-400 text-sm py-2.5 rounded-lg">
              <Bookmark size={14} /> {resource.saved ? 'Saved' : 'Save for later'}
            </button>
            <div className="flex justify-between text-xs text-[#8b8ca8] pt-2 border-t border-[#2d2e3e]">
              <span className="flex items-center gap-1"><Eye size={12} />{resource.viewCount} views</span>
              <span className="flex items-center gap-1"><Download size={12} />{resource.downloadCount} downloads</span>
            </div>
            {resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {resource.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">#{t}</span>
                ))}
              </div>
            )}
          </div>

          {resource.related.length > 0 && (
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
              <h2 className="text-xs font-bold text-white mb-3">Related resources</h2>
              <div className="space-y-2">
                {resource.related.map((r) => (
                  <Link key={r.id} to={`/resources/${r.id}`}
                    className="block text-xs text-[#8b8ca8] hover:text-white py-2 border-b border-[#2d2e3e] last:border-0">
                    {r.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
