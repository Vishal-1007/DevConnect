import type {
  RecruiterPlanType,
  RecruiterSubscription,
  RecruiterUsageAction,
} from '../types/recruiterSubscription'
import { devConnectApi } from './baseApi'

export type ConfirmRecruiterUpgradeRequest = {
  planType: RecruiterPlanType
  orderId?: string
  paymentId?: string
  signature?: string
  idempotencyKey?: string
}

export const recruiterSubscriptionApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getRecruiterSubscription: build.query<RecruiterSubscription, void>({
      query: () => '/api/payments/recruiter/subscription',
      providesTags: [{ type: 'RecruiterSubscription', id: 'CURRENT' }],
    }),
    consumeRecruiterUsage: build.mutation<
      RecruiterSubscription,
      { action: RecruiterUsageAction }
    >({
      query: (body) => ({
        url: '/api/payments/recruiter/subscription/usage/consume',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'RecruiterSubscription', id: 'CURRENT' }],
    }),
    syncRecruiterJobCount: build.mutation<RecruiterSubscription, { activeJobCount: number }>({
      query: (body) => ({
        url: '/api/payments/recruiter/subscription/sync-jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'RecruiterSubscription', id: 'CURRENT' }],
    }),
    createRecruiterUpgradeOrder: build.mutation<
      { orderId: string; amount: number; currency: string; keyId: string; description: string },
      { planType: RecruiterPlanType }
    >({
      query: ({ planType }) => ({
        url: `/api/payments/recruiter/subscription/upgrade/order?planType=${planType}`,
        method: 'POST',
      }),
    }),
    confirmRecruiterUpgrade: build.mutation<RecruiterSubscription, ConfirmRecruiterUpgradeRequest>({
      query: (body) => ({
        url: '/api/payments/recruiter/subscription/upgrade/confirm',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'RecruiterSubscription', id: 'CURRENT' }],
    }),
  }),
})

export const {
  useGetRecruiterSubscriptionQuery,
  useConsumeRecruiterUsageMutation,
  useSyncRecruiterJobCountMutation,
  useCreateRecruiterUpgradeOrderMutation,
  useConfirmRecruiterUpgradeMutation,
} = recruiterSubscriptionApi
