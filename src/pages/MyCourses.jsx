import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Search, Grid, List, Clock, BookOpen, PlayCircle, 
    MoreVertical, Trash2, Edit, Share2, ChevronRight, Sparkles,
    TrendingUp, Award, Zap, FolderOpen, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const { currentUser } = useAuth();

    const handleDeleteCourse = async (courseId) => {
        try {
            await deleteDoc(doc(db, 'courses', courseId));
            setShowDeleteConfirm(null);
            setActiveMenu(null);
        } catch (error) {
            console.error('Error deleting course:', error);
            setError('Failed to delete course. Please try again.');
        }
    };

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const coursesRef = collection(db, "courses");
        const q = query(
            coursesRef,
            where("createdBy", "==", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, 
            (querySnapshot) => {
                const coursesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Sort client-side by createdAt descending
                coursesData.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });
                
                setCourses(coursesData);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching courses:", err);
                setError("Failed to load courses. Please try again.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const filteredCourses = courses.filter(course => 
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.channelTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        if (sortBy === 'recent') return 0;
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'videos') return (b.itemCount || 0) - (a.itemCount || 0);
        return 0;
    });

    const totalVideos = courses.reduce((sum, c) => sum + (c.itemCount || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error) return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        My Courses
                    </h1>
                </div>
                <Link
                    to="/add-course"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Course
                </Link>
            </div>
            <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <RefreshCw className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Unable to load courses</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold transition-all"
                >
                    <RefreshCw className="w-5 h-5" />
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        My Courses
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {courses.length} courses • {totalVideos} videos total
                    </p>
                </div>
                <Link
                    to="/add-course"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Course
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</div>
                            <div className="text-xs text-gray-500">Courses</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalVideos}</div>
                            <div className="text-xs text-gray-500">Videos</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                            <Award className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                            <div className="text-xs text-gray-500">Completed</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                            <div className="text-xs text-gray-500">In Progress</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            {courses.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                        <option value="recent">Recently Added</option>
                        <option value="title">Alphabetical</option>
                        <option value="videos">Most Videos</option>
                    </select>
                    <div className="flex gap-1 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Courses Grid/List */}
            {courses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                    <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                        <FolderOpen className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Import your first YouTube playlist to start learning with AI-powered quizzes and notes
                    </p>
                    <Link
                        to="/add-course"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold transition-all hover:from-orange-400 hover:to-amber-400"
                    >
                        <Sparkles className="w-5 h-5" />
                        Add Your First Course
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedCourses.map((course, idx) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <CourseCard 
                                course={course} 
                                onDelete={(id) => setShowDeleteConfirm(id)}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedCourses.map((course, idx) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <CourseListItem 
                                course={course} 
                                onDelete={(id) => setShowDeleteConfirm(id)}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                            />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <div className="w-14 h-14 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-7 h-7 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Course?</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This will remove the course from your library. This action cannot be undone.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(null)}
                                        className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCourse(showDeleteConfirm)}
                                        className="flex-1 py-2.5 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CourseCard({ course, onDelete, activeMenu, setActiveMenu }) {
    return (
        <div className="group relative">
            <Link to={`/course/${course.id}`} className="block">
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                        {course.thumbnail && (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <span className="px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-lg text-[10px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <PlayCircle className="w-3 h-3" />
                                {course.itemCount || 0} videos
                            </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                                <PlayCircle className="w-7 h-7 text-orange-500" />
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-orange-500 transition-colors text-sm">
                            {course.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">{course.channelTitle}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.createdAt?.seconds 
                                    ? new Date(course.createdAt.seconds * 1000).toLocaleDateString() 
                                    : 'Recently added'}
                            </span>
                            <span className="text-orange-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                Continue <ChevronRight className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
            {/* Menu Button */}
            <div className="absolute top-3 right-3 z-10">
                <button
                    onClick={(e) => { e.preventDefault(); setActiveMenu(activeMenu === course.id ? null : course.id); }}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
                <AnimatePresence>
                    {activeMenu === course.id && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[130px]"
                        >
                            <button
                                onClick={(e) => { e.preventDefault(); onDelete(course.id); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function CourseListItem({ course, onDelete, activeMenu, setActiveMenu }) {
    return (
        <div className="group relative">
            <Link to={`/course/${course.id}`} className="block">
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-lg transition-all flex gap-4">
                    <div className="w-32 h-20 rounded-lg bg-gray-100 dark:bg-gray-900 overflow-hidden shrink-0 relative">
                        {course.thumbnail && (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <PlayCircle className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-orange-500 transition-colors">
                            {course.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">{course.channelTitle}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <PlayCircle className="w-3 h-3" />
                                {course.itemCount || 0} videos
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.createdAt?.seconds 
                                    ? new Date(course.createdAt.seconds * 1000).toLocaleDateString() 
                                    : 'Recently'}
                            </span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all self-center" />
                </div>
            </Link>
            {/* Menu Button */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={(e) => { e.preventDefault(); setActiveMenu(activeMenu === course.id ? null : course.id); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
                <AnimatePresence>
                    {activeMenu === course.id && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[130px] z-10"
                        >
                            <button
                                onClick={(e) => { e.preventDefault(); onDelete(course.id); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
