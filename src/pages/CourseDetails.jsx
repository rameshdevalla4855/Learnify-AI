import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { fetchPlaylistItems } from '../services/youtube';
import { Loader2, ListVideo, MessageSquare, FileText, Brain, PenTool, CheckCircle, RotateCw, Code, ArrowLeft, Maximize2 } from 'lucide-react';
import AIChat from '../components/AIChat';
import Quiz from '../components/Quiz';
import Notes from '../components/Notes';
import Flashcards from '../components/Flashcards';
import CodePlayground from '../components/CodePlayground';

export default function CourseDetails() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'chat' | 'quiz' | 'notes'
    const [completedVideos, setCompletedVideos] = useState([]);
    const { currentUser } = useAuth();
    const [error, setError] = useState(null);

    const scrollContainerRef = useRef(null);
    const tabsRef = useRef(null);
    const [showMobilePlaylist, setShowMobilePlaylist] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);

        // Auto-scroll to tabs
        if (scrollContainerRef.current && tabsRef.current) {
            const container = scrollContainerRef.current;
            const tabsTop = tabsRef.current.offsetTop;

            container.scrollTo({
                top: tabsTop - 16,
                behavior: 'smooth'
            });
        }
    };

    // 1. Fetch Course Metadata & Progress (Real-time & Offline Capable)
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

                    // Handle Videos (Lazy Load if missing and online)
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
                            // If we have videos now and no active video, set one
                            if (videoList.length > 0) setActiveVideo(prev => prev || videoList[0]);
                        } catch (e) {
                            console.warn("Could not lazy load videos (offline?):", e);
                        }
                    } else {
                        setVideos(videoList);
                        // If we have videos now and no active video, set one
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

            // User Progress Listener
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                unsubscribeUser = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        const progress = userSnap.data().progress || {};
                        setCompletedVideos(progress[courseId]?.completedVideos || []);
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
            await updateDoc(userRef, {
                [`progress.${courseId}.completedVideos`]: newCompleted,
                "learningStats.videosWatched": increment(1),
                "learningStats.xp": increment(10)
            });
        } catch (err) {
            console.error("Error updating progress:", err);
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
    );

    if (error) return (
        <div className="flex bg-white dark:bg-gray-900 h-screen items-center justify-center p-4">
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
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-600/30"
                >
                    Retry Connection
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100dvh-4rem)] lg:h-[calc(100vh-4rem)] gap-4 lg:gap-6 p-4 lg:p-6 lg:overflow-hidden">
            {/* Main Content Area (Video + Tabs + Tool) */}
            <div
                ref={scrollContainerRef}
                className={`flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar ${showMobilePlaylist ? 'hidden lg:flex' : 'flex'}`}
            >
                {/* Video Player Container */}
                <div className="shrink-0 space-y-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-900/5 dark:ring-white/10">
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

                    {/* Mobile Only: Playlist Toggle & Title */}
                    <div className="lg:hidden flex items-start justify-between gap-2">
                        <h2 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-sm flex-1 mt-1">
                            {activeVideo?.title || "No video selected"}
                        </h2>
                        <button
                            onClick={() => setShowMobilePlaylist(true)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700"
                        >
                            <ListVideo className="w-3.5 h-3.5" />
                            Playlist
                        </button>
                    </div>
                </div>

                {/* Tabs & Dynamic Content */}
                <div ref={tabsRef} className="flex flex-col flex-1 min-h-0 mt-4">
                    {/* Tabs Header */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-2 mb-0 overflow-x-auto shrink-0 no-scrollbar pb-1">
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
                                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content - Fills remaining space naturally */}
                    <div className="bg-white dark:bg-gray-800/50 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl shadow-sm min-h-[400px]">

                        {/* Overview */}
                        <div className={`p-6 transition-all duration-300 ${activeTab === 'overview' ? 'block animate-in fade-in' : 'hidden'}`}>
                            {activeVideo ? (
                                <div className="space-y-6 max-w-3xl mx-auto">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                                {activeVideo.title}
                                            </h1>
                                            <button
                                                onClick={handleMarkCompleted}
                                                disabled={completedVideos.includes(activeVideo.id)}
                                                className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm ${completedVideos.includes(activeVideo.id) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default ring-1 ring-green-500/20' : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-primary-500/30'}`}
                                            >
                                                {completedVideos.includes(activeVideo.id) ? (
                                                    <> <CheckCircle className="w-4 h-4" /> Completed </>
                                                ) : (
                                                    <> <CheckCircle className="w-4 h-4" /> Mark Complete </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="prose dark:prose-invert max-w-none prose-sm md:prose-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            <p className="whitespace-pre-wrap">{activeVideo.description || "No description available."}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                    Select a video to view details
                                </div>
                            )}
                        </div>

                        {/* Tools (Chat, Quiz, etc) */}
                        {['chat', 'quiz', 'notes', 'flashcards', 'code'].map(tab => (
                            <div key={tab} className={`${activeTab === tab ? 'block animate-in fade-in' : 'hidden'}`}>
                                {/* Code Playground works without video */}
                                {tab === 'code' && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex justify-between items-center mb-4 px-1">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Course Sandbox</h3>
                                            <button
                                                onClick={() => navigate('/playground')}
                                                className="text-xs flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />
                                                Open Fullscreen
                                            </button>
                                        </div>
                                        <div className="flex-1 min-h-[500px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                            <CodePlayground wrapped={false} />
                                        </div>
                                    </div>
                                )}

                                {/* Other tools require activeVideo */}
                                {tab !== 'code' && !activeVideo && (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                        <p>Select a video from the list to use the {tab === 'chat' ? 'AI Tutor' : tab}</p>
                                    </div>
                                )}

                                {tab !== 'code' && activeVideo && (
                                    <>
                                        {tab === 'chat' && <AIChat key={activeVideo.id} videoTitle={activeVideo.title} videoDescription={activeVideo.description} courseTitle={course?.title} courseId={course?.id} videoId={activeVideo.id} />}
                                        {tab === 'quiz' && <Quiz key={activeVideo.id} videoTitle={activeVideo.title} videoDescription={activeVideo.description} courseId={course?.id} videoId={activeVideo.id} />}
                                        {tab === 'notes' && <Notes key={activeVideo.id} videoId={activeVideo.id} videoTitle={activeVideo.title} videoDescription={activeVideo.description} />}
                                        {tab === 'flashcards' && <Flashcards key={activeVideo.id} videoId={activeVideo.id} videoTitle={activeVideo.title} videoDescription={activeVideo.description} />}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar: Playlist (Desktop: Always visible, Mobile: Full screen overlay/toggle) */}
            <div className={`
                lg:w-96 flex flex-col border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-sm shrink-0 overflow-hidden
                ${showMobilePlaylist ? 'fixed inset-0 z-50 m-0 rounded-none w-full h-full' : 'hidden lg:flex lg:h-full'}
            `}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-lg flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <ListVideo className="h-5 w-5 text-primary-600" />
                        <span>Course Content</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{videos.length}</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={() => setShowMobilePlaylist(false)} className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="sr-only">Close</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {videos.map((video, idx) => (
                        <button
                            key={video.id}
                            onClick={() => {
                                setActiveVideo(video);
                                setShowMobilePlaylist(false);
                            }}
                            className={`w-full text-left p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 group ${activeVideo?.id === video.id ? 'bg-primary-50 dark:bg-primary-900/10 border-l-4 border-l-primary-600' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-xs font-mono transition-colors ${activeVideo?.id === video.id ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'}`}>
                                {completedVideos.includes(video.id) ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium line-clamp-2 mb-1 ${activeVideo?.id === video.id ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                                    {video.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{video.description?.slice(0, 60) || "No description"}</p>
                            </div>
                            {activeVideo?.id === video.id && (
                                <div className="self-center">
                                    <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
