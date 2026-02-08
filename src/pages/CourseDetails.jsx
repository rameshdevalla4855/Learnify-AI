import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { fetchPlaylistItems } from '../services/youtube';
import { Loader2, ListVideo, MessageSquare, FileText, Brain, PenTool, CheckCircle, RotateCw, Code } from 'lucide-react';
import AIChat from '../components/AIChat';
import Quiz from '../components/Quiz';
import Notes from '../components/Notes';
import Flashcards from '../components/Flashcards';
import CodePlayground from '../components/CodePlayground';

export default function CourseDetails() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'chat' | 'quiz' | 'notes'
    const [completedVideos, setCompletedVideos] = useState([]);
    const { currentUser } = useAuth();

    const scrollContainerRef = useRef(null);
    const tabsRef = useRef(null);

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

    // 1. Fetch Course Metadata & Progress
    useEffect(() => {
        async function loadCourseAndProgress() {
            try {
                // Load Course
                const docRef = doc(db, "courses", courseId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCourse(data);

                    // Lazy Load Videos if missing
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
                            // Optional: Save back to Firestore for next time
                            // updateDoc(docRef, { videos: videoList }); 
                        } catch (e) {
                            console.error("Failed to lazy load videos", e);
                        }
                    }
                    setVideos(videoList);
                    if (videoList.length > 0) setActiveVideo(videoList[0]);

                    // Load Progress
                    if (currentUser) {
                        const userRef = doc(db, "users", currentUser.uid);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const progress = userSnap.data().progress || {};
                            setCompletedVideos(progress[courseId]?.completedVideos || []);
                        }
                    }

                } else {
                    console.error("No such course!");
                }
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        }

        loadCourseAndProgress();
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

    if (!course) return <div className="p-8 text-center text-red-500">Course not found.</div>;



    return (
        <div className="flex flex-col lg:flex-row h-[calc(100dvh-5rem)] lg:h-[calc(100vh-64px-2rem)] gap-6 lg:overflow-hidden pb-4 lg:pb-0">
            {/* Main Content Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-hidden"
            >
                {/* Video Player */}
                <div className="aspect-video w-full bg-black shrink-0 rounded-lg overflow-hidden shadow-lg">
                    {activeVideo ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                            title={activeVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white">Select a video</div>
                    )}
                </div>

                {/* Tabs & Content */}
                <div className="flex flex-col flex-1 mt-4" ref={tabsRef}>
                    <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-4 mb-4 overflow-x-auto shrink-0 bg-white dark:bg-gray-900 sticky top-0 z-20 py-2 no-scrollbar">
                        <button
                            onClick={() => handleTabChange('overview')}
                            className={`flex items-center pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Overview
                        </button>
                        <button
                            onClick={() => handleTabChange('chat')}
                            className={`flex items-center pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'chat' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            AI Tutor
                        </button>
                        <button
                            onClick={() => handleTabChange('quiz')}
                            className={`flex items-center pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'quiz' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                            <Brain className="h-4 w-4 mr-2" />
                            Quiz
                        </button>
                        <button
                            onClick={() => handleTabChange('notes')}
                            className={`flex items-center pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'notes' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                            <PenTool className="h-4 w-4 mr-2" />
                            Notes
                        </button>
                        <button
                            onClick={() => handleTabChange('flashcards')}
                            className={`flex items-center pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'flashcards' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                            <RotateCw className="h-4 w-4 mr-2" />
                            Flashcards
                        </button>
                        <button
                            onClick={() => handleTabChange('code')}
                            className={`flex items-center pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'code' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                            <Code className="h-4 w-4 mr-2 text-blue-500" />
                            Code
                        </button>
                    </div>

                    {/* Content Container - Responsive Height */}
                    <div className="relative bg-white dark:bg-gray-800/50 rounded-b-lg h-[600px] lg:h-full min-h-[400px] flex-1">
                        {/* Overview Tab */}
                        <div className={`absolute inset-0 p-4 overflow-y-auto transition-opacity duration-300 ${activeTab === 'overview' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            {activeVideo && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">{activeVideo.title}</h1>
                                        <button
                                            onClick={handleMarkCompleted}
                                            disabled={completedVideos.includes(activeVideo.id)}
                                            className={`w-full sm:w-auto px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all shrink-0 ${completedVideos.includes(activeVideo.id) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default' : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'}`}
                                        >
                                            {completedVideos.includes(activeVideo.id) ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4" /> Completed
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" /> Mark as Completed
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                            {activeVideo.description || "No description available."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Chat Tab - Persist State */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            {activeVideo && (
                                <AIChat
                                    key={activeVideo.id} // Reset chat on new video
                                    videoTitle={activeVideo.title}
                                    videoDescription={activeVideo.description}
                                    courseTitle={course.title}
                                    courseId={course.id}
                                    videoId={activeVideo.id}
                                />
                            )}
                        </div>

                        {/* Quiz Tab - Persist State */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'quiz' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            {activeVideo && (
                                <Quiz
                                    key={activeVideo.id} // Reset quiz on new video
                                    videoTitle={activeVideo.title}
                                    courseId={course.id}
                                    videoId={activeVideo.id}
                                />
                            )}
                        </div>

                        {/* Notes Tab - Persist State */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'notes' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            {activeVideo && (
                                <Notes
                                    key={activeVideo.id} // Reset notes editor on new video (optional, maybe we want global notes?)
                                    videoId={activeVideo.id} // Usually notes are per video
                                    videoTitle={activeVideo.title}
                                    videoDescription={activeVideo.description}
                                />
                            )}
                        </div>

                        {/* Flashcards Tab - Persist State */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'flashcards' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            {activeVideo && (
                                <Flashcards
                                    key={activeVideo.id}
                                    videoId={activeVideo.id}
                                    videoTitle={activeVideo.title}
                                />
                            )}
                        </div>

                        {/* Code Playground Tab */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <CodePlayground />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar: Playlist */}
            <div className="w-full lg:w-96 flex flex-col border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm shrink-0 h-[500px] lg:h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-lg flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                    <ListVideo className="h-5 w-5 text-gray-500" />
                    <span>Course Content</span>
                    <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{videos.length} videos</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {videos.map((video, idx) => (
                        <button
                            key={video.id}
                            onClick={() => {
                                setActiveVideo(video);
                                // Optional: scroll to top on mobile when selecting new video
                                if (window.innerWidth < 1024) {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className={`w-full text-left p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 ${activeVideo?.id === video.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                        >
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-500">
                                {completedVideos.includes(video.id) ? <CheckCircle className="w-5 h-5 text-green-500" /> : idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${activeVideo?.id === video.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                                    {video.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-1 text-gray-400">{video.description?.slice(0, 50) || "No description"}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
