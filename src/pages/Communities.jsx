import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { 
    Loader2, Plus, Users, Hash, Search, TrendingUp, Clock, 
    MessageCircle, Star, Pin, ChevronRight, Flame, Award,
    BookOpen, Code, Zap, Globe, Lock, Sparkles
} from 'lucide-react';

const CATEGORY_FILTERS = [
    { id: 'all', name: 'All', icon: Globe },
    { id: 'programming', name: 'Programming', icon: Code },
    { id: 'data-science', name: 'Data Science', icon: BookOpen },
    { id: 'web-dev', name: 'Web Dev', icon: Zap },
    { id: 'ai', name: 'AI/ML', icon: Sparkles },
];

const FEATURED_COMMUNITIES = [
    { name: 'LeetCode Practice', members: 1247, icon: '🎯' },
    { name: 'JavaScript Masters', members: 892, icon: '⚡' },
    { name: 'Python Developers', members: 1567, icon: '🐍' },
];

export default function Communities() {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCategory, setNewCategory] = useState('programming');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchCommunities();
    }, []);

    async function fetchCommunities() {
        try {
            const q = query(collection(db, "communities"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCommunities(data);
        } catch (err) {
            console.error("Error fetching communities:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!currentUser) return;
        
        setCreating(true);
        try {
            await addDoc(collection(db, "communities"), {
                name: newName,
                description: newDesc,
                category: newCategory,
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
                membersCount: 1,
                threadsCount: 0,
            });
            setNewName('');
            setNewDesc('');
            setShowCreate(false);
            fetchCommunities();
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    }

    const filteredCommunities = communities.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        Communities
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Connect, learn, and grow together</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Create Community
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-orange-500" />
                        Create New Community
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Community name..."
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                                <select
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                >
                                    {CATEGORY_FILTERS.filter(c => c.id !== 'all').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                            <textarea
                                required
                                rows={3}
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                placeholder="What's this community about?"
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
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
                                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Community'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search communities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORY_FILTERS.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                selectedCategory === cat.id
                                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                                    : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50 hover:border-orange-300 dark:hover:border-orange-500/30'
                            }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Featured Section */}
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Featured Communities
                </h3>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {FEATURED_COMMUNITIES.map((comm, i) => (
                        <div key={i} className="flex-shrink-0 bg-white dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700/50 flex items-center gap-3 hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors cursor-pointer">
                            <span className="text-2xl">{comm.icon}</span>
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{comm.name}</div>
                                <div className="text-xs text-gray-500">{comm.members.toLocaleString()} members</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Communities Grid */}
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCommunities.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCommunities.map(comm => (
                        <Link key={comm.id} to={`/community/${comm.id}`} className="group">
                            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                                        {comm.name?.[0]?.toUpperCase() || 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                            {comm.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {comm.createdAt?.seconds ? new Date(comm.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mb-4">
                                    {comm.description}
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {comm.membersCount || 1}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            {comm.threadsCount || 0}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                    <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No communities found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? 'Try a different search term' : 'Be the first to create a community!'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Community
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
