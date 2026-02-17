import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { Search, Heart, MessageCircle, Loader2, TrendingUp, Sparkles, Flame, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Explore() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchExplorePosts = async () => {
            try {
                const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(30));
                const snapshot = await getDocs(q);
                setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setFilteredPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching explore posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExplorePosts();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredPosts(posts);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = posts.filter(post => {
            const matchesContent = post.content?.toLowerCase().includes(lowerQuery);
            const matchesTags = post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
            const matchesAuthor = post.authorName?.toLowerCase().includes(lowerQuery);
            return matchesContent || matchesTags || matchesAuthor;
        });
        setFilteredPosts(filtered);
    }, [searchQuery, posts]);

    const handleClearSearch = () => {
        setSearchQuery('');
        setFilteredPosts(posts);
    };

    const trendingTopics = [
        { tag: 'MachineLearning', posts: '12.5K' },
        { tag: 'WebDevelopment', posts: '8.2K' },
        { tag: 'ReactJS', posts: '6.1K' },
        { tag: 'Python', posts: '5.8K' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-16">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Explore</h2>
                        <p className="text-sm text-gray-500">Discover trending content</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts, topics, or learners..."
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {isSearching && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-400"
                    >
                        Found {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </motion.p>
                )}
            </div>

            {/* Trending Topics */}
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <h3 className="font-semibold text-white">Trending Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {trendingTopics.map((topic, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSearchQuery(topic.tag)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors group"
                        >
                            <span className="text-pink-400">#</span>
                            <span className="text-white group-hover:text-pink-400 transition-colors">{topic.tag}</span>
                            <span className="text-gray-500 text-xs">{topic.posts}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {filteredPosts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
                    >
                        {post.imageUrl ? (
                            <img
                                src={post.imageUrl}
                                alt="Explore"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : post.codeSnippet ? (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center p-3">
                                <code className="text-[9px] text-emerald-400 font-mono line-clamp-4">{post.codeSnippet}</code>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center p-4">
                                <p className="text-xs text-gray-300 text-center line-clamp-3">{post.content}</p>
                            </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <div className="flex items-center gap-4 text-white font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <Heart className="w-5 h-5 fill-current" />
                                    <span>{post.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle className="w-5 h-5 fill-current" />
                                    <span>{post.commentsCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tags Badge */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                #{post.tags[0]}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {filteredPosts.length === 0 && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        {searchQuery ? <Search className="w-10 h-10 text-pink-400" /> : <TrendingUp className="w-10 h-10 text-pink-400" />}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {searchQuery ? 'No results found' : 'No posts to explore'}
                    </h3>
                    <p className="text-gray-400">
                        {searchQuery ? 'Try a different search term' : 'Be the first to create content!'}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium transition-colors"
                        >
                            Clear search
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
}
