import { devConnectApi } from './baseApi'

export interface FinancialTransaction {
  id: string
  transactionCode: string
  transactionType: string
  typeLabel: string
  payerUserId: string | null
  payerDisplayName: string
  payeeUserId: string | null
  payeeDisplayName: string
  amountCents: number
  amountLabel: string
  currency: string
  commissionCents: number
  commissionLabel: string
  platformRevenueCents: number
  platformRevenueLabel: string
  status: string
  statusLabel: string
  linkedPaymentId: string | null
  description: string | null
  createdAt: string
  dateLabel: string
}

export interface PaymentAnalytics {
  totalRevenueCents: number
  totalRevenueLabel: string
  monthlyRevenueCents: number
  monthlyRevenueLabel: string
  monthlyRevenueGrowthPct: number
  pendingPayoutCents: number
  pendingPayoutLabel: string
  platformCommissionCents: number
  platformCommissionLabel: string
  totalTransactions: number
  failedCount: number
  refundCount: number
  premiumUserCount: number
  activeSubscriptions: number
  transactionsByType: Record<string, number>
  revenueTrend: { label: string; amountCents: number }[]
}

export interface MentorPayout {
  id: string
  payoutCode: string
  mentorId: string
  mentorDisplayName: string
  amountCents: number
  amountLabel: string
  status: string
  failureReason: string | null
  createdAt: string
  completedAt: string | null
}

export interface PremiumSubscription {
  id: string
  userId: string
  username: string
  planId: string
  planName: string
  amountCents: number
  amountLabel: string
  status: string
  premium: boolean
  startedAt: string
  renewsAt: string | null
}

export const TX_TYPE_COLORS: Record<string, string> = {
  payment: 'blue',
  refund: 'amber',
  payout: 'purple',
  subscription: 'cyan',
  commission: 'gray',
}

export const TX_STATUS_COLORS: Record<string, string> = {
  completed: 'green',
  failed: 'red',
  pending: 'amber',
  refunded: 'gray',
}

export const adminPaymentsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminTransactions: build.query<
      FinancialTransaction[],
      { status?: string; type?: string; filter?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'all')
        if (params.type && params.type !== 'all') search.set('type', params.type)
        if (params.filter) search.set('filter', params.filter)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/payments/admin/transactions?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminPayments' as const, id })),
              { type: 'AdminPayments', id: 'LIST' },
            ]
          : [{ type: 'AdminPayments', id: 'LIST' }],
    }),
    getPaymentAnalytics: build.query<PaymentAnalytics, void>({
      query: () => '/api/payments/admin/analytics',
      providesTags: [{ type: 'AdminPayments', id: 'ANALYTICS' }],
    }),
    listMentorPayouts: build.query<MentorPayout[], { status?: string } | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('status', params?.status ?? 'all')
        return `/api/payments/admin/payouts?${search.toString()}`
      },
      providesTags: [{ type: 'AdminPayments', id: 'PAYOUTS' }],
    }),
    listPremiumSubscriptions: build.query<PremiumSubscription[], void>({
      query: () => '/api/payments/admin/subscriptions',
      providesTags: [{ type: 'AdminPayments', id: 'SUBS' }],
    }),
    getAdminTransaction: build.query<FinancialTransaction, string>({
      query: (id) => `/api/payments/admin/transactions/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminPayments', id }],
    }),
    refundTransaction: build.mutation<FinancialTransaction, string>({
      query: (id) => ({ url: `/api/payments/admin/transactions/${id}/refund`, method: 'POST' }),
      invalidatesTags: [
        { type: 'AdminPayments', id: 'LIST' },
        { type: 'AdminPayments', id: 'ANALYTICS' },
      ],
    }),
    retryTransaction: build.mutation<FinancialTransaction, string>({
      query: (id) => ({ url: `/api/payments/admin/transactions/${id}/retry`, method: 'POST' }),
      invalidatesTags: [
        { type: 'AdminPayments', id: 'LIST' },
        { type: 'AdminPayments', id: 'ANALYTICS' },
      ],
    }),
    processMentorPayout: build.mutation<MentorPayout, string>({
      query: (id) => ({ url: `/api/payments/admin/payouts/${id}/process`, method: 'POST' }),
      invalidatesTags: [
        { type: 'AdminPayments', id: 'PAYOUTS' },
        { type: 'AdminPayments', id: 'ANALYTICS' },
      ],
    }),
  }),
})

export const {
  useListAdminTransactionsQuery,
  useGetPaymentAnalyticsQuery,
  useListMentorPayoutsQuery,
  useListPremiumSubscriptionsQuery,
  useGetAdminTransactionQuery,
  useRefundTransactionMutation,
  useRetryTransactionMutation,
  useProcessMentorPayoutMutation,
} = adminPaymentsApi
