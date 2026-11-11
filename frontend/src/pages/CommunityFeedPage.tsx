import { useMemo, useState } from 'react'
import {
  Filter,
  Flame,
  Loader2,
  MessageSquare,
  Radio,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useGetFeedStatsQuery, useListFeedQuery } from '../api/communityApi'
import { useGetMyProfileQuery } from '../api/userApi'
import { useAppSelector } from '../hooks'
import { CommunityFeedSidebar } from '../components/community/CommunityFeedSidebar'
import { FeedComposer } from '../components/community/FeedComposer'
import { FeedPostCard } from '../components/community/FeedPostCard'
import { FeedSkeleton } from '../components/community/FeedSkeleton'
import { FALLBACK_TRENDING, FEED_CATEGORIES, FEED_TABS } from '../data/communityData'
import { useFollowedAuthors } from '../lib/communityFollows'
import { extractApiError } from '../lib/extractApiError'

const feedQueryOptions = {
  refetchOnFocus: false,
  refetchOnMountOrArgChange: true,
} as const

export function CommunityFeedPage() {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { data: profile } = useGetMyProfileQuery(undefined, { skip: !accessToken })
  const [category, setCategory] = useState('all')
  const [tab, setTab] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | undefined>()
  const [toast, setToast] = useState<string | null>(null)
  const { followedIds } = useFollowedAuthors()

  const feedSort = tab === 'popular' ? 'popular' : tab === 'latest' ? 'latest' : undefined
  const feedArgs = {
    category: category !== 'all' ? category : undefined,
    q: searchQuery || undefined,
    tag: tagFilter,
    sort: feedSort,
    limit: 50,
  }
  const queryOpts = { ...feedQueryOptions, skip: !accessToken }
  const { data: stats } = useGetFeedStatsQuery(undefined, queryOpts)
  const { data: posts, isLoading, isFetching, error, refetch } = useListFeedQuery(feedArgs, queryOpts)

  const displayedPosts = useMemo(() => {
    if (!posts) return []
    if (tab === 'following') {
      return posts.filter((post) => followedIds.has(post.authorId))
    }
    return posts
  }, [posts, tab, followedIds])

  const emptyFeedMessage =
    tab === 'following'
      ? followedIds.size === 0
        ? 'Follow developers to see their posts here. Use the Follow button on any post or in Suggested Connections.'
        : 'No posts from people you follow yet. Follow more developers to fill this feed.'
      : tab === 'popular'
        ? 'No popular posts yet. Like and comment on posts to boost engagement.'
        : 'Be the first to share something with the community.'

  const trendingTags = stats?.trendingTags?.length ? stats.trendingTags : FALLBACK_TRENDING

  const statCards = [
    {
      label: 'Total Posts',
      value: stats?.totalPosts ?? posts?.length ?? 0,
      icon: MessageSquare,
      color: 'text-[#818cf8]',
    },
    {
      label: 'Active Developers',
      value: stats?.activeDevelopers ?? 0,
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      label: 'Discussions',
      value: stats?.totalDiscussions ?? 0,
      icon: TrendingUp,
      color: 'text-blue-400',
    },
    {
      label: 'Trending Topics',
      value: stats?.trendingTopics ?? trendingTags.length,
      icon: Flame,
      color: 'text-amber-400',
    },
  ]

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl text-sm font-medium shadow-lg border bg-emerald-600/20 border-emerald-500/40 text-emerald-300">
          {toast}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-[#818cf8]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Developer Community</h1>
              <p className="text-sm text-[#8b8ca8] mt-1 max-w-2xl">
                Share knowledge, solve problems, and grow together with developers worldwide.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="dc-glass-card rounded-2xl p-4 text-center hover:border-[#6366f1]/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                <p className={`text-2xl font-bold ${s.color}`}>
                  {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <FeedComposer
            onPosted={() => showToast('Post published successfully')}
            onError={(msg) => showToast(msg)}
          />

          <div className="flex flex-wrap gap-2 mt-6 mb-3">
            {FEED_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? 'dc-gradient-btn text-white'
                    : 'dc-glass-card text-[#8b8ca8] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Search posts, tags, technologies… e.g. "JWT Spring Boot"'
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 px-3 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm sm:w-44 focus:outline-none focus:border-[#6366f1]"
            >
              {FEED_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="h-11 px-5 rounded-xl dc-gradient-btn text-white text-sm font-semibold shrink-0 flex items-center justify-center gap-2"
            >
              <Filter size={14} />
              Search
            </button>
          </form>

          <div className="dc-glass-card rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Trending Today</h2>
              {isFetching && !isLoading && (
                <Loader2 size={14} className="animate-spin text-[#8b8ca8] ml-auto" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((topic) => (
                <button
                  key={topic.tag}
                  type="button"
                  onClick={() => {
                    setTagFilter(tagFilter === topic.tag ? undefined : topic.tag)
                    setCategory('all')
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    tagFilter === topic.tag
                      ? 'bg-[#6366f1]/25 text-white border border-[#6366f1]/50'
                      : 'bg-[#161722]/60 text-[#8b8ca8] border border-[#2d2e3e] hover:text-white'
                  }`}
                >
                  #{topic.tag}
                  <span className="text-[#5c5d72] ml-1.5">
                    {(topic.postCount >= 1000
                      ? `${(topic.postCount / 1000).toFixed(1)}k`
                      : topic.postCount)} posts
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-red-300 flex-1">{extractApiError(error)}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && <FeedSkeleton />}

          {!isLoading && displayedPosts.length === 0 && (
            <div className="text-center py-16 dc-glass-card rounded-2xl">
              <Users className="w-12 h-12 text-[#6366f1] mx-auto mb-3 opacity-60" />
              <p className="text-white font-medium">No posts found</p>
              <p className="text-sm text-[#8b8ca8] mt-1">{emptyFeedMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {displayedPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                isOwnPost={post.authorId === profile?.id}
                currentUserId={profile?.id}
              />
            ))}
          </div>
        </div>

        <CommunityFeedSidebar posts={displayedPosts} />
      </div>
    </div>
  )
}
