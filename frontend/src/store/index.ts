import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { devConnectApi } from '../api/baseApi'
import '../api/authApi'
import '../api/userApi'
import '../api/userStatsApi'
import '../api/matchingApi'
import '../api/mentorApi'
import '../api/chatApi'
import '../api/adminLearningResourcesApi'
import '../api/adminLearningVideosApi'
import '../api/tutorialsApi'
import '../api/interviewMarketplaceApi'
import '../api/recruiterIntegrationsApi'
import '../api/recruiterCalendarApi'
import '../api/adminBookingsApi'
import '../api/adminPaymentsApi'
import '../api/adminReportsApi'
import '../api/adminMentorApplicationsApi'
import '../api/adminMentorsApi'
import '../api/pairProgrammingApi'
import '../api/codingProblemsApi'
import authReducer from './authSlice'
import matchSessionReducer from './matchSessionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    matchSession: matchSessionReducer,
    [devConnectApi.reducerPath]: devConnectApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(devConnectApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
