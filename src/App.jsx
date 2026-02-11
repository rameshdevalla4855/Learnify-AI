import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Apps Routes
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import MyCourses from './pages/MyCourses';
import AddCourse from './pages/AddCourse';
import CourseDetails from './pages/CourseDetails';
import Communities from './pages/Communities';
import CommunityDetails from './pages/CommunityDetails';
import Thread from './pages/Thread';
import Profile from './pages/Profile';
import Roadmap from './pages/Roadmap';
import LandingPage from './pages/LandingPage';
import CoursePreview from './pages/CoursePreview';
// import PlaygroundPage from './pages/PlaygroundPage'; // Removed in favor of PlaygroundLayout

// Playground Components
import PlaygroundLayout from './components/PlaygroundLayout';
import ProblemList from './pages/playground/ProblemList';
import ProblemSolver from './pages/playground/ProblemSolver';
import CodePractice from './pages/playground/CodePractice';

// Social Components
import ConnectLayout from './components/ConnectLayout';
import Feed from './components/connect/Feed';
import Network from './components/connect/Network';
import Chat from './components/connect/Chat';
import Explore from './components/connect/Explore';
import Reels from './components/connect/Reels';
import Notifications from './components/connect/Notifications';
import SocialProfile from './components/connect/SocialProfile';

function AppRoutes() {
    const { currentUser, loading } = useAuth();

    // While checking auth status, we can show a loader or just nothing
    // To prevent flicker, we could add a loading spinner here
    // While checking auth status, we can show a loader
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Root Route: Conditional Rendering */}
            <Route path="/" element={currentUser ? <Layout /> : <LandingPage />}>
                {/* 
                  If user IS logged in, Layout renders Outlet, so we need child routes.
                  If user IS NOT logged in, LandingPage renders (no Outlet), so these are effectively hidden/ignored 
                  until login, but for cleanliness, we could conditionally render them too. 
                  However, keeping them here is fine as the Parent (LandingPage) won't render Outlet.
                */}
                <Route index element={<Home />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="add-course" element={<AddCourse />} />
                <Route path="preview/:playlistId" element={<CoursePreview />} />
                <Route path="course/:courseId" element={<CourseDetails />} />
                <Route path="communities" element={<Communities />} />
                <Route path="community/:communityId" element={<CommunityDetails />} />
                <Route path="thread/:threadId" element={<Thread />} />
                <Route path="profile" element={<Profile />} />
                <Route path="roadmap" element={<Roadmap />} />
            </Route>

            {/* Playground Portal - Protected */}
            <Route path="/playground" element={
                <ProtectedRoute>
                    <PlaygroundLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/playground/problems" replace />} />
                <Route path="problems" element={<ProblemList />} />
                <Route path="problem/:problemId" element={<ProblemSolver />} />
                <Route path="practice" element={<CodePractice />} />
                <Route path="leaderboard" element={<div className="p-10 text-white">Leaderboard Coming Soon</div>} />
                <Route path="profile" element={<div className="p-10 text-white">Coder Profile Coming Soon</div>} />
            </Route>

            {/* Social Mode Routes - Protected */}
            <Route path="/connect" element={
                <ProtectedRoute>
                    <ThemeProvider>
                        <ConnectLayout />
                    </ThemeProvider>
                </ProtectedRoute>
            }>
                <Route index element={<Feed />} />
                <Route path="network" element={<Network />} />
                <Route path="chat" element={<Chat />} />
                <Route path="explore" element={<Explore />} />
                <Route path="reels" element={<Reels />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<SocialProfile />} />
                <Route path="profile/:userId" element={<SocialProfile />} />
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
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
