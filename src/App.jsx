import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';

import MyCourses from './pages/MyCourses';
import AddCourse from './pages/AddCourse';
import CourseDetails from './pages/CourseDetails';
import Communities from './pages/Communities';
import CommunityDetails from './pages/CommunityDetails';
import Thread from './pages/Thread';
import Profile from './pages/Profile';
import Roadmap from './pages/Roadmap';

// Protected Route Component
function ProtectedRoute({ children }) {
    // TODO: Check auth context. For now simplified as we might not be logged in to test UI.
    // In real implementation: const { currentUser } = useAuth(); if (!currentUser) return <Navigate to="/login" />;
    return children;
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Login />} /> {/* Placeholder reuse for now */}

                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="my-courses" element={<MyCourses />} />
                        <Route path="add-course" element={<AddCourse />} />
                        <Route path="course/:courseId" element={<CourseDetails />} />
                        <Route path="communities" element={<Communities />} />
                        <Route path="communities/:communityId" element={<CommunityDetails />} />
                        <Route path="communities/:communityId/:threadId" element={<Thread />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="roadmap" element={<Roadmap />} />
                        {/* Add other protected routes here */}
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
