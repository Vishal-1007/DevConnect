export type PlanId = 'free' | 'pro' | 'enterprise'

export type UsageMetric = {
  id: string
  label: string
  used: number
  limit: number
}

export type PricingPlan = {
  id: PlanId
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  missing?: string[]
  recommended?: boolean
  buttonLabel: string
  buttonVariant: 'current' | 'upgrade' | 'contact' | 'free'
}

export type CreditPackage = {
  credits: number
  price: number
  label?: string
  popular?: boolean
}

export type TeamSeatMember = {
  id: string
  name: string
  role: string
  avatar: string
  isAdmin?: boolean
}

export type PaymentRecord = {
  invoiceId: string
  date: string
  plan: string
  amount: string
  status: 'Paid' | 'Pending' | 'Failed'
}

export type FeatureComparisonRow = {
  feature: string
  free: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

export type RecruiterBillingData = {
  currentPlan: {
    id: PlanId
    name: string
    status: 'Active' | 'Expired' | 'Trial'
    renewal: string
  }
  usage: UsageMetric[]
  credits: {
    available: number
    uses: string[]
    packages: CreditPackage[]
  }
  teamSeats: {
    used: number
    total: number
    members: TeamSeatMember[]
  }
  plans: PricingPlan[]
  featureComparison: FeatureComparisonRow[]
  paymentHistory: PaymentRecord[]
  billingInfo: {
    company: string
    email: string
    gstNumber: string
    paymentMethod: string
  }
  premiumImpact: {
    candidatesFound: number
    candidatesFoundDelta: string
    timeSavedHours: number
    timeSavedDelta: string
    successfulHires: number
    hiresDelta: string
    avgDevScore: number
    avgRatingDelta: string
  }
}

export const DEFAULT_RECRUITER_BILLING: RecruiterBillingData = {
  currentPlan: {
    id: 'pro',
    name: 'Premium Recruiter',
    status: 'Active',
    renewal: 'Valid until Dec 2026',
  },
  usage: [
    { id: 'searches', label: 'Candidate Searches', used: 850, limit: 1000 },
    { id: 'messages', label: 'Messages Sent', used: 320, limit: 500 },
    { id: 'jobs', label: 'Job Posts', used: 8, limit: 20 },
    { id: 'ai-reports', label: 'AI Match Reports', used: 120, limit: 200 },
  ],
  credits: {
    available: 350,
    uses: [
      'Viewing premium candidates',
      'Downloading resumes',
      'AI reports',
    ],
    packages: [
      { credits: 100, price: 999 },
      { credits: 500, price: 3999, label: 'Most Popular', popular: true },
      { credits: 1000, price: 6999 },
    ],
  },
  teamSeats: {
    used: 3,
    total: 5,
    members: [
      { id: '1', name: 'Vishal Gupta', role: 'Technical Recruiter', avatar: 'VG', isAdmin: true },
      { id: '2', name: 'Rahul Sharma', role: 'HR Recruiter', avatar: 'RS' },
      { id: '3', name: 'Sneha Iyer', role: 'Talent Acquisition', avatar: 'SI' },
    ],
  },
  plans: [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '/month',
      description: 'For small hiring needs',
      features: [
        '2 Job Posts',
        '20 Candidate Searches/month',
        'Basic Candidate Profiles',
        'Limited Messaging',
        'Basic Filters',
      ],
      missing: ['DevScore Insights', 'AI Match Reports', 'Priority Candidates'],
      buttonLabel: 'Start Free',
      buttonVariant: 'free',
    },
    {
      id: 'pro',
      name: 'Pro Recruiter',
      price: '₹4999',
      period: '/month',
      description: 'For growing companies',
      recommended: true,
      features: [
        '20 Active Jobs',
        '1000 Candidate Searches',
        'Unlimited Messaging',
        'Full Candidate Profiles',
        'DevScore Analytics',
        'AI Match Score',
        'Interview Scheduling',
        'Talent Pool',
        'Priority Support',
      ],
      buttonLabel: 'Upgrade',
      buttonVariant: 'upgrade',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom Pricing',
      description: 'For large organizations',
      features: [
        'Unlimited Job Posts',
        'Unlimited Searches',
        'Multiple Recruiter Accounts',
        'API Integration',
        'Advanced Analytics',
        'Dedicated Support',
        'Custom Hiring Pipeline',
        'Company Branding',
      ],
      buttonLabel: 'Contact Sales',
      buttonVariant: 'contact',
    },
  ],
  featureComparison: [
    { feature: 'Job Posts', free: '2', pro: '20', enterprise: 'Unlimited' },
    { feature: 'Candidate Search', free: '20/mo', pro: '1000', enterprise: 'Unlimited' },
    { feature: 'DevScore Visibility', free: false, pro: true, enterprise: true },
    { feature: 'AI Match Reports', free: false, pro: true, enterprise: true },
    { feature: 'Mentor Reviews Access', free: false, pro: true, enterprise: true },
    { feature: 'Interview Scheduling', free: false, pro: true, enterprise: true },
    { feature: 'Talent Pool', free: false, pro: true, enterprise: true },
    { feature: 'Analytics', free: 'Basic', pro: 'Full', enterprise: 'Advanced' },
    { feature: 'Team Members', free: '1', pro: '5', enterprise: 'Unlimited' },
  ],
  paymentHistory: [
    {
      invoiceId: 'INV-1001',
      date: '12 Jun 2026',
      plan: 'Premium Recruiter',
      amount: '₹4999',
      status: 'Paid',
    },
    {
      invoiceId: 'INV-1000',
      date: '12 May 2026',
      plan: 'Premium Recruiter',
      amount: '₹4999',
      status: 'Paid',
    },
    {
      invoiceId: 'INV-0999',
      date: '12 Apr 2026',
      plan: 'Hiring Credits (500)',
      amount: '₹3999',
      status: 'Paid',
    },
    {
      invoiceId: 'INV-0998',
      date: '12 Mar 2026',
      plan: 'Premium Recruiter',
      amount: '₹4999',
      status: 'Paid',
    },
  ],
  billingInfo: {
    company: 'Infosys',
    email: 'billing@infosys.com',
    gstNumber: '29AABCI1234F1Z5',
    paymentMethod: 'VISA ****4242',
  },
  premiumImpact: {
    candidatesFound: 820,
    candidatesFoundDelta: '+18% this month',
    timeSavedHours: 120,
    timeSavedDelta: '+24% this month',
    successfulHires: 45,
    hiresDelta: '+12% this month',
    avgDevScore: 860,
    avgRatingDelta: '+0.3 this month',
  },
}
