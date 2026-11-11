import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthBootstrap } from './components/AuthBootstrap'
import { AuthLayout } from './components/layout/AuthLayout'
import { DashboardLayout, DashboardLayoutSimple } from './components/layout/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { FindMatchPage } from './pages/FindMatchPage'
import { MarketplaceMentorProfilePage } from './pages/MarketplaceMentorProfilePage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { MentorshipPage } from './pages/MentorshipPage'
import { MyMentorshipRequestsPage } from './pages/MyMentorshipRequestsPage'
import { CodeReviewPage } from './pages/CodeReviewPage'
import { CommunityFeedPage } from './pages/CommunityFeedPage'
import { DiscussionsPage } from './pages/DiscussionsPage'
import { EventsPage } from './pages/EventsPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { SavedEventsPage } from './pages/SavedEventsPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { VideoRoomsPage } from './pages/VideoRoomsPage'
import { VideoRoomSessionPage } from './pages/VideoRoomSessionPage'
import { VideoRoomJoinPage } from './pages/VideoRoomJoinPage'
import { MockInterviewsPage } from './pages/MockInterviewsPage'
import { MockInterviewSessionPage } from './pages/MockInterviewSessionPage'
import { MockInterviewFeedbackPage } from './pages/MockInterviewFeedbackPage'
import { AIInterviewRoomPage } from './pages/AIInterviewRoomPage'
import { InterviewRoomPage } from './pages/InterviewRoomPage'
import { PairProgrammingPage } from './pages/PairProgrammingPage'
import { PairSessionPage } from './pages/PairSessionPage'
import { PracticePage } from './pages/PracticePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { AdminPage } from './pages/AdminPage'
import { MentorDashboardPage } from './pages/MentorDashboardPage'
import { MentorProfilePage } from './pages/MentorProfilePage'
import { BillingPage } from './pages/BillingPage'
import { LearningStreamsPage } from './pages/LearningStreamsPage'
import { LearningResourcesPage } from './pages/LearningResourcesPage'
import { TutorialReaderPage } from './pages/TutorialReaderPage'
import { StreamCourseDetailPage } from './pages/StreamCourseDetailPage'
import { StreamCoursePlayerPage } from './pages/StreamCoursePlayerPage'
import { InterviewMarketplacePage } from './pages/InterviewMarketplacePage'
import { MyInterviewPurchasesPage } from './pages/MyInterviewPurchasesPage'
import { InterviewPackDetailPage } from './pages/InterviewPackDetailPage'
import { InterviewAssessmentPage } from './pages/InterviewAssessmentPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { JobPortalPage } from './pages/JobPortalPage'
import { OAuthCallback } from './pages/RecruiterOAuthCallbackPage'
import { OAuthErrorPage, OAuthSuccessPage } from './pages/OAuthSuccessPage'
import { RecruiterDashboardPage } from './pages/RecruiterDashboardPage'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { FeatureGate } from './components/FeatureGate'
import { MentorProtectedRoute } from './components/MentorProtectedRoute'
import { RecruiterProtectedRoute } from './components/RecruiterProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route index element={<HomePage />} />

          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          <Route path="recruiter/oauth/callback" element={<OAuthCallback />} />
          <Route path="oauth/success" element={<OAuthSuccessPage />} />
          <Route path="oauth/error" element={<OAuthErrorPage />} />

          <Route element={<ProtectedRoute />}>
            {/* Standalone full-screen layouts (no app sidebar) */}
            <Route path="admin/dashboard" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
            <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="mentor/dashboard" element={<MentorProtectedRoute><MentorDashboardPage /></MentorProtectedRoute>} />
            <Route path="mentor/profile" element={<MentorProtectedRoute><MentorProfilePage /></MentorProtectedRoute>} />
            <Route path="mentor" element={<Navigate to="/mentor/dashboard" replace />} />
            <Route path="recruiter/dashboard" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />
            <Route path="recruiter/interviews" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />
            <Route path="recruiter/messages" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />
            <Route path="recruiter/talent-pool" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />
            <Route path="recruiter/analytics" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />
            <Route path="recruiter/company-profile" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />
            <Route path="recruiter/billing" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />
            <Route path="recruiter/settings" element={<RecruiterProtectedRoute><RecruiterDashboardPage /></RecruiterProtectedRoute>} />

            <Route path="practice/:problemId" element={<FeatureGate feature="pairProgramming"><PracticePage /></FeatureGate>} />

            {/* Find Match: full layout with right chat panel */}
            <Route element={<DashboardLayout />}>
              <Route path="find-match" element={<FeatureGate feature="aiMatching"><FindMatchPage /></FeatureGate>} />
              <Route path="marketplace/mentor/:mentorId" element={<FeatureGate feature="aiMatching"><MarketplaceMentorProfilePage /></FeatureGate>} />
              <Route path="matching" element={<Navigate to="/find-match" replace />} />
            </Route>

            {/* Other pages: sidebar + top nav, no right panel */}
            <Route element={<DashboardLayoutSimple />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="video-rooms" element={<FeatureGate feature="videoRooms"><VideoRoomsPage /></FeatureGate>} />
              <Route path="video-rooms/join/:roomCode" element={<FeatureGate feature="videoRooms"><VideoRoomJoinPage /></FeatureGate>} />
              <Route path="video-rooms/:roomId" element={<FeatureGate feature="videoRooms"><VideoRoomSessionPage /></FeatureGate>} />
              <Route path="pair-programming" element={<FeatureGate feature="pairProgramming"><PairProgrammingPage /></FeatureGate>} />
              <Route path="pair-session/:code" element={<FeatureGate feature="pairProgramming"><PairSessionPage /></FeatureGate>} />
              <Route path="mock-interviews" element={<FeatureGate feature="mockInterviews"><MockInterviewsPage /></FeatureGate>} />
              <Route path="mock-interviews/session/:code" element={<FeatureGate feature="mockInterviews"><MockInterviewSessionPage /></FeatureGate>} />
              <Route path="mock-interviews/ai/:interviewId" element={<FeatureGate feature="mockInterviews"><AIInterviewRoomPage /></FeatureGate>} />
              <Route path="interview-room/:bookingId" element={<FeatureGate feature="mockInterviews"><InterviewRoomPage /></FeatureGate>} />
              <Route path="mock-interviews/feedback/:sessionId" element={<FeatureGate feature="mockInterviews"><MockInterviewFeedbackPage /></FeatureGate>} />
              <Route path="code-review" element={<FeatureGate feature="codeReview"><CodeReviewPage /></FeatureGate>} />
              <Route path="jobs" element={<JobPortalPage />} />
              <Route path="community" element={<FeatureGate feature="communityFeed"><CommunityFeedPage /></FeatureGate>} />
              <Route path="discussions" element={<FeatureGate feature="discussions"><DiscussionsPage /></FeatureGate>} />
              <Route path="events" element={<FeatureGate feature="events"><EventsPage /></FeatureGate>} />
              <Route path="events/saved" element={<FeatureGate feature="events"><SavedEventsPage /></FeatureGate>} />
              <Route path="events/:eventId" element={<FeatureGate feature="events"><EventDetailPage /></FeatureGate>} />
              <Route path="leaderboard" element={<FeatureGate feature="leaderboard"><LeaderboardPage /></FeatureGate>} />
              <Route path="billing" element={<FeatureGate feature="payments"><BillingPage /></FeatureGate>} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="my-mentorship-requests" element={<MyMentorshipRequestsPage />} />
              <Route path="mentors" element={<FeatureGate feature="mentorship"><MentorshipPage /></FeatureGate>} />
              <Route path="resources" element={<LearningResourcesPage />} />
              <Route path="resources/:tutorialId" element={<TutorialReaderPage basePath="/resources" />} />
              <Route path="resources/:tutorialId/:topicId" element={<TutorialReaderPage basePath="/resources" />} />
              <Route path="learning-streams" element={<LearningStreamsPage />} />
              <Route path="learning-streams/:courseId/watch" element={<StreamCoursePlayerPage />} />
              <Route path="learning-streams/:courseId" element={<StreamCourseDetailPage />} />
              <Route path="roadmaps" element={<PlaceholderPage title="Roadmaps" />} />
              <Route path="challenges" element={<FeatureGate feature="pairProgramming"><PairProgrammingPage /></FeatureGate>} />
              <Route path="interview-marketplace" element={<InterviewMarketplacePage />} />
              <Route path="interview-marketplace/:packId" element={<InterviewPackDetailPage />} />
              <Route path="my-interview-purchases" element={<MyInterviewPurchasesPage />} />
              <Route path="interview-assessment/:assignmentId" element={<InterviewAssessmentPage />} />
              <Route path="interview-assessment/pack/:packId" element={<InterviewAssessmentPage />} />
              <Route path="chat" element={<Navigate to="/find-match" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  )
}
