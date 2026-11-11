import type { AccountResponse, LoginResponse } from './types'
import { devConnectApi } from './baseApi'

export const authApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<
      LoginResponse,
      { username: string; email: string; password: string; role?: string }
    >({
      query: (body) => ({
        url: '/api/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: build.mutation<LoginResponse, { username: string; password: string }>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
    }),
    getMe: build.query<AccountResponse, void>({
      query: () => '/api/auth/me',
      providesTags: ['Account'],
    }),
  }),
})

export const { useRegisterMutation, useLoginMutation, useGetMeQuery, useLazyGetMeQuery } =
  authApi
