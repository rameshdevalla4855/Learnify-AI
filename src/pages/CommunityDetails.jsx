import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { 
    Loader2, Plus, MessageCircle, ArrowLeft, Users, Hash, 
    Clock, ThumbsUp, Eye, Pin, Star, Share2, Bookmark,
    ChevronRight, TrendingUp, Flame, Award, Send
} from 'lucide-react';

export default function CommunityDetails() {
    const { communityId } = useParams();
    const [community, setCommunity] = useState(null);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [creating, setCreating] = useState(false);
    const [joined, setJoined] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (communityId) {
            fetchData();
        }
    }, [communityId]);

    async function fetchData() {
        try {
            const commRef = doc(db, "communities", communityId);
            const commSnap = await getDoc(commRef);
            if (commSnap.exists()) {
                const data = commSnap.data();
                setCommunity({ id: commSnap.id, ...data });

                const threadsRef = collection(db, "communities", communityId, "threads");
                const q = query(threadsRef, orderBy("createdAt", "desc"));
                const threadsSnap = await getDocs(q);
                setThreads(threadsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!currentUser) return;
        
        setCreating(true);
        try {
            await addDoc(collection(db, "communities", communityId, "threads"), {
                title: newTitle,
                content: newContent,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email?.split('@')[0],
                authorPhoto: currentUser.photoURL || null,
                createdAt: serverTimestamp(),
                repliesCount: 0,
                likes: 0,
                views: 0,
            });
            
            await updateDoc(doc(db, "communities", communityId), {
                threadsCount: increment(1)
            });
            
            setNewTitle('');
            setNewContent('');
            setShowCreate(false);
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    }

    const timeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const seconds = Math.floor((Date.now() - timestamp.toDate?.()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
    );
    
    if (!community) return (
        <div className="text-center py-20">
            <Hash className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community not found</h3>
            <Link to="/communities" className="text-orange-500 hover:text-orange-600 font-medium">
                Back to Communities
            </Link>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-4 py-6">
            {/* Back Link */}
            <Link to="/communities" className="inline-flex items-center text-sm text-gray-500 hover:text-orange-500 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Communities
            </Link>

            {/* Community Header */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-500 relative">
                    <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-8 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white dark:ring-gray-900">
                            {community.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1 pb-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{community.name}</h1>
                            <p className="text-gray-500 text-sm mt-1">{community.description}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span><strong className="text-gray-900 dark:text-white">{community.membersCount || 1}</strong> members</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MessageCircle className="w-4 h-4" />
                            <span><strong className="text-gray-900 dark:text-white">{community.threadsCount || 0}</strong> discussions</span>
                        </div>
                        <div className="flex-1" />
                        <button
                            onClick={() => setJoined(!joined)}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                joined
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400'
                            }`}
                        >
                            {joined ? 'Joined' : 'Join Community'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Discussion */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-orange-500" />
                    Discussions
                </h2>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl text-sm font-semibold transition-all"
                >
                    <Plus className="w-4 h-4" />
                    New Discussion
                </button>
            </div>

            {showCreate && (
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-lg animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Start a Discussion</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <input
                                required
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Discussion title..."
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            />
                        </div>
                        <div>
                            <textarea
                                required
                                rows={4}
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                placeholder="Share your thoughts, questions, or insights..."
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setShowCreate(false)} 
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={creating} 
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {creating ? 'Posting...' : 'Post Discussion'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Threads List */}
            <div className="space-y-3">
                {threads.length > 0 ? (
                    threads.map(thread => (
                        <Link key={thread.id} to={`/thread/${thread.id}`} className="block group">
                            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                                        {thread.authorPhoto ? (
                                            <img src={thread.authorPhoto} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            thread.authorName?.[0]?.toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
                                                {thread.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{thread.content}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="font-medium text-gray-500 dark:text-gray-400">{thread.authorName}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {timeAgo(thread.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                            <span className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 transition-colors">
                                                <ThumbsUp className="w-4 h-4" />
                                                <span className="text-xs">{thread.likes || 0}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="text-xs">{thread.repliesCount || 0} replies</span>
                                            </span>
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Eye className="w-4 h-4" />
                                                <span className="text-xs">{thread.views || 0}</span>
                                            </span>
                                            <div className="flex-1" />
                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                        <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No discussions yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to start a conversation!</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Start Discussion
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
