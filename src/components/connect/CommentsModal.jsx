import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommentsModal({ postId, onClose }) {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentsEndRef = useRef(null);

    useEffect(() => {
        if (!postId) return;

        const q = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    useEffect(() => {
        // Scroll to bottom on new comments
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Add comment
            await addDoc(collection(db, 'posts', postId, 'comments'), {
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email.split('@')[0],
                authorAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`,
                text: newComment,
                timestamp: serverTimestamp()
            });

            // Update post comment count
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                commentsCount: increment(1)
            });

            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                className="bg-white dark:bg-gray-900 w-full max-w-lg h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center relative">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full absolute top-2 sm:hidden" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-2 sm:mt-0">Comments</h3>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>No comments yet.</p>
                            <p className="text-xs">Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <img
                                    src={comment.authorAvatar}
                                    alt={comment.authorName}
                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm">
                                        <span className="font-semibold text-gray-900 dark:text-white mr-2">
                                            {comment.authorName}
                                        </span>
                                        <span className="text-gray-800 dark:text-gray-200">
                                            {comment.text}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {comment.timestamp?.seconds ? new Date(comment.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <img
                            src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email}`}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            alt=""
                        />
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isSubmitting}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
