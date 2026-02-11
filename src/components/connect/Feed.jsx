import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Image, Send, Loader2, Heart, MessageCircle, PlusSquare } from 'lucide-react';
import Stories from './Stories';
import CommentsModal from './CommentsModal';
import CreatePostModal from './CreatePostModal';
import CodeBlock from './CodeBlock';
import SkeletonFeed from './SkeletonFeed';
import { AnimatePresence, motion } from 'framer-motion';

export default function Feed() {
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const [showHeart, setShowHeart] = useState(null); // stores post ID for animation
    const [loading, setLoading] = useState(true);

    const handleLike = async (post) => {
        const postRef = doc(db, 'posts', post.id);
        const isLiked = post.likes?.includes(currentUser.uid);

        if (isLiked) {
            await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
        } else {
            await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
            // Show animation only on like, not unlike
            setShowHeart(post.id);
            setTimeout(() => setShowHeart(null), 1000);
        }
    };

    const handleDoubleTap = (post) => {
        // Trigger like if not already liked, or just show animation
        if (!post.likes?.includes(currentUser.uid)) {
            handleLike(post);
        } else {
            // Just show animation if already liked
            setShowHeart(post.id);
            setTimeout(() => setShowHeart(null), 1000);
        }
    };

    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (!currentUser) {
        return null; // Should be handled by ProtectedRoute
    }

    return (
        <div className="space-y-6">
            {/* Stories Section */}
            <Stories />

            {/* Create Post Trigger (Mobile/Desktop) */}
            <div
                onClick={() => setIsCreateModalOpen(true)}
                className="glass-card rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            >
                <img
                    src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-10 px-4 flex items-center text-gray-500 text-sm">
                    Start a post, share your learning...
                </div>
                <button className="text-primary-600 p-2">
                    <PlusSquare className="w-6 h-6" />
                </button>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
                {loading ? (
                    <SkeletonFeed />
                ) : posts.map((post) => (
                    <div key={post.id} className="glass-card rounded-xl overflow-hidden pb-4">
                        {/* Post Header */}
                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src={post.authorAvatar}
                                    alt={post.authorName}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
                                />
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-none">
                                        {post.authorName}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        {/* Optional: Add location or custom tag here */}
                                        Suggested for you
                                    </p>
                                </div>
                            </div>
                            <button className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <span className="sr-only">Options</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                </div>
                            </button>
                        </div>

                        {/* Post Content Area */}
                        {post.type === 'code' && post.codeSnippet ? (
                            <div className="px-4 pb-2">
                                <CodeBlock code={post.codeSnippet} language={post.codeLanguage || 'javascript'} />
                            </div>
                        ) : post.mediaType === 'video' ? (
                            <div className="w-full bg-black aspect-video flex items-center justify-center">
                                <video
                                    src={post.mediaUrl || post.imageUrl}
                                    controls
                                    className="w-full h-full"
                                />
                            </div>
                        ) : post.imageUrl ? (
                            <div className="w-full bg-gray-100 dark:bg-gray-900 aspect-square sm:aspect-auto sm:max-h-[600px] flex items-center justify-center overflow-hidden">
                                <img
                                    src={post.imageUrl}
                                    alt="Post content"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : null}

                        {/* Action Buttons */}
                        <div className="px-3 pt-3 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleLike(post)}
                                    className={`group transition-colors ${post.likes?.includes(currentUser.uid) ? 'text-red-500' : 'text-gray-900 dark:text-white hover:text-red-500'}`}
                                >
                                    <Heart className={`w-6 h-6 group-hover:scale-110 transition-transform ${post.likes?.includes(currentUser.uid) ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={() => setOpenCommentsPostId(post.id)}
                                    className="group text-gray-900 dark:text-white hover:text-blue-500 transition-colors"
                                >
                                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform -rotate-90" />
                                </button>
                                <button className="group text-gray-900 dark:text-white hover:text-green-500 transition-colors">
                                    <Send className="w-6 h-6 group-hover:scale-110 transition-transform -rotate-45 mb-1" />
                                </button>
                            </div>
                            <button className="text-gray-900 dark:text-white">
                                {/* Bookmark Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark hover:fill-current transition-colors"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                            </button>
                        </div>

                        {/* Likes & Caption */}
                        <div className="px-4 py-2 space-y-1">
                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-1">
                                    {post.tags.map((tag, i) => (
                                        <span key={i} className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {post.likes?.length || 0} likes
                            </p>

                            <div className="text-sm">
                                <span className="font-bold mr-2 text-gray-900 dark:text-white">{post.authorName}</span>
                                <span className="text-gray-800 dark:text-gray-200">{post.content}</span>
                            </div>

                            {post.commentsCount > 0 ? (
                                <button
                                    onClick={() => setOpenCommentsPostId(post.id)}
                                    className="text-gray-500 text-sm mt-1"
                                >
                                    View all {post.commentsCount} comments
                                </button>
                            ) : (
                                <p className="text-gray-400 text-xs uppercase tracking-wide pt-1">
                                    {post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleString(undefined, { month: 'long', day: 'numeric' }) : 'JUST NOW'}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {posts.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No posts yet. Be the first to share something!</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreatePostModal onClose={() => setIsCreateModalOpen(false)} />
                )}
                {openCommentsPostId && (
                    <CommentsModal
                        postId={openCommentsPostId}
                        onClose={() => setOpenCommentsPostId(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
