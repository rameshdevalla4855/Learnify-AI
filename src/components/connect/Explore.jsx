import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { Search, Heart, MessageCircle, Loader2 } from 'lucide-react';

export default function Explore() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExplorePosts = async () => {
            try {
                // In a real app, this would use a complex recommendation algorithm
                // For now, we fetch recent posts
                const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(20));
                const snapshot = await getDocs(q);
                setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching explore posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExplorePosts();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md p-2 -mx-4 sm:mx-0 sm:rounded-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                    />
                </div>
            </div>

            {/* Masonry Grid (Simulated with CSS Grid) */}
            <div className="grid grid-cols-3 gap-1 sm:gap-4 pb-20">
                {posts.map((post) => (
                    <div key={post.id} className="relative aspect-square group cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-900 sm:rounded-lg">
                        {post.imageUrl ? (
                            <img
                                src={post.imageUrl}
                                alt="Explore"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-gray-500">
                                {post.content}
                            </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
                            <div className="flex items-center gap-1">
                                <Heart className="w-5 h-5 fill-white" />
                                <span>{post.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MessageCircle className="w-5 h-5 fill-white" />
                                <span>{post.commentsCount || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
