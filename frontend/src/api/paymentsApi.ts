import type {
  CheckoutPaymentRequest,
  ConfirmPaymentRequest,
  CreatePaymentIntentRequest,
  Payment,
  PaymentConfig,
  PaymentModeOption,
} from './types'
import { devConnectApi } from './baseApi'

export const paymentsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getPaymentConfig: build.query<PaymentConfig, void>({
      query: () => '/api/payments/config',
    }),
    listPaymentModes: build.query<PaymentModeOption[], void>({
      query: () => '/api/payments/modes',
    }),
    listPayments: build.query<Payment[], number | void>({
      query: (limit) => `/api/payments?limit=${limit ?? 20}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Payments' as const, id })),
              { type: 'Payments', id: 'LIST' },
            ]
          : [{ type: 'Payments', id: 'LIST' }],
    }),
    getPayment: build.query<Payment, string>({
      query: (paymentId) => `/api/payments/${paymentId}`,
      providesTags: (_result, _error, id) => [{ type: 'Payments', id }],
    }),
    checkoutPayment: build.mutation<Payment, CheckoutPaymentRequest>({
      query: (body) => ({
        url: '/api/payments/checkout',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Payments', id: 'LIST' },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
    createPaymentIntent: build.mutation<Payment, CreatePaymentIntentRequest>({
      query: (body) => ({
        url: '/api/payments/intents',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Payments', id: 'LIST' }],
    }),
    confirmPayment: build.mutation<
      Payment,
      { paymentId: string; body?: ConfirmPaymentRequest }
    >({
      query: ({ paymentId, body }) => ({
        url: `/api/payments/${paymentId}/confirm`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_result, _error, { paymentId }) => [
        { type: 'Payments', id: paymentId },
        { type: 'Payments', id: 'LIST' },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetPaymentConfigQuery,
  useListPaymentModesQuery,
  useListPaymentsQuery,
  useGetPaymentQuery,
  useCheckoutPaymentMutation,
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
} = paymentsApi
