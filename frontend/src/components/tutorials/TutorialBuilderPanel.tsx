import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronRight, Loader2, Plus, Save, Send } from 'lucide-react'
import {
  useCreateAdminSectionMutation,
  useCreateAdminTopicMutation,
  useCreateAdminTutorialMutation,
  useCreateMentorSectionMutation,
  useCreateMentorTopicMutation,
  useCreateMentorTutorialMutation,
  useGetAdminTutorialQuery,
  useGetMentorTutorialQuery,
  useListAdminTutorialsQuery,
  useListMentorTutorialsQuery,
  usePublishAdminTutorialMutation,
  usePublishMentorTutorialMutation,
  useSaveAdminTopicContentMutation,
  useSaveMentorTopicContentMutation,
  useUpdateAdminTutorialMutation,
  useUpdateMentorTutorialMutation,
} from '../../api/tutorialsApi'
import { RichTextEditor } from './RichTextEditor'
import { MentorPanelShell } from '../mentor/MentorPanelShell'

type Mode = 'admin' | 'mentor'

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const CATEGORIES = ['Java', 'Python', 'JavaScript', 'SQL', 'React', 'Spring Boot', 'DevOps', 'System Design']

export function TutorialBuilderPanel({ mode }: { mode: Mode }) {
  const isAdmin = mode === 'admin'
  const { data: adminList, isLoading: adminListLoading } = useListAdminTutorialsQuery(undefined, { skip: !isAdmin })
  const { data: mentorList, isLoading: mentorListLoading } = useListMentorTutorialsQuery(undefined, { skip: isAdmin })
  const list = isAdmin ? adminList : mentorList
  const listLoading = isAdmin ? adminListLoading : mentorListLoading

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [draftHtml, setDraftHtml] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: adminTutorial, isFetching: adminFetching } = useGetAdminTutorialQuery(selectedId!, { skip: !isAdmin || !selectedId })
  const { data: mentorTutorial, isFetching: mentorFetching } = useGetMentorTutorialQuery(selectedId!, { skip: isAdmin || !selectedId })
  const tutorial = isAdmin ? adminTutorial : mentorTutorial
  const fetching = isAdmin ? adminFetching : mentorFetching

  const [createAdmin] = useCreateAdminTutorialMutation()
  const [createMentor] = useCreateMentorTutorialMutation()
  const [updateAdmin] = useUpdateAdminTutorialMutation()
  const [updateMentor] = useUpdateMentorTutorialMutation()
  const [publishAdmin] = usePublishAdminTutorialMutation()
  const [publishMentor] = usePublishMentorTutorialMutation()
  const [createAdminSection] = useCreateAdminSectionMutation()
  const [createMentorSection] = useCreateMentorSectionMutation()
  const [createAdminTopic] = useCreateAdminTopicMutation()
  const [createMentorTopic] = useCreateMentorTopicMutation()
  const [saveAdminContent] = useSaveAdminTopicContentMutation()
  const [saveMentorContent] = useSaveMentorTopicContentMutation()

  const selectedTopic = useMemo(() => {
    if (!tutorial || !selectedTopicId) return null
    for (const section of tutorial.sections) {
      const topic = section.topics.find((t) => t.id === selectedTopicId)
      if (topic) return { section, topic }
    }
    return null
  }, [tutorial, selectedTopicId])

  useEffect(() => {
    if (selectedTopic) setDraftHtml(selectedTopic.topic.htmlContent || '')
  }, [selectedTopic?.topic.id, selectedTopic?.topic.htmlContent])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      title: String(fd.get('title')),
      description: String(fd.get('description') || ''),
      category: String(fd.get('category') || ''),
      difficulty: String(fd.get('difficulty')),
      tags: String(fd.get('tags') || ''),
      courseType: String(fd.get('courseType')) as 'FREE' | 'PAID',
      priceCents: Math.round(Number(fd.get('price') || 0) * 100),
    }
    const created = isAdmin ? await createAdmin(payload).unwrap() : await createMentor(payload).unwrap()
    setSelectedId(created.id)
    setShowCreate(false)
  }

  async function saveMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tutorial) return
    const fd = new FormData(e.currentTarget)
    const body = {
      title: String(fd.get('title')),
      description: String(fd.get('description') || ''),
      category: String(fd.get('category') || ''),
      difficulty: String(fd.get('difficulty')),
      tags: String(fd.get('tags') || ''),
      courseType: String(fd.get('courseType')) as 'FREE' | 'PAID',
      priceCents: Math.round(Number(fd.get('price') || 0) * 100),
    }
    if (isAdmin) await updateAdmin({ id: tutorial.id, body }).unwrap()
    else await updateMentor({ id: tutorial.id, body }).unwrap()
  }

  async function saveContent() {
    if (!tutorial || !selectedTopicId) return
    const args = { tutorialId: tutorial.id, topicId: selectedTopicId, htmlContent: draftHtml }
    if (isAdmin) await saveAdminContent(args).unwrap()
    else await saveMentorContent(args).unwrap()
  }

  return (
    <MentorPanelShell>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen size={18} className="text-violet-400" /> Tutorial Builder</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Create W3Schools-style tutorials with sections, topics, and rich content</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg">
          <Plus size={14} /> New Tutorial
        </button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4 min-h-[640px]">
        <aside className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3 space-y-2">
          {listLoading && <Loader2 size={18} className="animate-spin text-violet-400 mx-auto" />}
          {(list ?? []).map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setSelectedTopicId(null) }}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs ${selectedId === item.id ? 'border-violet-500/40 bg-violet-500/10 text-white' : 'border-transparent text-[#8b8ca8] hover:bg-[#12131c]'}`}>
              <p className="font-semibold truncate">{item.title}</p>
              <p className="text-[10px] mt-0.5 uppercase">{item.status} · {item.courseType}</p>
            </button>
          ))}
        </aside>

        <div className="space-y-4">
          {!tutorial && !showCreate && (
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-10 text-center text-sm text-[#8b8ca8]">
              Select a tutorial or create a new one.
            </div>
          )}

          {showCreate && (
            <form onSubmit={handleCreate} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 grid md:grid-cols-2 gap-3">
              <input name="title" required placeholder="Tutorial name" className="md:col-span-2 bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
              <textarea name="description" placeholder="Description" className="md:col-span-2 bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white min-h-[80px]" />
              <select name="category" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select name="difficulty" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input name="tags" placeholder="Tags (comma separated)" className="md:col-span-2 bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
              <select name="courseType" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
                <option value="FREE">FREE</option>
                <option value="PAID">PAID</option>
              </select>
              <input name="price" type="number" min="0" step="0.01" placeholder="Price (₹)" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg">Create Tutorial</button>
                <button type="button" onClick={() => setShowCreate(false)} className="border border-[#2d2e3e] text-[#8b8ca8] text-xs px-4 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          )}

          {tutorial && (
            <>
              <form onSubmit={saveMeta} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 grid md:grid-cols-2 gap-3">
                <input name="title" defaultValue={tutorial.title} required className="md:col-span-2 bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
                <textarea name="description" defaultValue={tutorial.description ?? ''} className="md:col-span-2 bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white min-h-[72px]" />
                <select name="category" defaultValue={tutorial.category ?? CATEGORIES[0]} className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="difficulty" defaultValue={tutorial.difficulty} className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input name="tags" defaultValue={tutorial.tags.join(', ')} className="md:col-span-2 bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
                <select name="courseType" defaultValue={tutorial.courseType} className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="FREE">FREE</option>
                  <option value="PAID">PAID</option>
                </select>
                <input name="price" type="number" min="0" step="0.01" defaultValue={(tutorial.priceCents / 100).toFixed(2)} className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button type="submit" className="inline-flex items-center gap-1 bg-[#2d2e3e] hover:bg-[#3a3b4f] text-white text-xs font-bold px-3 py-2 rounded-lg"><Save size={13} /> Save Details</button>
                  <button type="button" onClick={() => (isAdmin ? publishAdmin(tutorial.id) : publishMentor(tutorial.id))}
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg"><Send size={13} /> Publish</button>
                </div>
              </form>

              <div className="grid lg:grid-cols-[220px_1fr] gap-4">
                <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3 space-y-3">
                  <button type="button" onClick={async () => {
                    const title = window.prompt('Section title')
                    if (!title) return
                    if (isAdmin) await createAdminSection({ tutorialId: tutorial.id, title }).unwrap()
                    else await createMentorSection({ tutorialId: tutorial.id, title }).unwrap()
                  }} className="w-full text-xs font-bold border border-dashed border-[#2d2e3e] text-[#8b8ca8] hover:text-white py-2 rounded-lg">+ Add Section</button>
                  {fetching && <Loader2 size={16} className="animate-spin text-violet-400 mx-auto" />}
                  {tutorial.sections.map((section) => (
                    <div key={section.id}>
                      <p className="text-[11px] font-bold text-violet-300 mb-1">{section.title}</p>
                      <div className="space-y-1 ml-1">
                        {section.topics.map((topic) => (
                          <button key={topic.id} type="button" onClick={() => { setSelectedTopicId(topic.id); setDraftHtml(topic.htmlContent || '') }}
                            className={`w-full text-left text-[11px] px-2 py-1 rounded ${selectedTopicId === topic.id ? 'bg-violet-500/15 text-white' : 'text-[#8b8ca8] hover:text-white'}`}>
                            {topic.title}
                          </button>
                        ))}
                        <button type="button" onClick={async () => {
                          const title = window.prompt('Topic title')
                          if (!title) return
                          if (isAdmin) await createAdminTopic({ tutorialId: tutorial.id, sectionId: section.id, title }).unwrap()
                          else await createMentorTopic({ tutorialId: tutorial.id, sectionId: section.id, title }).unwrap()
                        }} className="text-[10px] text-emerald-400 hover:text-emerald-300 px-2">+ Add topic</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {selectedTopic ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white">{selectedTopic.section.title} <ChevronRight size={12} className="inline" /> {selectedTopic.topic.title}</p>
                        <button type="button" onClick={saveContent} className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg"><Save size={13} /> Save Content</button>
                      </div>
                      <RichTextEditor value={draftHtml} onChange={setDraftHtml} />
                    </>
                  ) : (
                    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-8 text-center text-sm text-[#8b8ca8]">
                      Select a topic to edit its content.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </MentorPanelShell>
  )
}
