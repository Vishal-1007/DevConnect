export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface AccountResponse {
  id: string
  username: string
  email: string
  roles: string
}

export interface UserProfile {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  location: string | null
  role: string | null
  experienceLevel: string | null
  learningGoals: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  skills: string[]
  averageRating: number
  ratingCount: number
  createdAt: string
  updatedAt: string
}

export interface UserProfileUpdate {
  displayName?: string
  bio?: string
  avatarUrl?: string
  location?: string
  role?: string
  experienceLevel?: string
  learningGoals?: string
  githubUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  skills?: string[]
}

export interface MatchRequest {
  id: string
  requesterId: string
  status: string
  criteria: string
  createdAt: string
  updatedAt: string
}

export interface MatchResult {
  id: string
  requestId: string
  matchedUserId: string
  score: number
  createdAt: string
}

export interface LiveMatchStatus {
  role: string | null
  poolStatus: string
  liveEnabled: boolean
  assignmentId: string | null
  assignmentStatus: string | null
  partnerId: string | null
  partnerRole: string | null
  criteria: string | null
  expiresAt: string | null
  message: string | null
}

export interface LiveMatchAssignment {
  id: string
  mentorId: string
  learnerId: string
  status: string
  criteria: string | null
  expiresAt: string | null
  acceptedAt: string | null
  createdAt: string
}

export interface MentorProfile {
  userId: string
  headline: string | null
  bio: string | null
  hourlyRateCents: number | null
  verified: boolean
  available: boolean
  averageRating: number
  ratingCount: number
  createdAt: string
  updatedAt: string
}

export interface MentorApplication {
  id: string
  userId: string
  username: string | null
  headline: string | null
  bio: string | null
  hourlyRateCents: number | null
  motivation: string | null
  /** DRAFT | PENDING | APPROVED | REJECTED | INFO_REQUESTED | SUSPENDED */
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | 'SUSPENDED'
  reviewedBy: string | null
  reviewNote: string | null
  currentStep?: number | null
  applicationData?: import('../components/mentor-onboarding/types').MentorApplicationFormData | null
  infoRequestMessage?: string | null
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  createdBy: string
  participants: string[]
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}

export interface CommunityPostCode {
  language: string
  content: string
}

export interface CommunityPostAttachment {
  name: string
  url: string
  size: number
  type: string
  fileId?: string | null
}

export interface CommunityPostPollOption {
  id: string
  text: string
  voteCount: number
  percentage: number
}

export interface CommunityPostPoll {
  id: string
  question: string
  totalVotes: number
  votedOptionId?: string | null
  options: CommunityPostPollOption[]
}

export interface CommunityPost {
  id: string
  authorId: string
  authorDisplayName: string
  authorRole: string | null
  content: string
  category: string
  tags: string[]
  likeCount: number
  commentCount: number
  likedByMe: boolean
  savedByMe?: boolean
  createdAt: string
  imageUrl?: string | null
  attachment?: CommunityPostAttachment | null
  code?: CommunityPostCode | null
  poll?: CommunityPostPoll | null
}

export interface CommunityPostUpload {
  fileId: string
  url: string
  name: string
  size: number
  type: string
  kind: 'image' | 'attachment'
}

export interface CommunityComment {
  id: string
  authorId: string
  authorDisplayName: string
  content: string
  parentCommentId?: string | null
  createdAt: string
}

export interface CommunityFeedStats {
  totalPosts: number
  activeDevelopers: number
  totalDiscussions: number
  trendingTopics: number
  trendingTags: { tag: string; postCount: number }[]
}

export interface CreateCommunityPost {
  content?: string
  category?: string
  tags?: string[]
  imageUrl?: string
  imageFileId?: string
  attachmentName?: string
  attachmentUrl?: string
  attachmentSize?: number
  attachmentType?: string
  attachmentFileId?: string
  code?: CommunityPostCode
  poll?: { question: string; options: string[] }
}

export interface DiscussionThread {
  id: string
  authorId: string
  authorDisplayName: string
  authorRole: string | null
  title: string
  content: string
  topic: string
  tags: string[]
  solved: boolean
  pinned: boolean
  replyCount: number
  createdAt: string
  updatedAt: string
}

export interface DiscussionReply {
  id: string
  threadId: string
  authorId: string
  authorDisplayName: string
  content: string
  acceptedAnswer: boolean
  createdAt: string
}

export interface CreateDiscussionThread {
  title: string
  content: string
  topic?: string
  tags?: string[]
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  role: string | null
  points: number
  streak: number
  posts: number
  replies: number
  contributions: number
  averageRating: number
}

export interface LeaderboardData {
  entries: LeaderboardEntry[]
  currentUser: LeaderboardEntry
  period: string
  category: string
}

export interface UserStats {
  streak: number
  points: number
  rank: number
  posts: number
  replies: number
  contributions: number
  codingSolved: number
  pairSessionsCompleted: number
  practiceSessionsCompleted: number
  avgSessionMinutes: number
  activityTimestamps: string[]
}

export interface CommunityEvent {
  id: string
  hostId: string
  hostDisplayName: string
  hostRole: string | null
  hostRating?: number | null
  title: string
  description: string
  eventType: string
  category: string
  format: string
  locationOrLink: string | null
  startsAt: string
  endsAt: string
  maxAttendees: number
  attendeeCount: number
  registeredByMe: boolean
  full: boolean
  speakers: { userId: string; displayName: string; role: string | null }[]
  tags: string[]
  createdAt: string
  thumbnailUrl?: string | null
  paid?: boolean
  priceInr?: number
  featured?: boolean
  approvalStatus?: string | null
  bookmarkedByMe?: boolean
  hasAccess?: boolean
  locked?: boolean
  topicsCovered?: string | null
  requirements?: string | null
}

export interface EventStats {
  upcomingEvents: number
  myRegistrations: number
  onlineEvents: number
  pastEvents: number
}

export interface PopularHost {
  userId: string
  displayName: string
  role: string
  company: string
  rating: number
  eventsHosted: number
  totalRegistrations: number
  following: boolean
}

export interface EventOrder {
  amountInr: number
  currency: string
  description: string
  idempotencyKey: string
  amountCents: number
}

export interface MentorEventDashboard {
  totalEvents: number
  upcomingEvents: number
  completedEvents: number
  totalStudents: number
  totalRevenueInr: number
  mentorEarningsInr: number
  platformFeeInr: number
  availableBalanceInr: number
}

export interface EventRevenueAnalytics {
  totalRevenueInr: number
  platformEarningsInr: number
  mentorPayoutsInr: number
  totalEvents: number
  approvedEvents: number
  pendingApprovals: number
  totalRegistrations: number
  paidRegistrations: number
  recentTransactions: EventPaymentSummary[]
  topCategories: { category: string; count: number }[]
}

export interface EventPaymentSummary {
  id: string
  eventId: string
  eventTitle: string
  mentorName: string
  ticketsSold: number
  totalAmountInr: number
  mentorShareInr: number
  platformShareInr: number
  status: string
  createdAt: string
}

export interface EventWithdrawal {
  id: string
  mentorId: string
  amountCents: number
  status: string
  adminNote: string | null
  requestedAt: string
  resolvedAt: string | null
}

export interface CreateMentorEvent {
  title: string
  description: string
  eventType?: string
  category?: string
  format?: string
  locationOrLink?: string
  startsAt: string
  endsAt: string
  maxAttendees?: number
  tags?: string[]
  thumbnailUrl?: string
  paid: boolean
  priceInr?: number
  topicsCovered?: string
  requirements?: string
}

export interface CreateCommunityEvent {
  title: string
  description: string
  eventType?: string
  category?: string
  format?: string
  locationOrLink?: string
  startsAt: string
  endsAt: string
  maxAttendees?: number
  tags?: string[]
}

export interface VideoRoomParticipant {
  userId: string
  displayName: string
  role: string | null
  host: boolean
  participantRole?: string | null
  joinStatus?: string | null
  muted: boolean
  cameraEnabled?: boolean
  canSpeak: boolean
  handRaised: boolean
  joinedAt: string
}

export interface VideoRoom {
  id: string
  hostId: string
  hostDisplayName: string
  hostRole: string | null
  title: string
  description: string
  category: string
  roomType: string
  useCase: string
  parentRoomId: string | null
  status: string
  maxParticipants: number
  participantCount: number
  joinedByMe: boolean
  full: boolean
  chatEnabled: boolean
  screenShareEnabled: boolean
  breakoutEnabled: boolean
  featured?: boolean
  featuredOrder?: number
  visibility?: string
  moderatorId?: string | null
  moderatorDisplayName?: string | null
  tags: string[]
  participants: VideoRoomParticipant[]
  breakouts: VideoRoom[]
  createdAt: string
  endedAt: string | null
  roomCode?: string | null
  joinUrl?: string | null
  joinPath?: string | null
  expiresAt?: string | null
  premiumRoom?: boolean
  remainingSeconds?: number | null
  viewerHasVideoRoomPremium?: boolean
  freeTierRoom?: boolean
  nextFreeRoomAvailableAt?: string | null
  expiredDueToTimeLimit?: boolean
  viewerJoinStatus?: string | null
  waitingParticipants?: VideoRoomParticipant[]
}

export interface VideoRoomUsage {
  videoRoomPremium: boolean
  freeMaxParticipants: number
  freeDurationMinutes: number
  premiumPriceInr: number
  canCreateFreeRoom: boolean
  nextFreeRoomAvailableAt: string | null
  activeFreeRoomId: string | null
  activeFreeRoomRemainingSeconds: number | null
}

export interface VideoRoomLimitCheck {
  allowed: boolean
  premium: boolean
  message: string
  nextAvailableAt: string | null
}

export interface VideoRoomJoinPreview {
  roomId: string
  roomCode: string
  title: string
  hostDisplayName: string
  participantCount: number
  maxParticipants: number
  status: string
  full: boolean
  premiumRoom: boolean
  remainingSeconds: number | null
}

export interface VideoRoomOrder {
  amount: number
  currency: string
  description: string
  idempotencyKey: string
  priceCents: number
}

export interface CreateVideoRoom {
  title: string
  description: string
  category?: string
  roomType?: string
  useCase?: string
  maxParticipants?: number
  tags?: string[]
  chatEnabled?: boolean
  screenShareEnabled?: boolean
  breakoutEnabled?: boolean
}

export interface UpdateVideoRoomPermissions {
  chatEnabled?: boolean
  screenShareEnabled?: boolean
  breakoutEnabled?: boolean
}

export interface CreateBreakoutRoom {
  title: string
  maxParticipants?: number
}

export interface VideoRoomMessage {
  id: string
  roomId: string
  authorId: string
  authorDisplayName: string
  content: string
  createdAt: string
}

export interface AppNotification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type SagaState =
  | 'STARTED'
  | 'AUTHORIZED'
  | 'COMPLETED'
  | 'FAILED'
  | 'COMPENSATING'
  | 'COMPENSATED'

export interface Payment {
  id: string
  userId: string
  sagaId: string
  amount: number
  currency: string
  status: PaymentStatus
  description: string
  paymentMethod: string
  providerReference: string | null
  sagaState: SagaState
  failureReason: string | null
  clientSecret?: string | null
  gatewayProvider?: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface PaymentConfig {
  gatewayProvider: string
  stripePublishableKey: string | null
  razorpayKeyId: string | null
  razorpayEnabled: boolean
}

export interface PaymentModeOption {
  id: string
  label: string
  description: string
  category: string
  requiresCardDetails: boolean
  availableWithStripe: boolean
}

export interface CreatePaymentIntentRequest {
  amount: number
  currency: string
  description: string
  /** Preferred: CARD, UPI, GPAY, BHIM, PAYTM, PHONEPE */
  paymentMode?: string
  /** @deprecated use paymentMode */
  paymentMethod?: string
  idempotencyKey?: string
}

export interface ConfirmPaymentRequest {
  simulatedOutcome?: 'SUCCESS' | 'FAIL'
}

export interface CheckoutPaymentRequest {
  payment: CreatePaymentIntentRequest
  simulatedOutcome?: 'SUCCESS' | 'FAIL'
}

export interface BillingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  description: string
  features: string[]
  popular?: boolean
}

export interface AdminAccount {
  id: string
  username: string
  email: string
  roles: string
  enabled: boolean
  createdAt: string
}
