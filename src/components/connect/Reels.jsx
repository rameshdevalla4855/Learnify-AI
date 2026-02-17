import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { Heart, MessageCircle, Send, MoreVertical, Music2, Volume2, VolumeX, Play, Pause, Loader2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Reels() {
    const { currentUser } = useAuth();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [likedReels, setLikedReels] = useState({});
    const [savedReels, setSavedReels] = useState([]);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const q = query(
            collection(db, 'posts'),
            where('mediaType', '==', 'video'),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedReels = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReels(fetchedReels);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchSavedReels = async () => {
            if (!currentUser) return;
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setSavedReels(userDocSnap.data().savedPosts || []);
            }
        };
        fetchSavedReels();
    }, [currentUser]);

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
            }
        }
    }, [currentIndex, isPlaying]);

    const handleScroll = (e) => {
        const container = containerRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const itemHeight = container.clientHeight;
        const newIndex = Math.round(scrollTop / itemHeight);

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
            setCurrentIndex(newIndex);
            setIsPlaying(true);
        }
    };

    const handleTogglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleToggleMute = () => {
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    const handleLike = async (reelId) => {
        const reelRef = doc(db, 'posts', reelId);
        const isLiked = likedReels[reelId];

        if (isLiked) {
            await updateDoc(reelRef, { likes: arrayRemove(currentUser.uid) });
            setLikedReels(prev => ({ ...prev, [reelId]: false }));
        } else {
            await updateDoc(reelRef, { likes: arrayUnion(currentUser.uid) });
            setLikedReels(prev => ({ ...prev, [reelId]: true }));
        }
    };

    const handleSave = async (reelId) => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const isSaved = savedReels.includes(reelId);

        if (isSaved) {
            await updateDoc(userRef, { savedPosts: arrayRemove(reelId) });
            setSavedReels(prev => prev.filter(id => id !== reelId));
        } else {
            await updateDoc(userRef, { savedPosts: arrayUnion(reelId) });
            setSavedReels(prev => [...prev, reelId]);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] w-full max-w-md mx-auto flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
                    <p className="text-gray-400">Loading reels...</p>
                </div>
            </div>
        );
    }

    if (reels.length === 0) {
        return (
            <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] w-full max-w-md mx-auto flex items-center justify-center">
                <div className="text-center px-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Play className="w-10 h-10 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No reels yet</h3>
                    <p className="text-gray-400">Upload video posts to see them here!</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] w-full max-w-md mx-auto overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-xl"
        >
            {reels.map((reel, index) => {
                const isLiked = likedReels[reel.id] || reel.likes?.includes(currentUser?.uid);
                const isSaved = savedReels.includes(reel.id);

                return (
                    <div
                        key={reel.id}
                        className="w-full h-full snap-start relative bg-black flex items-center justify-center"
                    >
                        {/* Video */}
                        {reel.mediaUrl || reel.imageUrl ? (
                            <video
                                ref={index === currentIndex ? videoRef : null}
                                src={reel.mediaUrl || reel.imageUrl}
                                loop
                                playsInline
                                muted={isMuted}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
                                <p className="text-white text-center px-8">{reel.content}</p>
                            </div>
                        )}

                        {/* Play/Pause Overlay */}
                        <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer"
                            onClick={handleTogglePlay}
                        >
                            <AnimatePresence>
                                {!isPlaying && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm"
                                    >
                                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Overlay UI */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 p-4 flex flex-col justify-end">
                            <div className="flex items-end justify-between">
                                {/* Info */}
                                <div className="space-y-3 mb-4 max-w-[70%]">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={reel.authorAvatar || `https://ui-avatars.com/api/?name=${reel.authorName}`}
                                            alt={reel.authorName}
                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                                        />
                                        <div>
                                            <span className="text-white font-semibold text-sm">{reel.authorName}</span>
                                            {reel.authorVerified && (
                                                <span className="ml-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full inline-flex items-center justify-center">
                                                    <span className="text-[8px] text-white">✓</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {reel.content && (
                                        <p className="text-white text-sm line-clamp-2">{reel.content}</p>
                                    )}
                                    {reel.tags && reel.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {reel.tags.slice(0, 2).map((tag, i) => (
                                                <span key={i} className="text-pink-300 text-xs">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-white/80 text-xs">
                                        <Music2 className="w-3 h-3" />
                                        <span className="truncate">Original Audio - {reel.authorName}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-5 flex flex-col items-center">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleLike(reel.id)}
                                        className="flex flex-col items-center gap-1"
                                    >
                                        <Heart className={`w-7 h-7 ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                                        <span className="text-white text-xs">{reel.likes?.length || 0}</span>
                                    </motion.button>
                                    <div className="flex flex-col items-center gap-1">
                                        <MessageCircle className="w-7 h-7 text-white -rotate-90" />
                                        <span className="text-white text-xs">{reel.commentsCount || 0}</span>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleSave(reel.id)}
                                    >
                                        <Bookmark className={`w-6 h-6 ${isSaved ? 'text-amber-400 fill-amber-400' : 'text-white'}`} />
                                    </motion.button>
                                    <Send className="w-6 h-6 text-white -rotate-45" />
                                    <MoreVertical className="w-6 h-6 text-white" />
                                    <button onClick={handleToggleMute} className="mt-1">
                                        {isMuted ? (
                                            <VolumeX className="w-6 h-6 text-white" />
                                        ) : (
                                            <Volume2 className="w-6 h-6 text-white" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}