import { devConnectApi } from './baseApi'

export interface MarketplaceMentor {
  mentorId: string
  displayName: string
  profileImageUrl: string | null
  designation: string
  company: string
  experienceYears: number | null
  expertiseTags: string[]
  categories: string[]
  averageRating: number
  ratingCount: number
  sessionsCompleted: number
  responseMinutes: number
  audioPricePerMinuteCents: number
  videoPricePerMinuteCents: number
  currency: string
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  instantCallEnabled: boolean
  verified: boolean
  bio: string | null
  linkedinUrl: string | null
  location: string | null
}

export interface MarketplaceStats {
  availableMentors: number
  onlineNow: number
  averagePricePerMinuteCents: number
  callsToday: number
}

export interface MentorPricing {
  mentorId: string
  audioPricePerMinuteCents: number
  videoPricePerMinuteCents: number
  currency: string
  instantCallEnabled: boolean
  status: string
  designation: string | null
  company: string | null
  experienceYears: number | null
  expertiseTags: string | null
  linkedinUrl: string | null
  sessionsCompleted: number
  updatedAt: string
}

export const marketplaceApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAvailableMentors: build.query<MarketplaceMentor[], void>({
      query: () => '/api/marketplace/mentors',
      providesTags: ['MarketplaceMentors'],
    }),
    getMarketplaceStats: build.query<MarketplaceStats, void>({
      query: () => '/api/marketplace/stats',
    }),
    getMarketplaceMentor: build.query<MarketplaceMentor, string>({
      query: (mentorId) => `/api/marketplace/mentor/${mentorId}`,
    }),
    getMyMentorPricing: build.query<MentorPricing, void>({
      query: () => '/api/mentors/me/pricing',
      providesTags: ['MentorPricing'],
    }),
    upsertMyMentorPricing: build.mutation<
      MentorPricing,
      {
        audioPricePerMinuteCents: number
        videoPricePerMinuteCents: number
        instantCallEnabled?: boolean
        designation?: string
        company?: string
        experienceYears?: number
        expertiseTags?: string
        linkedinUrl?: string
      }
    >({
      query: (body) => ({ url: '/api/mentors/me/pricing', method: 'PUT', body }),
      invalidatesTags: ['MentorPricing', 'MarketplaceMentors'],
    }),
  }),
})

export const {
  useListAvailableMentorsQuery,
  useGetMarketplaceStatsQuery,
  useGetMarketplaceMentorQuery,
  useGetMyMentorPricingQuery,
  useUpsertMyMentorPricingMutation,
} = marketplaceApi
