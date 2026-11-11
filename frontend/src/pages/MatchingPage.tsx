import { useState, type FormEvent } from 'react'
import {
  useCreateMatchRequestMutation,
  useListMatchRequestsQuery,
  useLazyGetMatchResultsQuery,
} from '../api/matchingApi'
import type { MatchResult } from '../api/types'
import { Alert, Button, Card, Input, PageTitle, Textarea } from '../components/ui'

export function MatchingPage() {
  const { data: requests, isLoading } = useListMatchRequestsQuery()
  const [createRequest, { isLoading: creating, error }] = useCreateMatchRequestMutation()
  const [fetchResults] = useLazyGetMatchResultsQuery()

  const [criteria, setCriteria] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('junior')
  const [skillsText, setSkillsText] = useState('java, react')
  const [resultsByRequest, setResultsByRequest] = useState<Record<string, MatchResult[]>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    await createRequest({
      criteria,
      experienceLevel: experienceLevel || undefined,
      skills,
    })
    setCriteria('')
  }

  async function loadResults(requestId: string) {
    const results = await fetchResults(requestId).unwrap()
    setResultsByRequest((prev) => ({ ...prev, [requestId]: results }))
  }

  return (
    <div className="max-w-3xl space-y-8">
      <PageTitle
        title="Skill-based matching"
        subtitle="Update your profile skills first, then request matches"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">What are you looking for?</label>
            <Textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              required
              rows={2}
              placeholder="e.g. Spring Boot mentor for interview prep"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Experience level</label>
              <Input
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Skills</label>
              <Input
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
              />
            </div>
          </div>
          <Alert error={error} />
          <Button type="submit" disabled={creating}>
            {creating ? 'Matching…' : 'Find matches'}
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Your requests</h2>
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {!isLoading && requests?.length === 0 && (
          <p className="text-slate-500 text-sm">No match requests yet.</p>
        )}
        <ul className="space-y-3">
          {requests?.map((req) => (
            <li key={req.id}>
              <Card className="!p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-slate-200">{req.criteria}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {req.status} · {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => loadResults(req.id)}
                  >
                    View results
                  </Button>
                </div>
                {resultsByRequest[req.id]?.length ? (
                  <ul className="mt-3 space-y-1 text-sm text-slate-400">
                    {resultsByRequest[req.id].map((r) => (
                      <li key={r.id}>
                        User {r.matchedUserId.slice(0, 8)}… — score {r.score}
                      </li>
                    ))}
                  </ul>
                ) : resultsByRequest[req.id] ? (
                  <p className="mt-2 text-sm text-slate-500">No matches found.</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
