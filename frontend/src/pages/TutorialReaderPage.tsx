import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Bookmark, ChevronLeft, ChevronRight, Loader2, Lock, Menu, ShoppingCart, X,
} from 'lucide-react'
import {
  useAddTutorialToCartMutation,
  useBookmarkTutorialTopicMutation,
  useCompleteTutorialTopicMutation,
  usePurchaseTutorialMutation,
  useReadTutorialQuery,
  useSaveTutorialMutation,
  useUnsaveTutorialMutation,
} from '../api/tutorialsApi'
import { useCheckoutPaymentMutation } from '../api/paymentsApi'
import { TutorialContentView } from '../components/tutorials/TutorialContentView'

type TutorialReaderPageProps = {
  basePath: string
}

export function TutorialReaderPage({ basePath }: TutorialReaderPageProps) {
  const { tutorialId = '', topicId } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { data, isLoading, refetch } = useReadTutorialQuery(
    { tutorialId, topicId },
    { skip: !tutorialId },
  )
  const [completeTopic] = useCompleteTutorialTopicMutation()
  const [saveTutorial] = useSaveTutorialMutation()
  const [unsaveTutorial] = useUnsaveTutorialMutation()
  const [bookmarkTopic] = useBookmarkTutorialTopicMutation()
  const [checkout] = useCheckoutPaymentMutation()
  const [purchase] = usePurchaseTutorialMutation()
  const [addToCart] = useAddTutorialToCartMutation()
  const [buying, setBuying] = useState(false)

  if (isLoading || !data) {
    return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
  }

  async function handleBuy() {
    if (!data) return
    setBuying(true)
    try {
      const payment = await checkout({
        payment: {
          amount: data.priceCents / 100,
          currency: 'INR',
          description: `Unlock ${data.title}`,
          paymentMode: 'CARD',
          idempotencyKey: `tutorial-${data.id}-${Date.now()}`,
        },
        simulatedOutcome: 'SUCCESS',
      }).unwrap()
      await purchase({ tutorialId: data.id, paymentId: payment.id }).unwrap()
      refetch()
    } finally {
      setBuying(false)
    }
  }

  const topic = data.topic

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {sidebarOpen && (
        <aside className="w-72 shrink-0 border-r border-[#2d2e3e] bg-[#12131c] overflow-y-auto">
          <div className="p-4 border-b border-[#2d2e3e]">
            <Link to={basePath} className="text-[11px] text-[#8b8ca8] hover:text-white inline-flex items-center gap-1"><ChevronLeft size={12} /> Back</Link>
            <h2 className="text-sm font-bold text-white mt-2">{data.title}</h2>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-[#8b8ca8] mb-1">
                <span>{data.completedTopics} / {data.totalTopics} topics</span>
                <span>{data.progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-[#2d2e3e] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.progressPercent}%` }} />
              </div>
            </div>
          </div>
          <nav className="p-3 space-y-4">
            {data.sections.map((section) => (
              <div key={section.id}>
                <p className="text-[11px] font-bold text-violet-300 px-2 mb-1">{section.title}</p>
                <div className="space-y-0.5">
                  {section.topics.map((t) => (
                    <Link key={t.id} to={`${basePath}/${data.id}/${t.id}`}
                      className={`block text-[11px] px-3 py-1.5 rounded-lg ${data.currentTopicId === t.id ? 'bg-violet-500/15 text-white font-semibold' : 'text-[#8b8ca8] hover:text-white hover:bg-[#161722]'}`}>
                      {t.completed ? '✓ ' : ''}{t.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2d2e3e] bg-[#161722]">
          <button type="button" onClick={() => setSidebarOpen((v) => !v)} className="p-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8]">
            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
          <div className="flex-1" />
          <button type="button" onClick={() => (data.saved ? unsaveTutorial(data.id) : saveTutorial(data.id))}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white inline-flex items-center gap-1">
            <Bookmark size={12} /> {data.saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {data.locked ? (
            <div className="max-w-lg mx-auto mt-16 bg-[#161722] border border-amber-500/30 rounded-xl p-8 text-center space-y-4">
              <Lock size={32} className="text-amber-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Premium Tutorial</h2>
              <p className="text-sm text-[#8b8ca8]">Unlock this tutorial to continue learning.</p>
              <p className="text-2xl font-bold text-emerald-400">₹{(data.priceCents / 100).toFixed(0)}</p>
              <div className="flex justify-center gap-2">
                <button type="button" disabled={buying} onClick={handleBuy}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg">
                  {buying ? 'Processing…' : 'Buy Now'}
                </button>
                <button type="button" onClick={() => addToCart(data.id)}
                  className="border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-sm px-4 py-2.5 rounded-lg inline-flex items-center gap-1">
                  <ShoppingCart size={14} /> Add To Cart
                </button>
              </div>
            </div>
          ) : topic ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <p className="text-xs text-violet-400 font-semibold">{topic.sectionTitle}</p>
                <h1 className="text-2xl font-bold text-white mt-1">{topic.title}</h1>
              </div>
              <TutorialContentView html={topic.htmlContent} />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2d2e3e]">
                <button type="button" disabled={!topic.previousTopicId}
                  onClick={() => topic.previousTopicId && navigate(`${basePath}/${data.id}/${topic.previousTopicId}`)}
                  className="inline-flex items-center gap-1 text-sm text-[#8b8ca8] hover:text-white disabled:opacity-40">
                  <ChevronLeft size={16} /> Previous
                </button>
                <button type="button" onClick={() => bookmarkTopic({ tutorialId: data.id, topicId: topic.id })}
                  className="text-xs border border-[#2d2e3e] text-[#8b8ca8] hover:text-amber-400 px-3 py-1.5 rounded-lg">
                  {topic.bookmarked ? 'Bookmarked' : 'Bookmark Topic'}
                </button>
                <button type="button" onClick={() => completeTopic({ tutorialId: data.id, topicId: topic.id })}
                  className="text-xs bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 px-3 py-1.5 rounded-lg">
                  Mark Complete
                </button>
                <button type="button" disabled={!topic.nextTopicId}
                  onClick={() => topic.nextTopicId && navigate(`${basePath}/${data.id}/${topic.nextTopicId}`)}
                  className="inline-flex items-center gap-1 text-sm text-[#8b8ca8] hover:text-white disabled:opacity-40">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#8b8ca8] text-center py-20">This tutorial has no topics yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
