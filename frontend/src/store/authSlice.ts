import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AccountResponse } from '../api/types'

const ACCESS_KEY = 'devconnect_access_token'
const REFRESH_KEY = 'devconnect_refresh_token'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  account: AccountResponse | null
}

function loadToken(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const initialState: AuthState = {
  accessToken: loadToken(ACCESS_KEY),
  refreshToken: loadToken(REFRESH_KEY),
  account: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem(ACCESS_KEY, action.payload.accessToken)
      localStorage.setItem(REFRESH_KEY, action.payload.refreshToken)
    },
    setAccount(state, action: PayloadAction<AccountResponse | null>) {
      state.account = action.payload
    },
    logout(state) {
      state.accessToken = null
      state.refreshToken = null
      state.account = null
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    },
  },
})

export const { setTokens, setAccount, logout } = authSlice.actions
export default authSlice.reducer
