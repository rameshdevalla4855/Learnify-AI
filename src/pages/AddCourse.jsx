import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaylistIdFromUrl, fetchPlaylistDetails, searchPlaylists } from '../services/youtube';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Search, Link as LinkIcon, Download, Eye, X, PlayCircle, BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_PLAYLIST_IDS = [
    'PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6', // Crash Course Psychology
    'PLWKjhJtqVAbnZtkAI3BqcYxKnfWn_C704', // Machine Learning (FreeCodeCamp)
    'PLhQjrBD2T382_R182iC2gNZI9HzvPV_c7', // CS50 2023
    'PLEF32B591D2F9E713'                  // Physics Girl
];

export default function AddCourse() {
    const [mode, setMode] = useState('search'); // 'search' | 'url'
    const [query, setQuery] = useState('');
    const [url, setUrl] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [suggestedCourses, setSuggestedCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importingId, setImportingId] = useState(null);
    const [previewCourse, setPreviewCourse] = useState(null); // Course object to preview
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Load Suggestions on Mount
    useEffect(() => {
        async function loadSuggestions() {
            try {
                const maxSuggestions = 4;
                // Fetch first few to save quota/time, or all
                // We use Promise.allSettled to avoid failing everything if one fails
                const results = await Promise.allSettled(
                    SUGGESTED_PLAYLIST_IDS.map(id => fetchPlaylistDetails(id))
                );

                const validSuggestions = results
                    .filter(r => r.status === 'fulfilled')
                    .map(r => {
                        const data = r.value;
                        return {
                            id: { playlistId: data.id }, // Match search result structure
                            snippet: data.snippet,
                            contentDetails: data.contentDetails
                        };
                    });

                setSuggestedCourses(validSuggestions);
            } catch (err) {
                console.warn("Failed to load suggestions", err);
            }
        }
        loadSuggestions();
    }, []);

    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setSearchResults([]);

        try {
            const results = await searchPlaylists(query);
            setSearchResults(results);
        } catch (err) {
            console.error(err);
            setError("Failed to search playlists. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function importPlaylist(playlistId) {
        setImportingId(playlistId);
        setError('');

        try {
            // Check if we already have the details from preview/search to save a call, 
            // but fetchPlaylistDetails is reliable.
            // If we are adding from Preview, we strictly might not need to fetch again if we have full data,
            // but for consistency/safety (converting search result to full details), let's fetch or use what we have.
            // The search result snippet might lack 'itemCount' sometimes depending on API part used. 
            // Safest to fetch details if we don't have them 100%. 
            // Actually, fetchPlaylistDetails is cheap.

            // 1. Fetch Playlist Info (if needed)
            const playlistData = await fetchPlaylistDetails(playlistId);

            // 2. Create Course Data
            const courseData = {
                id: playlistId,
                title: playlistData.snippet.title,
                description: playlistData.snippet.description,
                thumbnail: playlistData.snippet.thumbnails?.high?.url || playlistData.snippet.thumbnails?.medium?.url || playlistData.snippet.thumbnails?.default?.url,
                channelTitle: playlistData.snippet.channelTitle,
                itemCount: playlistData.contentDetails.itemCount,
                videos: [], // Lazy load
                createdBy: currentUser?.uid,
                createdAt: serverTimestamp(),
                tags: []
            };

            // 3. Save to Firestore
            await setDoc(doc(db, "courses", playlistId), courseData);

            // 4. Redirect
            navigate(`/course/${playlistId}`);

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to import course.");
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

    const openPreview = (courseItem) => {
        setPreviewCourse(courseItem);
    };

    const closePreview = () => {
        setPreviewCourse(null);
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 pb-12 px-4">
            {/* Header Section */}
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/my-courses')}
                    className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <div className="p-1 rounded-full group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    Back to My Courses
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center shadow-2xl"
                >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop"
                            alt="Learning Background"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-black/60 mix-blend-multiply" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-6">
                            <Sparkles className="w-3 h-3" /> AI-Powered Learning
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                            Expand Your Knowledge
                        </h1>
                        <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                            Import high-quality courses from YouTube or search for new topics to build your personalized learning library.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Render Preview Modal */}
            <AnimatePresence>
                {previewCourse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={closePreview}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="relative aspect-video bg-black">
                                <img
                                    src={previewCourse.snippet.thumbnails?.high?.url || previewCourse.snippet.thumbnails?.medium?.url}
                                    alt={previewCourse.snippet.title}
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle className="w-16 h-16 text-white/80" />
                                </div>
                                <button
                                    onClick={closePreview}
                                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 md:p-8 overflow-y-auto">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {previewCourse.snippet.title}
                                </h2>
                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-6">
                                    by {previewCourse.snippet.channelTitle}
                                </p>

                                <div className="flex gap-4 mb-8">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                        <BookOpen className="w-4 h-4" />
                                        <span>Course</span>
                                    </div>
                                    {previewCourse.contentDetails?.itemCount && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                            <PlayCircle className="w-4 h-4" />
                                            <span>{previewCourse.contentDetails.itemCount} Videos</span>
                                        </div>
                                    )}
                                </div>

                                <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300 mb-8">
                                    <p>{previewCourse.snippet.description || "No description available."}</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => importPlaylist(previewCourse.id.playlistId || previewCourse.id)}
                                        disabled={importingId === (previewCourse.id.playlistId || previewCourse.id)}
                                        className="flex-1 btn-primary py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2"
                                    >
                                        {importingId === (previewCourse.id.playlistId || previewCourse.id) ? (
                                            <Loader2 className="animate-spin w-5 h-5" />
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                Start Learning This Course
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={closePreview}
                                        className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                    onClick={() => setMode('search')}
                    className={`flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all ${mode === 'search' ? 'bg-primary-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                >
                    <Search className="w-5 h-5 mr-2" />
                    Search YouTube
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all ${mode === 'url' ? 'bg-primary-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                >
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Paste URL
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                {mode === 'search' && (
                    <div className="space-y-8">
                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="Search for playlists (e.g., 'Python for Beginners')"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 border focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors w-full sm:w-auto flex justify-center"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Search'}
                            </button>
                        </form>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {searchResults.map(item => (
                                    <CourseCard
                                        key={item.id.playlistId}
                                        item={item}
                                        onPreview={() => openPreview(item)}
                                        onImport={() => importPlaylist(item.id.playlistId)}
                                        importingId={importingId}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Suggested Courses (Display if no search results and no query) */}
                        {searchResults.length === 0 && !query && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary-500" />
                                    Featured Courses
                                </h3>
                                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {suggestedCourses.map(item => (
                                        <CourseCard
                                            key={item.id.playlistId}
                                            item={item}
                                            onPreview={() => openPreview(item)}
                                            onImport={() => importPlaylist(item.id.playlistId)}
                                            importingId={importingId}
                                        />
                                    ))}
                                    {/* Skeletons for suggestions if still loading */}
                                    {suggestedCourses.length === 0 && (
                                        <>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-xl h-64"></div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {searchResults.length === 0 && !loading && query && (
                            <div className="text-center py-12 text-gray-500">
                                No playlists found. Try a different keyword.
                            </div>
                        )}
                    </div>
                )}

                {mode === 'url' && (
                    <div className="max-w-xl mx-auto py-12 space-y-6">
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
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 border focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={importingId !== null}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {importingId !== null ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                Instant Add
                            </button>
                        </form>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Component for consistent cards
function CourseCard({ item, onPreview, onImport, importingId }) {
    return (
        <div className="group relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl hover:border-primary-500/30 transition-all bg-white dark:bg-gray-800 flex flex-col">
            <div className="aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden relative cursor-pointer" onClick={onPreview}>
                <img
                    src={item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url}
                    alt={item.snippet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-white/90 dark:bg-black/80 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                        <Eye className="w-3 h-3" /> Preview
                    </div>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1" title={item.snippet.title}>
                    {item.snippet.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
                    by {item.snippet.channelTitle}
                </p>

                <div className="mt-auto flex gap-2">
                    <button
                        onClick={onPreview}
                        className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Preview
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onImport();
                        }}
                        disabled={importingId === item.id.playlistId}
                        className="flex-1 flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50"
                    >
                        {importingId === item.id.playlistId ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
