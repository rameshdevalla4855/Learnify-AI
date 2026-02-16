import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaylistIdFromUrl, fetchPlaylistDetails, searchPlaylists } from '../services/youtube';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
    Loader2, Plus, Search, Link as LinkIcon, Download, Eye, X, PlayCircle, 
    BookOpen, ArrowLeft, Sparkles, Zap, Clock, Youtube, ChevronRight,
    Star, TrendingUp, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_PLAYLIST_IDS = [
    { id: 'PLWKjhJtqVAbnZtkAI3BqcYxKnfWn_C704', category: 'Machine Learning' },
    { id: 'PLhQjrBD2T382_R182iC2gNZI9HzvPV_c7', category: 'Computer Science' },
    { id: 'PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6', category: 'Psychology' },
    { id: 'PLEF32B591D2F9E713', category: 'Physics' },
];

const QUICK_TOPICS = [
    'Python Programming', 'React Development', 'Data Science', 
    'Web Development', 'Machine Learning', 'JavaScript'
];

export default function AddCourse() {
    const [mode, setMode] = useState('search');
    const [query, setQuery] = useState('');
    const [url, setUrl] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [suggestedCourses, setSuggestedCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importingId, setImportingId] = useState(null);
    const [previewCourse, setPreviewCourse] = useState(null);
    const [error, setError] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadSuggestions();
        const saved = localStorage.getItem('recentSearches');
        if (saved) setRecentSearches(JSON.parse(saved));
    }, []);

    async function loadSuggestions() {
        try {
            const results = await Promise.allSettled(
                SUGGESTED_PLAYLIST_IDS.map(s => fetchPlaylistDetails(s.id))
            );

            const validSuggestions = results
                .filter(r => r.status === 'fulfilled')
                .map((r, i) => ({
                    id: { playlistId: r.value.id },
                    snippet: r.value.snippet,
                    contentDetails: r.value.contentDetails,
                    category: SUGGESTED_PLAYLIST_IDS[i]?.category
                }));

            setSuggestedCourses(validSuggestions);
        } catch (err) {
            console.warn("Failed to load suggestions", err);
        }
    }

    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim()) return;
        
        setLoading(true);
        setError('');
        setSearchResults([]);

        try {
            const results = await searchPlaylists(query);
            setSearchResults(results);
            
            const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
            setRecentSearches(newRecent);
            localStorage.setItem('recentSearches', JSON.stringify(newRecent));
        } catch (err) {
            console.error(err);
            setError("Failed to search. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function importPlaylist(playlistId) {
        if (!currentUser) {
            setError("Please log in to add courses.");
            return;
        }
        
        setImportingId(playlistId);
        setError('');

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: currentUser.uid,
                    email: currentUser.email || null,
                    displayName: currentUser.displayName || "User",
                    photoURL: currentUser.photoURL || null,
                    createdAt: serverTimestamp(),
                    enrolledCourses: [],
                    progress: {},
                    learningStats: {
                        videosWatched: 0,
                        quizzesTaken: 0,
                        xp: 0
                    }
                }, { merge: true });
            }

            const playlistData = await fetchPlaylistDetails(playlistId);

            const courseData = {
                id: playlistId,
                title: playlistData.snippet.title,
                description: playlistData.snippet.description,
                thumbnail: playlistData.snippet.thumbnails?.high?.url || playlistData.snippet.thumbnails?.medium?.url,
                channelTitle: playlistData.snippet.channelTitle,
                itemCount: playlistData.contentDetails.itemCount,
                videos: [],
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
                tags: []
            };

            await setDoc(doc(db, "courses", playlistId), courseData);
            navigate(`/course/${playlistId}`);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to import course. Please try again.");
        } finally {
            setImportingId(null);
            setPreviewCourse(null);
        }
    }

    async function handleUrlImport(e) {
        e.preventDefault();
        const playlistId = getPlaylistIdFromUrl(url);
        if (!playlistId) {
            setError('Invalid YouTube Playlist URL');
            return;
        }
        await importPlaylist(playlistId);
    }

    const handleQuickSearch = useCallback((topic) => {
        setQuery(topic);
        handleSearch({ preventDefault: () => {} });
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/my-courses')}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Course</h1>
                    <p className="text-sm text-gray-500">Import from YouTube or search for playlists</p>
                </div>
            </div>

            {/* Hero Card */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Youtube className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white mb-2">Import YouTube Courses</h2>
                        <p className="text-white/80">Transform any YouTube playlist into an interactive learning experience with AI-powered quizzes and notes</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                            <Zap className="w-5 h-5 text-white mx-auto mb-1" />
                            <span className="text-xs text-white/80">Fast Import</span>
                        </div>
                        <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                            <Sparkles className="w-5 h-5 text-white mx-auto mb-1" />
                            <span className="text-xs text-white/80">AI Quizzes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                <button
                    onClick={() => setMode('search')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        mode === 'search'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Search className="w-4 h-4" />
                    Search
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        mode === 'url'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <LinkIcon className="w-4 h-4" />
                    Paste URL
                </button>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewCourse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setPreviewCourse(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="relative aspect-video bg-black">
                                <img
                                    src={previewCourse.snippet.thumbnails?.high?.url || previewCourse.snippet.thumbnails?.medium?.url}
                                    alt={previewCourse.snippet.title}
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <button
                                    onClick={() => setPreviewCourse(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {previewCourse.snippet.title}
                                </h2>
                                <p className="text-sm text-orange-500 mb-4">{previewCourse.snippet.channelTitle}</p>
                                
                                <div className="flex gap-3 mb-6">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                                        <PlayCircle className="w-4 h-4" />
                                        {previewCourse.contentDetails?.itemCount || 0} videos
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-6">
                                    {previewCourse.snippet.description || 'No description available.'}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => importPlaylist(previewCourse.id.playlistId || previewCourse.id)}
                                        disabled={importingId === (previewCourse.id.playlistId || previewCourse.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold disabled:opacity-50"
                                    >
                                        {importingId === (previewCourse.id.playlistId || previewCourse.id) ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                Add Course
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setPreviewCourse(null)}
                                        className="px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Mode */}
            {mode === 'search' && (
                <div className="space-y-6">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for courses (e.g., Python, React, Machine Learning...)"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                        </button>
                    </form>

                    {/* Quick Topics */}
                    {!searchResults.length && (
                        <div>
                            <p className="text-xs text-gray-500 mb-3">Quick search:</p>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_TOPICS.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => handleQuickSearch(topic)}
                                        className="px-3 py-1.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors"
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {searchResults.map(item => (
                                <CourseCard
                                    key={item.id.playlistId}
                                    item={item}
                                    onPreview={() => setPreviewCourse(item)}
                                    onImport={() => importPlaylist(item.id.playlistId)}
                                    importingId={importingId}
                                />
                            ))}
                        </div>
                    )}

                    {/* Featured Courses */}
                    {!searchResults.length && !query && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="w-4 h-4 text-amber-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">Featured Courses</h3>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {suggestedCourses.map(item => (
                                    <CourseCard
                                        key={item.id.playlistId}
                                        item={item}
                                        onPreview={() => setPreviewCourse(item)}
                                        onImport={() => importPlaylist(item.id.playlistId)}
                                        importingId={importingId}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResults.length === 0 && !loading && query && (
                        <div className="text-center py-12 text-gray-500">
                            No playlists found. Try different keywords.
                        </div>
                    )}
                </div>
            )}

            {/* URL Mode */}
            {mode === 'url' && (
                <div className="max-w-xl mx-auto py-8">
                    <form onSubmit={handleUrlImport} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                YouTube Playlist URL
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="https://www.youtube.com/playlist?list=..."
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={importingId !== null}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
                        >
                            {importingId ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Add Course
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}

function CourseCard({ item, onPreview, onImport, importingId, compact }) {
    return (
        <div className={`bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all group ${compact ? '' : 'flex flex-col'}`}>
            <div className={`${compact ? 'aspect-video' : 'aspect-video'} relative cursor-pointer`} onClick={onPreview}>
                <img
                    src={item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url}
                    alt={item.snippet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <PlayCircle className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
            <div className="p-3">
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-sm mb-1">
                    {item.snippet.title}
                </h3>
                <p className="text-xs text-gray-500 mb-3">{item.snippet.channelTitle}</p>
                <div className="flex gap-2">
                    <button
                        onClick={onImport}
                        disabled={importingId === item.id.playlistId}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                        {importingId === item.id.playlistId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-3 h-3" />
                                Add
                            </>
                        )}
                    </button>
                    <button
                        onClick={onPreview}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Preview
                    </button>
                </div>
            </div>
        </div>
    );
}
