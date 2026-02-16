import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppThemeProvider } from './context/AppThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Home = lazy(() => import('./pages/Home'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const AddCourse = lazy(() => import('./pages/AddCourse'));
const CourseDetails = lazy(() => import('./pages/CourseDetails'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityDetails = lazy(() => import('./pages/CommunityDetails'));
const Thread = lazy(() => import('./pages/Thread'));
const Profile = lazy(() => import('./pages/Profile'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CoursePreview = lazy(() => import('./pages/CoursePreview'));

// Playground Components
const PlaygroundLayout = lazy(() => import('./components/PlaygroundLayout'));
const ProblemList = lazy(() => import('./pages/playground/ProblemList'));
const ProblemSolver = lazy(() => import('./pages/playground/ProblemSolver'));
const CodePractice = lazy(() => import('./pages/playground/CodePractice'));
const DiscussPage = lazy(() => import('./pages/playground/DiscussPage'));
const ContestPage = lazy(() => import('./pages/playground/ContestPage'));

// Social Components
const ConnectLayout = lazy(() => import('./components/ConnectLayout'));
const Feed = lazy(() => import('./components/connect/Feed'));
const Network = lazy(() => import('./components/connect/Network'));
const Chat = lazy(() => import('./components/connect/Chat'));
const Explore = lazy(() => import('./components/connect/Explore'));
const Reels = lazy(() => import('./components/connect/Reels'));
const Notifications = lazy(() => import('./components/connect/Notifications'));
const SocialProfile = lazy(() => import('./components/connect/SocialProfile'));

// Loading component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0f0f1a]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 animate-pulse">Loading...</span>
        </div>
    </div>
);

function AppRoutes() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    return (
        <Routes>
            <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
            <Route path="/signup" element={<Suspense fallback={<PageLoader />}><Signup /></Suspense>} />

            {/* Root Route: Conditional Rendering */}
            <Route path="/" element={currentUser ? <Layout /> : <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>}>
                <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
                <Route path="my-courses" element={<Suspense fallback={<PageLoader />}><MyCourses /></Suspense>} />
                <Route path="add-course" element={<Suspense fallback={<PageLoader />}><AddCourse /></Suspense>} />
                <Route path="preview/:playlistId" element={<Suspense fallback={<PageLoader />}><CoursePreview /></Suspense>} />
                <Route path="course/:courseId" element={<Suspense fallback={<PageLoader />}><CourseDetails /></Suspense>} />
                <Route path="communities" element={<Suspense fallback={<PageLoader />}><Communities /></Suspense>} />
                <Route path="community/:communityId" element={<Suspense fallback={<PageLoader />}><CommunityDetails /></Suspense>} />
                <Route path="thread/:threadId" element={<Suspense fallback={<PageLoader />}><Thread /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
                <Route path="roadmap" element={<Suspense fallback={<PageLoader />}><Roadmap /></Suspense>} />
            </Route>

            {/* Playground Portal - Protected */}
            <Route path="/playground" element={
                <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}><PlaygroundLayout /></Suspense>
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/playground/problems" replace />} />
                <Route path="problems" element={<Suspense fallback={<PageLoader />}><ProblemList /></Suspense>} />
                <Route path="problem/:problemId" element={<Suspense fallback={<PageLoader />}><ProblemSolver /></Suspense>} />
                <Route path="practice" element={<Suspense fallback={<PageLoader />}><CodePractice /></Suspense>} />
                <Route path="discuss" element={<Suspense fallback={<PageLoader />}><DiscussPage /></Suspense>} />
                <Route path="contest" element={<Suspense fallback={<PageLoader />}><ContestPage /></Suspense>} />
                <Route path="leaderboard" element={<div className="p-10 text-white">Leaderboard Coming Soon</div>} />
                <Route path="profile" element={<div className="p-10 text-white">Coder Profile Coming Soon</div>} />
            </Route>

            {/* Social Mode Routes - Protected */}
            <Route path="/connect" element={
                <ProtectedRoute>
                    <ThemeProvider>
                        <Suspense fallback={<PageLoader />}><ConnectLayout /></Suspense>
                    </ThemeProvider>
                </ProtectedRoute>
            }>
                <Route index element={<Suspense fallback={<PageLoader />}><Feed /></Suspense>} />
                <Route path="network" element={<Suspense fallback={<PageLoader />}><Network /></Suspense>} />
                <Route path="chat" element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>} />
                <Route path="explore" element={<Suspense fallback={<PageLoader />}><Explore /></Suspense>} />
                <Route path="reels" element={<Suspense fallback={<PageLoader />}><Reels /></Suspense>} />
                <Route path="notifications" element={<Suspense fallback={<PageLoader />}><Notifications /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<PageLoader />}><SocialProfile /></Suspense>} />
                <Route path="profile/:userId" element={<Suspense fallback={<PageLoader />}><SocialProfile /></Suspense>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppThemeProvider>
                    <AppRoutes />
                </AppThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
