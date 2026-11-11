import { Zap, Users, TrendingUp, Globe } from 'lucide-react'
import { whyDevConnect } from '../../data/mockData'

const icons = {
  zap: Zap,
  users: Users,
  trending: TrendingUp,
  globe: Globe,
}

export function WhyDevConnect() {
  return (
    <section className="pt-6 border-t border-[#2d2e3e]">
      <h2 className="text-sm font-semibold text-[#8b8ca8] mb-4">Why DevConnect?</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {whyDevConnect.map((item) => {
          const Icon = icons[item.icon]
          return (
            <div
              key={item.title}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-[#161722]/60 border border-[#2d2e3e]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#6366f1]/20 flex items-center justify-center mb-2">
                <Icon className="w-5 h-5 text-[#818cf8]" />
              </div>
              <p className="text-xs font-medium text-[#b4b5c8]">{item.title}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
