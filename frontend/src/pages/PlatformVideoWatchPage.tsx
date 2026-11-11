import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Bookmark, Loader2, Play, Clock, Eye } from 'lucide-react'
import {
  useGetPlatformVideoQuery,
  useSavePlatformVideoMutation,
  useUnsavePlatformVideoMutation,
} from '../api/learningContentApi'
import { resolveStreamVideoSrc } from '../lib/streamUpload'
import { useAppSelector } from '../hooks'
import { apiUrl } from '../config'

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function PlatformVideoWatchPage() {
  const { videoId = '' } = useParams()
  const navigate = useNavigate()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { data: video, isLoading } = useGetPlatformVideoQuery(videoId, { skip: !videoId })
  const [save] = useSavePlatformVideoMutation()
  const [unsave] = useUnsavePlatformVideoMutation()

  if (isLoading || !video) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  const src = resolveStreamVideoSrc(video.videoUrl, accessToken)

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      <Link to="/learning-streams" className="inline-flex items-center gap-1 text-xs text-[#8b8ca8] hover:text-white">
        <ChevronLeft size={14} /> Back to Learning Streams
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-black rounded-xl overflow-hidden border border-[#2d2e3e] aspect-video">
            {src ? (
              <video key={video.id} src={src} controls autoPlay playsInline className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8b8ca8]">Video unavailable</div>
            )}
          </div>
          <div>
            <p className="text-xs text-violet-400 font-semibold">{video.categoryName}</p>
            <h1 className="text-xl font-bold text-white mt-1">{video.title}</h1>
            <p className="text-sm text-[#8b8ca8] mt-2">{video.description}</p>
            <div className="flex gap-4 mt-3 text-xs text-[#5c5d72]">
              <span className="flex items-center gap-1"><Eye size={12} />{video.viewCount} views</span>
              <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(video.durationSeconds)}</span>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <button type="button" onClick={() => (video.saved ? unsave(video.id) : save(video.id))}
              className="w-full flex items-center justify-center gap-2 border border-[#2d2e3e] text-[#8b8ca8] hover:text-amber-400 text-sm py-2.5 rounded-lg">
              <Bookmark size={14} /> {video.saved ? 'Saved' : 'Save for later'}
            </button>
          </div>

          {video.related.length > 0 && (
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
              <h2 className="text-xs font-bold text-white mb-3">Related videos</h2>
              <div className="space-y-3">
                {video.related.map((r) => (
                  <button key={r.id} type="button" onClick={() => navigate(`/learning-streams/watch/${r.id}`)}
                    className="w-full flex gap-2 text-left hover:bg-[#1c1d2a] rounded-lg p-2">
                    <div className="w-20 h-12 rounded bg-[#12131c] shrink-0 overflow-hidden relative">
                      {r.thumbnailUrl ? (
                        <img src={apiUrl(r.thumbnailUrl.startsWith('/') ? r.thumbnailUrl : `/${r.thumbnailUrl}`)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Play size={14} className="text-violet-400" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white line-clamp-2">{r.title}</p>
                      <p className="text-[10px] text-[#5c5d72] mt-0.5">{formatDuration(r.durationSeconds)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
