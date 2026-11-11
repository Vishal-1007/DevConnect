import type { BillingPlan } from '../api/types'

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    description: 'Full access to mentorship matching and premium sessions.',
    features: [
      'Unlimited Find Match sessions',
      'Priority mentor queue',
      'Mock interview credits (5/mo)',
      'Community Pro badge',
    ],
  },
  {
    id: 'pro-annual',
    name: 'Pro Annual',
    price: 249.99,
    currency: 'USD',
    interval: 'year',
    description: 'Best value — save ~30% vs monthly billing.',
    popular: true,
    features: [
      'Everything in Pro Monthly',
      '2 months free vs monthly',
      'Unlimited mock interviews',
      'Early access to new features',
    ],
  },
  {
    id: 'mentor-boost',
    name: 'Mentor Boost',
    price: 49.99,
    currency: 'USD',
    interval: 'month',
    description: 'For mentors — higher visibility and learner discovery.',
    features: [
      'Featured mentor placement',
      'Live session analytics',
      'Boosted matching priority',
      'Premium mentor badge',
    ],
  },
]

export function planById(planId: string): BillingPlan | undefined {
  return BILLING_PLANS.find((plan) => plan.id === planId)
}
