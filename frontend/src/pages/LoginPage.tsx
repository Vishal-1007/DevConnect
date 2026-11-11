import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLazyGetMeQuery, useLoginMutation } from '../api/authApi'
import { useLazyGetMentorAccessQuery } from '../api/mentorApi'
import { useAppDispatch } from '../hooks'
import {
  resolvePostLoginPath,
  setSignInMode,
  getSignInMode,
  hasRecruiterRole,
  type SignInMode,
  SIGNIN_MODE_KEY,
} from '../lib/roles'
import { setAccount, setTokens } from '../store/authSlice'
import { getApiErrorMessage } from '../lib/apiError'

const MODES: { id: SignInMode; label: string; emoji: string }[] = [
  { id: 'candidate', label: 'Candidate', emoji: '👨‍💻' },
  { id: 'mentor', label: 'Mentor', emoji: '👨‍🏫' },
  { id: 'recruiter', label: 'Recruiter', emoji: '🏢' },
]

const MODE_COPY: Record<SignInMode, { title: string; subtitle: string; hint: string; badge: string }> = {
  candidate: {
    title: 'Welcome back',
    subtitle: 'Sign in to grow your developer career',
    hint: 'Admins signing in as Candidate open the Admin console.',
    badge: 'You\'ll be taken to your personal Dashboard after signing in.',
  },
  mentor: {
    title: 'Mentor Sign In',
    subtitle: 'Access your mentor workspace & teaching tools',
    hint: 'Approved mentors open the Mentor workspace.',
    badge: 'You\'ll be taken to the Mentor Dashboard after signing in.',
  },
  recruiter: {
    title: 'Recruiter Sign In',
    subtitle: 'Hire verified developers with DevScore',
    hint: 'Search ranked talent and manage your hiring pipeline.',
    badge: 'You\'ll be taken to the Recruiter Portal after signing in.',
  },
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [login, { isLoading, error }] = useLoginMutation()
  const [fetchMe] = useLazyGetMeQuery()
  const [fetchMentorAccess] = useLazyGetMentorAccessQuery()
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(() => {
    const state = location.state as { message?: string; recruiterAccessDenied?: boolean } | null
    return state?.recruiterAccessDenied ? state.message ?? 'Recruiter access denied.' : null
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<SignInMode>(() => getSignInMode())

  function switchMode(m: SignInMode) {
    setMode(m)
    setSignInMode(m)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setAccessDeniedMsg(null)
    try {
      const tokens = await login({ username, password }).unwrap()
      dispatch(setTokens(tokens))
      const account = await fetchMe().unwrap()
      dispatch(setAccount(account))
      const routerFrom = (location.state as { from?: { pathname: string } })?.from?.pathname

      let mentorAccessGranted = false
      if (mode === 'mentor') {
        const access = await fetchMentorAccess().unwrap()
        if (!access.canAccess) {
          localStorage.setItem(SIGNIN_MODE_KEY, 'candidate')
          setAccessDeniedMsg(access.message)
          return
        }
        mentorAccessGranted = true
      }

      if (mode === 'recruiter' && !hasRecruiterRole(account.roles)) {
        localStorage.setItem(SIGNIN_MODE_KEY, 'candidate')
        setAccessDeniedMsg(
          'This account is not a recruiter account. Register as a recruiter or sign in with a recruiter account (e.g. infosys.recruiter).',
        )
        return
      }

      navigate(
        resolvePostLoginPath(account.roles, mode, routerFrom, mentorAccessGranted),
        { replace: true },
      )
    } catch {
      /* error rendered below */
    }
  }

  const errorMsg = error ? getApiErrorMessage(error) : null
  const copy = MODE_COPY[mode]
  const modeIndex = MODES.findIndex((m) => m.id === mode)
  const isMentor = mode === 'mentor'
  const isRecruiter = mode === 'recruiter'

  return (
    <div className="w-full max-w-md rounded-2xl bg-[#161722] border border-[#2d2e3e] p-8 shadow-2xl">
      <div className="flex items-center justify-center mb-7">
        <div className="relative flex bg-[#0b0c14] border border-[#2d2e3e] rounded-xl p-1 w-full">
          <span
            aria-hidden
            className="absolute top-1 bottom-1 w-[calc(33.333%-5px)] rounded-lg transition-all duration-300 ease-in-out shadow-md"
            style={{
              background: isRecruiter
                ? 'linear-gradient(135deg, #2563eb, #0891b2)'
                : isMentor
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : 'linear-gradient(135deg, #6366f1, #a855f7)',
              left: `calc(${modeIndex * 33.333}% + 4px)`,
            }}
          />
          {MODES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => switchMode(opt.id)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                mode === opt.id ? 'text-white' : 'text-[#5c5d72] hover:text-[#8b8ca8]'
              }`}
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">{copy.title}</h1>
        <p className="text-sm text-[#8b8ca8] mt-1">{copy.subtitle}</p>
        <p className="text-[11px] text-violet-400/90 mt-1">{copy.hint}</p>
      </div>

      <div className={`mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 border text-xs ${
        isRecruiter
          ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
          : isMentor
            ? 'bg-violet-500/10 border-violet-500/25 text-violet-300'
            : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
      }`}>
        <span className="text-base">{MODES[modeIndex].emoji}</span>
        <span>{copy.badge}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#8b8ca8] mb-1.5">
            Username or email
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full h-11 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b8ca8] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full h-11 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {errorMsg && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        {accessDeniedMsg && (
          <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            {accessDeniedMsg} Apply for mentorship and wait for admin approval to sign in as a mentor.
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-50 hover:opacity-90 dc-gradient-btn"
        >
          {isLoading ? 'Signing in…' : `Sign in as ${MODES[modeIndex].label}`}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#8b8ca8]">
        No account?{' '}
        <Link to="/register" className="text-[#818cf8] font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
