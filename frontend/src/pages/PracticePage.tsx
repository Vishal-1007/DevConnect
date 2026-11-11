import { useParams, useSearchParams } from 'react-router-dom'
import { SoloPracticeRoom } from '../components/practice/SoloPracticeRoom'

export function PracticePage() {
  const { problemId = '' } = useParams<{ problemId: string }>()
  const [searchParams] = useSearchParams()
  const lang = searchParams.get('lang') ?? undefined

  if (!problemId) {
    return null
  }

  return <SoloPracticeRoom problemId={problemId} initialLanguage={lang} />
}
