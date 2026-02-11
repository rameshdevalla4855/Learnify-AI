import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPlaylistDetails } from '../services/youtube';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Loader2, PlayCircle, BookOpen, User, Calendar, CheckCircle, ArrowLeft, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CoursePreview() {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [isAlreadyAdded, setIsAlreadyAdded] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Check if already added
                if (currentUser) {
                    const docRef = doc(db, "courses", playlistId);
                    const docSnap = await getDoc(docRef);
                    // Also check if user has it in their profile? 
                    // Actually, 'courses' collection is global course data. 
                    // User enrollment is loosely tracked via 'progress' or strictly via 'users/{uid}/enrolledCourses'.
                    // For now, let's just check if it exists in DB, meaning someone imported it.
                    // But "Start Learning" usually implies "Add to MY dashboard". 
                    // Currently our app treats "import" as "cache metadata globally".
                    // The "My Courses" page usually fetches courses where user has progress or just all courses?
                    // Let's look at MyCourses later. For now, we stick to "Import/Start Learning" flow.
                    if (docSnap.exists()) {
                        // It exists, but user might want to "start" it.
                    }
                }

                // 2. Fetch from YouTube
                const data = await fetchPlaylistDetails(playlistId);
                setCourse(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load course details. It might be private or invalid.");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [playlistId, currentUser]);

    async function handleImport() {
        if (!course) return;
        setImporting(true);
        try {
            // Create Course Data
            const courseData = {
                id: playlistId,
                title: course.snippet.title,
                description: course.snippet.description,
                thumbnail: course.snippet.thumbnails?.high?.url || course.snippet.thumbnails?.medium?.url || course.snippet.thumbnails?.default?.url,
                channelTitle: course.snippet.channelTitle,
                itemCount: course.contentDetails.itemCount,
                videos: [], // Lazy load on details page
                // If it already exists, setDoc with merge will update it, which is fine
                // createdBy: currentUser?.uid, // Keep original creator if exists? For simplicity, overwrite or merge
                lastUpdated: serverTimestamp(),
                tags: []
            };

            // Save/Update to Firestore
            await setDoc(doc(db, "courses", playlistId), courseData, { merge: true });

            // Redirect to Course Details
            navigate(`/course/${playlistId}`);
        } catch (err) {
            console.error(err);
            setError("Failed to start course. Please try again.");
        } finally {
            setImporting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
                    <User className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate(-1)} className="btn-secondary px-6 py-2 rounded-lg">
                    Go Back
                </button>
            </div>
        );
    }

    const { snippet, contentDetails } = course;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <img
                    src={snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url}
                    alt={snippet.title}
                    className="w-full h-full object-cover blur-sm scale-105"
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-12 max-w-7xl mx-auto w-full">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 md:top-10 md:left-12 flex items-center gap-2 text-white hover:bg-white/20 transition-all bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <div className="flex items-center gap-3 text-primary-300 mb-4 font-semibold text-sm uppercase tracking-wider">
                            <span className="bg-primary-500/20 backdrop-blur-md border border-primary-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Course
                            </span>
                            <span className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4" /> {contentDetails.itemCount} Videos
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                            {snippet.title}
                        </h1>
                        <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                <span className="font-medium text-white">{snippet.channelTitle}</span>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(snippet.publishedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-30">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-800"
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                About this Course
                            </h2>
                            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {snippet.description || "No description provided for this course."}
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar Action Card */}
                    <div className="md:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800 sticky top-24"
                        >
                            <div className="aspect-video rounded-lg overflow-hidden mb-6 relative group">
                                <img
                                    src={snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url}
                                    alt="Course Thumbnail"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <PlayCircle className="w-12 h-12 text-white opacity-90" />
                                </div>
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="w-full btn-primary py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 mb-4"
                            >
                                {importing ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                                Start Learning Now
                            </button>

                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                This will add the course to your personal library.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
