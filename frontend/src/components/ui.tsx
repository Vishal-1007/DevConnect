import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-slate-700/80 bg-slate-900/60 p-6 ${className}`}
    >
      {children}
    </div>
  )
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-400">{subtitle}</p>}
    </div>
  )
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${className}`}
      {...props}
    />
  )
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${className}`}
      {...props}
    />
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50',
    secondary:
      'border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
  }
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Alert({ error }: { error: unknown }) {
  if (!error) return null
  const message =
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: { message?: string } }).data?.message === 'string'
      ? (error as { data: { message: string } }).data.message
      : 'Something went wrong. Check that the API gateway and services are running.'
  return (
    <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  )
}
