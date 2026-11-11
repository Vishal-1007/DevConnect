import type { UserProfile, UserProfileUpdate } from './types'
import { devConnectApi } from './baseApi'

export const userApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getMyProfile: build.query<UserProfile, void>({
      query: () => '/api/users/me',
      providesTags: ['Profile'],
    }),
    updateMyProfile: build.mutation<UserProfile, UserProfileUpdate>({
      query: (body) => ({
        url: '/api/users/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
    getProfile: build.query<UserProfile, string>({
      query: (id) => `/api/users/${id}`,
    }),
  }),
})

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} = userApi
