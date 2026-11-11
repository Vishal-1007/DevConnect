import { Link, Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0b0c14] flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl dc-gradient-btn flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl text-white">DevConnect</span>
      </Link>
      <Outlet />
    </div>
  )
}
