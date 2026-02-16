import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { fetchPlaylistItems } from '../services/youtube';
import { Loader2, ListVideo, MessageSquare, FileText, Brain, PenTool, CheckCircle, RotateCw, Code, ArrowLeft, Maximize2, Play, X } from 'lucide-react';
import AIChat from '../components/AIChat';
import Quiz from '../components/Quiz';
import Notes from '../components/Notes';
import Flashcards from '../components/Flashcards';
import CodePlayground from '../components/CodePlayground';
import { motion, AnimatePresence } from 'framer-motion';

export default function CourseDetails() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [completedVideos, setCompletedVideos] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const { currentUser } = useAuth();
    const [error, setError] = useState(null);

    const scrollContainerRef = useRef(null);
    const tabsRef = useRef(null);
    const [showMobilePlaylist, setShowMobilePlaylist] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (scrollContainerRef.current && tabsRef.current) {
            const container = scrollContainerRef.current;
            const tabsTop = tabsRef.current.offsetTop;
            container.scrollTo({
                top: tabsTop - 16,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        let unsubscribeCourse;
        let unsubscribeUser;

        async function setupListeners() {
            setLoading(true);
            setError(null);

            const docRef = doc(db, "courses", courseId);

            unsubscribeCourse = onSnapshot(docRef, async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCourse(data);

                    let videoList = data.videos || [];
                    if (videoList.length === 0) {
                        try {
                            const fetchedData = await fetchPlaylistItems(courseId);
                            videoList = fetchedData.items.map(item => ({
                                id: item.contentDetails.videoId,
                                title: item.snippet.title,
                                description: item.snippet.description,
                                thumbnail: item.snippet.thumbnails?.default?.url,
                                position: item.snippet.position
                            }));
                            setVideos(videoList);
                            if (videoList.length > 0) setActiveVideo(prev => prev || videoList[0]);
                        } catch (e) {
                            console.warn("Could not lazy load videos:", e);
                        }
                    } else {
                        setVideos(videoList);
                        if (videoList.length > 0) setActiveVideo(prev => prev || videoList[0]);
                    }

                    setLoading(false);
                } else {
                    setError("Course not found.");
                    setLoading(false);
                }
            }, (err) => {
                console.error("Course snapshot error:", err);
                if (!course) {
                    if (err.code === 'unavailable') {
                        setError("You are offline and no cached data is available.");
                    } else {
                        setError("Failed to load course.");
                    }
                }
                setLoading(false);
            });

            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                unsubscribeUser = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const progress = userData.progress || {};
                        setCompletedVideos(progress[courseId]?.completedVideos || []);
                        setUserProfile(userData);
                    }
                }, (err) => console.error("User snapshot error:", err));
            }
        }

        setupListeners();

        return () => {
            if (unsubscribeCourse) unsubscribeCourse();
            if (unsubscribeUser) unsubscribeUser();
        };
    }, [courseId, currentUser]);

    async function handleMarkCompleted() {
        if (!currentUser || !activeVideo) return;
        if (completedVideos.includes(activeVideo.id)) return;

        const newCompleted = [...completedVideos, activeVideo.id];
        setCompletedVideos(newCompleted);

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const today = new Date().toISOString().split('T')[0];
            await updateDoc(userRef, {
                [`progress.${courseId}.completedVideos`]: newCompleted,
                "learningStats.videosWatched": increment(1),
                "learningStats.xp": increment(10),
                "lastActiveDate": today
            });
        } catch (err) {
            console.error("Error updating progress:", err);
        }
    }

    useEffect(() => {
        if (!currentUser || !course || videos.length === 0 || completedVideos.length === 0) return;
        
        const allCompleted = videos.length > 0 && videos.every(v => completedVideos.includes(v.id));
        const alreadyMarkedComplete = userProfile?.completedCourses?.includes(courseId);
        
        if (allCompleted && !alreadyMarkedComplete) {
            const markCourseComplete = async () => {
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    await updateDoc(userRef, {
                        "learningStats.coursesCompleted": increment(1),
                        "learningStats.xp": increment(50),
                        "completedCourses": arrayUnion(courseId)
                    });
                } catch (err) {
                    console.error("Error updating course completion:", err);
                }
            };
            markCourseComplete();
        }
    }, [completedVideos, videos, course, courseId, currentUser, userProfile]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error) return (
        <div className="flex bg-white dark:bg-gray-900 min-h-[400px] items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-flex mb-4">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error === "Course not found." ? "Course Not Found" : "Connection Error"}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/20"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    const completedCount = completedVideos.length;
    const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

    return (
        <div className="space-y-6 px-4 py-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                        {course?.title || "Course"}
                    </h1>
                    <p className="text-sm text-gray-500">{course?.channelTitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-xl">
                        {activeVideo ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&playsinline=1`}
                                title={activeVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white bg-gray-900">
                                <p>Select a video to start learning</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                                {activeVideo?.title || "Select a video"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {activeVideo ? `${course?.channelTitle}` : ""}
                            </p>
                        </div>
                        {activeVideo && (
                            <button
                                onClick={handleMarkCompleted}
                                disabled={completedVideos.includes(activeVideo.id)}
                                className={`shrink-0 px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                                    completedVideos.includes(activeVideo.id) 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                        : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400'
                                }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {completedVideos.includes(activeVideo.id) ? 'Completed' : 'Mark Complete'}
                            </button>
                        )}
                    </div>

                    <div ref={tabsRef}>
                        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'overview', icon: FileText, label: 'Overview' },
                                { id: 'chat', icon: MessageSquare, label: 'AI Tutor' },
                                { id: 'quiz', icon: Brain, label: 'Quiz' },
                                { id: 'notes', icon: PenTool, label: 'Notes' },
                                { id: 'flashcards', icon: RotateCw, label: 'Flashcards' },
                                { id: 'code', icon: Code, label: 'Code' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                        activeTab === tab.id 
                                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30' 
                                            : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50 hover:border-orange-300 dark:hover:border-orange-500/30'
                                    }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm min-h-[300px] p-6">
                            {activeTab === 'overview' && (
                                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                    <p className="whitespace-pre-wrap">{activeVideo?.description || "Select a video to view its description."}</p>
                                </div>
                            )}

                            {activeTab === 'code' && (
                                <div className="h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Course Sandbox</h3>
                                        <button
                                            onClick={() => navigate('/playground')}
                                            className="text-xs flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-medium p-1.5 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                            Open Fullscreen
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-[400px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                        <CodePlayground wrapped={false} />
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'overview' && activeTab !== 'code' && !activeVideo && (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                    <p>Select a video to use {activeTab === 'chat' ? 'AI Tutor' : activeTab}</p>
                                </div>
                            )}

                            {activeTab === 'chat' && activeVideo && (
                                <AIChat 
                                    key={activeVideo.id} 
                                    videoTitle={activeVideo.title} 
                                    videoDescription={activeVideo.description} 
                                    courseTitle={course?.title} 
                                    courseId={course?.id} 
                                    videoId={activeVideo.id} 
                                />
                            )}
                            {activeTab === 'quiz' && activeVideo && (
                                <Quiz 
                                    key={activeVideo.id} 
                                    videoTitle={activeVideo.title} 
                                    videoDescription={activeVideo.description} 
                                    courseId={course?.id} 
                                    videoId={activeVideo.id} 
                                />
                            )}
                            {activeTab === 'notes' && activeVideo && (
                                <Notes 
                                    key={activeVideo.id} 
                                    videoId={activeVideo.id} 
                                    videoTitle={activeVideo.title} 
                                    videoDescription={activeVideo.description} 
                                />
                            )}
                            {activeTab === 'flashcards' && activeVideo && (
                                <Flashcards 
                                    key={activeVideo.id} 
                                    videoId={activeVideo.id} 
                                    videoTitle={activeVideo.title} 
                                    videoDescription={activeVideo.description} 
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm overflow-hidden sticky top-4">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ListVideo className="h-5 w-5 text-orange-500" />
                                    <span className="font-semibold text-gray-900 dark:text-white">Course Content</span>
                                </div>
                                <span className="text-xs bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full font-medium">
                                    {videos.length} videos
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{completedCount} of {videos.length} completed</span>
                                    <span className="font-semibold text-orange-500">{progressPercent}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            {videos.map((video, idx) => {
                                const isCompleted = completedVideos.includes(video.id);
                                const isActive = activeVideo?.id === video.id;
                                
                                return (
                                    <button
                                        key={video.id}
                                        onClick={() => setActiveVideo(video)}
                                        className={`w-full text-left p-4 flex gap-3 transition-all border-b border-gray-100 dark:border-gray-700/50 last:border-0 group ${
                                            isActive 
                                                ? 'bg-orange-50 dark:bg-orange-500/10' 
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                                            isActive 
                                                ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' 
                                                : isCompleted 
                                                    ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                                        }`}>
                                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-medium line-clamp-2 ${
                                                isActive 
                                                    ? 'text-orange-600 dark:text-orange-400' 
                                                    : 'text-gray-900 dark:text-white'
                                            }`}>
                                                {video.title}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
