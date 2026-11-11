import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useRegisterMutation } from '../api/authApi'
import { useLazyGetMeQuery } from '../api/authApi'
import { useAppDispatch } from '../hooks'
import { setAccount, setTokens } from '../store/authSlice'
import { getApiErrorMessage } from '../lib/apiError'
import {
  mapSignupRoleToApi,
  resolveSignupRedirect,
  setSignInMode,
  type SignupRole,
} from '../lib/roles'

const ROLE_CARDS: {
  id: SignupRole
  emoji: string
  title: string
  description: string[]
  button: string
}[] = [
  {
    id: 'candidate',
    emoji: '👨‍💻',
    title: 'Grow Your Developer Career',
    description: [
      'Practice AI interviews',
      'Improve skills',
      'Get mentor reviews',
      'Build ranking',
      'Find jobs',
    ],
    button: 'Join as Candidate',
  },
  {
    id: 'mentor',
    emoji: '👨‍🏫',
    title: 'Guide Future Developers',
    description: [
      'Take mock interviews',
      'Review code',
      'Provide feedback',
      'Rate candidates',
    ],
    button: 'Join as Mentor',
  },
  {
    id: 'recruiter',
    emoji: '🏢',
    title: 'Hire Verified Developers',
    description: [
      'Search ranked candidates',
      'View DevScore',
      'Post jobs',
      'Hire faster',
    ],
    button: 'Join as Recruiter',
  },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [register, { isLoading, error }] = useRegisterMutation()
  const [fetchMe] = useLazyGetMeQuery()
  const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedRole) return

    setSubmitError(null)
    setAccountAlreadyExists(false)

    const normalizedUsername = username.trim()
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const tokens = await register({
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        role: mapSignupRoleToApi(selectedRole),
      }).unwrap()

      dispatch(setTokens(tokens))
      setSignInMode(selectedRole)

      try {
        const account = await fetchMe().unwrap()
        dispatch(setAccount(account))
      } catch {
        // Registration succeeded — account exists even if /me is temporarily unavailable.
      }

      navigate(resolveSignupRedirect(selectedRole), { replace: true })
    } catch (err) {
      const fetchError = err as FetchBaseQueryError
      setSubmitError(getApiErrorMessage(err))
      setAccountAlreadyExists(fetchError.status === 409)
    }
  }

  const errorMsg = submitError ?? (error ? getApiErrorMessage(error) : null)

  if (!selectedRole) {
    return (
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Join DevConnect</h1>
          <p className="text-sm text-[#8b8ca8] mt-1">Choose how you want to grow or hire on the platform</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedRole(card.id)}
              className="group flex flex-col rounded-2xl border border-[#2d2e3e] bg-[#161722]/80 p-6 text-left backdrop-blur-md transition-all duration-200 hover:border-violet-500/40 hover:bg-[#161722] hover:shadow-lg hover:shadow-violet-500/10"
            >
              <span className="text-3xl">{card.emoji}</span>
              <h2 className="mt-4 text-lg font-bold text-white group-hover:text-violet-200">
                {card.id === 'candidate' ? 'Candidate' : card.id === 'mentor' ? 'Mentor' : 'Recruiter'}
              </h2>
              <p className="mt-1 text-sm font-medium text-violet-300">{card.title}</p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {card.description.map((line) => (
                  <li key={line} className="text-xs text-[#8b8ca8]">
                    {line}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white group-hover:opacity-90">
                {card.button}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#8b8ca8]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#818cf8] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    )
  }

  const card = ROLE_CARDS.find((c) => c.id === selectedRole)!

  return (
    <div className="w-full max-w-md rounded-2xl bg-[#161722] border border-[#2d2e3e] p-8 shadow-2xl">
      <button
        type="button"
        onClick={() => setSelectedRole(null)}
        className="mb-4 text-xs text-[#8b8ca8] hover:text-violet-300"
      >
        ← Choose a different role
      </button>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{card.emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-white">Create {card.id} account</h1>
          <p className="text-sm text-[#8b8ca8]">{card.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#8b8ca8] mb-1.5">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            className="w-full h-11 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b8ca8] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-11 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b8ca8] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full h-11 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
          />
        </div>
        {errorMsg && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 space-y-2">
            <p>{errorMsg}</p>
            {accountAlreadyExists && (
              <p className="text-xs text-red-300/90">
                This account may already be registered from a previous attempt.{' '}
                <Link to="/login" className="font-semibold text-[#818cf8] hover:underline">
                  Log in instead
                </Link>
              </p>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-lg dc-gradient-btn text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Creating…' : card.button}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#8b8ca8]">
        Already have an account?{' '}
        <Link to="/login" className="text-[#818cf8] font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
