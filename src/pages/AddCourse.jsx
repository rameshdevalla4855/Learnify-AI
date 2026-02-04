import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaylistIdFromUrl, fetchPlaylistDetails, searchPlaylists } from '../services/youtube';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Search, Link as LinkIcon, Download } from 'lucide-react';

export default function AddCourse() {
    const [mode, setMode] = useState('search'); // 'search' | 'url'
    const [query, setQuery] = useState('');
    const [url, setUrl] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importingId, setImportingId] = useState(null);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    const navigate = useNavigate();

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
            // 1. Fetch Playlist Info ONLY (Fast)
            const playlistData = await fetchPlaylistDetails(playlistId);

            // 2. Create Course Data WITHOUT videos array
            const courseData = {
                id: playlistId,
                title: playlistData.snippet.title,
                description: playlistData.snippet.description,
                thumbnail: playlistData.snippet.thumbnails?.high?.url || playlistData.snippet.thumbnails?.default?.url,
                channelTitle: playlistData.snippet.channelTitle,
                itemCount: playlistData.contentDetails.itemCount,
                videos: [], // Lazy load this on the CourseDetails page
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

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Course</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Import any YouTube playlist. We'll fetch the videos instantly when you start learning.
                </p>
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setMode('search')}
                    className={`flex items-center px-4 py-2 rounded-full font-medium transition-all ${mode === 'search' ? 'bg-primary-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                >
                    <Search className="w-4 h-4 mr-2" />
                    Search YouTube
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex items-center px-4 py-2 rounded-full font-medium transition-all ${mode === 'url' ? 'bg-primary-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Paste URL
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                {mode === 'search' && (
                    <div className="space-y-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search for playlists (e.g., 'Python for Beginners')"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 border focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Search'}
                            </button>
                        </form>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {searchResults.map(item => (
                                <div key={item.id.playlistId} className="group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white dark:bg-gray-800">
                                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
                                        <img src={item.snippet.thumbnails?.medium?.url} alt={item.snippet.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{item.snippet.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{item.snippet.channelTitle}</p>
                                        <button
                                            onClick={() => importPlaylist(item.id.playlistId)}
                                            disabled={importingId === item.id.playlistId}
                                            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                        >
                                            {importingId === item.id.playlistId ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                                            Instant Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {searchResults.length === 0 && !loading && query && (
                            <div className="text-center py-12 text-gray-500">
                                No playlists found. Try a different keyword.
                            </div>
                        )}

                        {!query && !loading && (
                            <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                                <Search className="w-16 h-16 mb-4 opacity-20" />
                                <p>Enter a keyword to find playlists</p>
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
