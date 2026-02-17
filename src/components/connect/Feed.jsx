import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc } from 'firebase/firestore';
import { Image, Send, Loader2, Heart, MessageCircle, PlusSquare, Bookmark, MoreHorizontal, Share2, Check, Link2, Trash2, Edit2, X } from 'lucide-react';
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
    const [showHeart, setShowHeart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savedPosts, setSavedPosts] = useState([]);
    const [showShareToast, setShowShareToast] = useState(false);
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const handleLike = async (post) => {
        const postRef = doc(db, 'posts', post.id);
        const isLiked = post.likes?.includes(currentUser.uid);

        if (isLiked) {
            await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
        } else {
            await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
            setShowHeart(post.id);
            setTimeout(() => setShowHeart(null), 1000);
        }
    };

    const handleDoubleTap = (post) => {
        if (!post.likes?.includes(currentUser.uid)) {
            handleLike(post);
        } else {
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

    useEffect(() => {
        const fetchSavedPosts = async () => {
            if (!currentUser) return;
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                setSavedPosts(userDoc.data().savedPosts || []);
            }
        };
        fetchSavedPosts();
    }, [currentUser]);

    const handleSavePost = async (postId) => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const isSaved = savedPosts.includes(postId);
        
        if (isSaved) {
            await updateDoc(userRef, { savedPosts: arrayRemove(postId) });
            setSavedPosts(prev => prev.filter(id => id !== postId));
        } else {
            await updateDoc(userRef, { savedPosts: arrayUnion(postId) });
            setSavedPosts(prev => [...prev, postId]);
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2000);
        }
    };

    const handleSharePost = async (post) => {
        const shareUrl = `${window.location.origin}/connect?post=${post.id}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Post by ${post.authorName}`,
                    text: post.content?.slice(0, 100) || 'Check out this post on Learnify Social',
                    url: shareUrl
                });
            } catch (err) {
                // User cancelled or error
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 2000);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            setShowDeleteConfirm(null);
            setActivePostMenu(null);
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleEditPost = async (postId) => {
        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, { content: editContent });
            setEditingPost(null);
            setEditContent('');
            setActivePostMenu(null);
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const startEditing = (post) => {
        setEditingPost(post.id);
        setEditContent(post.content || '');
        setActivePostMenu(null);
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <Stories />

            {/* Create Post Trigger */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] transition-all group"
            >
                <div className="relative">
                    <img
                        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                        alt="User"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-500/30"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <PlusSquare className="w-2.5 h-2.5 text-white" />
                    </div>
                </div>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-full h-11 px-5 flex items-center text-gray-500 text-sm group-hover:border-pink-500/30 transition-colors">
                    Share your learning journey...
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    <button className="p-2.5 bg-white/5 hover:bg-pink-500/20 rounded-xl transition-colors">
                        <Image className="w-5 h-5 text-pink-400" />
                    </button>
                </div>
            </motion.div>

            {/* Posts Feed */}
            <div className="space-y-6">
                {loading ? (
                    <SkeletonFeed />
                ) : posts.map((post, index) => (
                    <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden"
                    >
                        {/* Post Header */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={post.authorAvatar}
                                    alt={post.authorName}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/20"
                                />
                                <div>
                                    <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                                        {post.authorName}
                                        {post.authorVerified && (
                                            <div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                                                <span className="text-[8px] text-white">✓</span>
                                            </div>
                                        )}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                        {post.timestamp?.seconds 
                                            ? new Date(post.timestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                            : 'Just now'}
                                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                        <span className="text-pink-400">Learning</span>
                                    </p>
                                </div>
                            </div>
                            {post.authorId === currentUser?.uid && (
                                <div className="relative">
                                    <button 
                                        onClick={() => setActivePostMenu(activePostMenu === post.id ? null : post.id)}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    <AnimatePresence>
                                        {activePostMenu === post.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden min-w-[120px]"
                                            >
                                                <button
                                                    onClick={() => startEditing(post)}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(post.id)}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Post Content */}
                        {post.type === 'code' && post.codeSnippet ? (
                            <div className="px-4 pb-3">
                                <CodeBlock code={post.codeSnippet} language={post.codeLanguage || 'javascript'} />
                            </div>
                        ) : post.mediaType === 'video' ? (
                            <div className="relative aspect-video bg-black group" onDoubleClick={() => handleDoubleTap(post)}>
                                <video
                                    src={post.mediaUrl || post.imageUrl}
                                    controls
                                    className="w-full h-full"
                                />
                                <AnimatePresence>
                                    {showHeart === post.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <Heart className="w-24 h-24 text-white fill-pink-500 drop-shadow-2xl" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : post.imageUrl ? (
                            <div 
                                className="relative aspect-square sm:aspect-auto sm:max-h-[500px] bg-gray-900 overflow-hidden cursor-pointer"
                                onDoubleClick={() => handleDoubleTap(post)}
                            >
                                <img
                                    src={post.imageUrl}
                                    alt="Post content"
                                    className="w-full h-full object-cover"
                                />
                                <AnimatePresence>
                                    {showHeart === post.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <Heart className="w-24 h-24 text-white fill-pink-500 drop-shadow-2xl" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : null}

                        {/* Content Text */}
                        {editingPost === post.id ? (
                            <div className="px-4 py-3">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
                                    rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleEditPost(post.id)}
                                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-sm font-medium text-white"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => { setEditingPost(null); setEditContent(''); }}
                                        className="px-4 py-2 bg-white/5 rounded-lg text-sm font-medium text-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : post.content && !post.imageUrl ? (
                            <div className="px-4 py-3">
                                <p className="text-gray-200 leading-relaxed">{post.content}</p>
                            </div>
                        ) : null}

                        {/* Action Buttons */}
                        <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
                            <div className="flex items-center gap-1">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleLike(post)}
                                    className={`p-2.5 rounded-xl transition-all ${
                                        post.likes?.includes(currentUser.uid) 
                                            ? 'text-pink-500 bg-pink-500/10' 
                                            : 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
                                    }`}
                                >
                                    <Heart className={`w-5 h-5 ${post.likes?.includes(currentUser.uid) ? 'fill-current' : ''}`} />
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setOpenCommentsPostId(post.id)}
                                    className="p-2.5 rounded-xl text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleSharePost(post)}
                                    className="p-2.5 rounded-xl text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleSavePost(post.id)}
                                className={`p-2.5 rounded-xl transition-all ${
                                    savedPosts.includes(post.id) 
                                        ? 'text-amber-400 bg-amber-500/10' 
                                        : 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                            >
                                <Bookmark className={`w-5 h-5 ${savedPosts.includes(post.id) ? 'fill-current' : ''}`} />
                            </motion.button>
                        </div>

                        {/* Likes & Caption */}
                        <div className="px-4 pb-4 space-y-2">
                            {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map((tag, i) => (
                                        <span key={i} className="text-xs font-medium text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="text-sm font-semibold text-white">
                                {post.likes?.length || 0} likes
                            </p>

                            {post.imageUrl && post.content && (
                                <div className="text-sm">
                                    <span className="font-semibold text-white mr-2">{post.authorName}</span>
                                    <span className="text-gray-300">{post.content}</span>
                                </div>
                            )}

                            {post.commentsCount > 0 && (
                                <button
                                    onClick={() => setOpenCommentsPostId(post.id)}
                                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    View all {post.commentsCount} comments
                                </button>
                            )}
                        </div>
                    </motion.article>
                ))}

                {posts.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Image className="w-10 h-10 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                        <p className="text-gray-400 mb-6">Be the first to share something with the community!</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all"
                        >
                            Create First Post
                        </button>
                    </motion.div>
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
                            className="bg-[#12121a] w-full max-w-sm rounded-2xl border border-white/10 p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-7 h-7 text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Delete Post?</h3>
                                <p className="text-gray-400 text-sm mb-6">This action cannot be undone. Are you sure you want to delete this post?</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(null)}
                                        className="flex-1 py-2.5 bg-white/5 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeletePost(showDeleteConfirm)}
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

            {/* Toast Notifications */}
            <AnimatePresence>
                {showShareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-6 left-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50"
                    >
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Link copied to clipboard!</span>
                    </motion.div>
                )}
                {showSaveToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-6 left-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50"
                    >
                        <Bookmark className="w-5 h-5" />
                        <span className="font-medium">Post saved!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
