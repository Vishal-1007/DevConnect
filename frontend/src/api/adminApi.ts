import type { AdminAccount } from './types'
import { devConnectApi } from './baseApi'

export const adminApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<AdminAccount[], void>({
      query: () => '/api/auth/admin/users',
      providesTags: ['AdminUsers'],
    }),

    updateUserRole: build.mutation<AdminAccount, { id: string; roles: string }>({
      query: ({ id, roles }) => ({
        url: `/api/auth/admin/users/${id}/role`,
        method: 'PATCH',
        body: { roles },
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    toggleUserEnabled: build.mutation<AdminAccount, string>({
      query: (id) => ({
        url: `/api/auth/admin/users/${id}/toggle-enabled`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
})

export const {
  useListUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserEnabledMutation,
} = adminApi
