import { devConnectApi } from './baseApi'

export interface Wallet {
  userId: string
  balanceCents: number
  currency: string
  balanceLabel: string
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  amountCents: number
  type: string
  description: string | null
  callId: string | null
  createdAt: string
}

export interface CallSession {
  id: string
  userId: string
  mentorId: string
  callType: 'AUDIO' | 'VIDEO'
  startTime: string
  endTime: string | null
  durationSeconds: number
  amountDeductedCents: number
  mentorEarningCents: number
  platformCommissionCents: number
  pricePerMinuteCents: number
  minutesBilled: number
  status: string
  walletBalanceCents: number
  lowBalanceWarning: boolean
  lowBalanceSecondsRemaining: number | null
}

export interface MarketplaceConfig {
  minPricePerMinuteCents: number
  maxPricePerMinuteCents: number
  platformSharePercent: number
}

export const walletApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getWallet: build.query<Wallet, void>({
      query: () => '/api/payments/wallet',
      providesTags: ['Wallet'],
    }),
    addWalletMoney: build.mutation<Wallet, { amountCents: number }>({
      query: (body) => ({ url: '/api/payments/wallet/add-money', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'WalletHistory'],
    }),
    getWalletHistory: build.query<WalletTransaction[], void>({
      query: () => '/api/payments/wallet/history',
      providesTags: ['WalletHistory'],
    }),
    startPaidCall: build.mutation<CallSession, { mentorId: string; callType: 'AUDIO' | 'VIDEO'; pricePerMinuteCents: number }>({
      query: (body) => ({ url: '/api/payments/calls/start', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'PaidCalls'],
    }),
    endPaidCall: build.mutation<CallSession, string>({
      query: (id) => ({ url: `/api/payments/calls/${id}/end`, method: 'POST' }),
      invalidatesTags: ['Wallet', 'PaidCalls', 'WalletHistory'],
    }),
    getPaidCall: build.query<CallSession, string>({
      query: (id) => `/api/payments/calls/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PaidCalls', id }],
    }),
    getPaidCallHistory: build.query<CallSession[], void>({
      query: () => '/api/payments/calls/history',
      providesTags: ['PaidCalls'],
    }),
    getMarketplaceConfig: build.query<MarketplaceConfig, void>({
      query: () => '/api/payments/marketplace/config',
    }),
    updateMarketplaceConfig: build.mutation<MarketplaceConfig, Partial<MarketplaceConfig>>({
      query: (body) => ({ url: '/api/payments/marketplace/config', method: 'PUT', body }),
    }),
    getMentorCallEarnings: build.query<CallSession[], void>({
      query: () => '/api/payments/marketplace/mentor/earnings',
      providesTags: ['PaidCalls'],
    }),
  }),
})

export const {
  useGetWalletQuery,
  useAddWalletMoneyMutation,
  useGetWalletHistoryQuery,
  useStartPaidCallMutation,
  useEndPaidCallMutation,
  useGetPaidCallQuery,
  useGetPaidCallHistoryQuery,
  useGetMarketplaceConfigQuery,
  useUpdateMarketplaceConfigMutation,
  useGetMentorCallEarningsQuery,
} = walletApi
