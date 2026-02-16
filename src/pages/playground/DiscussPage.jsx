import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
    MessageSquare, Plus, Search, TrendingUp, Clock, Flame, 
    Pin, Award, ThumbsUp, MessageCircle, Eye, Filter, ChevronDown,
    Loader2, Star, Bookmark, Share2, MoreHorizontal, CheckCircle
} from 'lucide-react';

const CATEGORIES = [
    { id: 'all', name: 'All Topics', icon: MessageSquare },
    { id: 'interview', name: 'Interview Experience', icon: Award },
    { id: 'help', name: 'Help & Solutions', icon: MessageCircle },
    { id: 'tips', name: 'Tips & Tricks', icon: Star },
    { id: 'general', name: 'General Discussion', icon: MessageSquare },
];

const SORT_OPTIONS = [
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'newest', name: 'Newest', icon: Clock },
    { id: 'hot', name: 'Hot', icon: Flame },
];

export default function DiscussPage() {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSort, setSelectedSort] = useState('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('general');
    const [creating, setCreating] = useState(false);
    
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchDiscussions();
    }, [selectedCategory, selectedSort]);

    async function fetchDiscussions() {
        try {
            const q = query(collection(db, 'discussions'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (selectedCategory !== 'all') {
                data = data.filter(d => d.category === selectedCategory);
            }
            
            if (searchQuery) {
                data = data.filter(d => 
                    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    d.content.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            if (selectedSort === 'hot') {
                data.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            } else if (selectedSort === 'trending') {
                data.sort((a, b) => ((b.likes || 0) + (b.replies || 0) * 2) - ((a.likes || 0) + (a.replies || 0) * 2));
            }
            
            setDiscussions(data);
        } catch (err) {
            console.error('Error fetching discussions:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!currentUser) return;
        
        setCreating(true);
        try {
            await addDoc(collection(db, 'discussions'), {
                title: newTitle,
                content: newContent,
                category: newCategory,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email?.split('@')[0],
                authorPhoto: currentUser.photoURL || null,
                createdAt: serverTimestamp(),
                likes: 0,
                replies: 0,
                views: 0,
                isPinned: false,
                tags: [],
            });
            setNewTitle('');
            setNewContent('');
            setShowCreate(false);
            fetchDiscussions();
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="h-full overflow-y-auto bg-[#1a1a2e]">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-orange-500" />
                            Discuss
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Share knowledge, ask questions, and connect with developers</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-orange-900/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Discussion
                    </button>
                </div>

                {showCreate && (
                    <div className="bg-[#1e1e32] border border-white/[0.06] rounded-xl p-5 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Start a Discussion</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <input
                                    required
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Discussion title..."
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <textarea
                                    required
                                    rows={4}
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="Share your thoughts, questions, or insights..."
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <select
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                                >
                                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={creating}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {creating ? 'Posting...' : 'Post Discussion'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06] focus-within:border-orange-500/40 transition-colors">
                        <Search className="w-4 h-4 text-gray-500 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search discussions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchDiscussions()}
                            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-white w-full placeholder-gray-500"
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap flex items-center gap-1.5 ${
                                    selectedCategory === cat.id 
                                        ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' 
                                        : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <cat.icon className="w-3 h-3" />
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 pb-2">
                    {SORT_OPTIONS.map(sort => (
                        <button
                            key={sort.id}
                            onClick={() => setSelectedSort(sort.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                                selectedSort === sort.id 
                                    ? 'bg-white/[0.08] text-white' 
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <sort.icon className="w-3 h-3" />
                            {sort.name}
                        </button>
                    ))}
                </div>

                <div className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : discussions.length > 0 ? (
                        discussions.map((discussion, idx) => (
                            <DiscussionCard key={discussion.id} discussion={discussion} />
                        ))
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No discussions yet</p>
                            <p className="text-xs mt-1">Be the first to start a conversation!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DiscussionCard({ discussion }) {
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

    return (
        <div className="bg-[#1e1e32] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors group">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                    {discussion.authorPhoto ? (
                        <img src={discussion.authorPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                        discussion.authorName?.[0]?.toUpperCase() || 'U'
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {discussion.isPinned && (
                                    <Pin className="w-3 h-3 text-orange-400" />
                                )}
                                <h3 className="text-sm font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                                    {discussion.title}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{discussion.content}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                <span className="font-medium text-gray-400">{discussion.authorName}</span>
                                <span>•</span>
                                <span>{timeAgo(discussion.createdAt)}</span>
                                {discussion.category && (
                                    <>
                                        <span>•</span>
                                        <span className="px-1.5 py-0.5 bg-white/[0.04] rounded text-gray-400">{discussion.category}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                        <button className="flex items-center gap-1 text-gray-500 hover:text-orange-400 transition-colors">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{discussion.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-400 transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{discussion.replies || 0}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{discussion.views || 0}</span>
                        </button>
                        <div className="flex-1" />
                        <button className="text-gray-600 hover:text-gray-400 transition-colors">
                            <Bookmark className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
