import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Plus, X, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Stories() {
    const { currentUser } = useAuth();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, 'stories'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedStories = [];
            snapshot.forEach(doc => {
                fetchedStories.push({ id: doc.id, ...doc.data() });
            });
            
            const grouped = fetchedStories.reduce((acc, story) => {
                if (!acc[story.userId]) {
                    acc[story.userId] = {
                        userId: story.userId,
                        username: story.username,
                        userAvatar: story.userAvatar,
                        items: []
                    };
                }
                acc[story.userId].items.push(story);
                return acc;
            }, {});

            setStories(Object.values(grouped));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        setIsUploading(true);
        try {
            const imageUrl = await uploadToCloudinary(file);
            await addDoc(collection(db, 'stories'), {
                userId: currentUser.uid,
                username: currentUser.displayName || currentUser.email.split('@')[0],
                userAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`,
                imageUrl,
                timestamp: serverTimestamp(),
                viewers: []
            });
        } catch (error) {
            console.error("Failed to upload story:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleNextStory = () => {
        if (selectedStoryIndex === null) return;
        
        const currentStory = stories[selectedStoryIndex];
        if (currentItemIndex < currentStory.items.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
            setProgress(0);
        } else if (selectedStoryIndex < stories.length - 1) {
            setSelectedStoryIndex(selectedStoryIndex + 1);
            setCurrentItemIndex(0);
            setProgress(0);
        } else {
            setSelectedStoryIndex(null);
        }
    };

    const handlePrevStory = () => {
        if (selectedStoryIndex === null) return;
        
        if (currentItemIndex > 0) {
            setCurrentItemIndex(currentItemIndex - 1);
            setProgress(0);
        } else if (selectedStoryIndex > 0) {
            setSelectedStoryIndex(selectedStoryIndex - 1);
            setCurrentItemIndex(0);
            setProgress(0);
        }
    };

    // Auto-progress story
    useEffect(() => {
        if (selectedStoryIndex === null) return;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNextStory();
                    return 0;
                }
                return prev + 2;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [selectedStoryIndex, currentItemIndex]);

    return (
        <>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
                {/* Add Story Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group"
                >
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-pink-500/50 transition-all">
                            <img
                                src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email || 'User'}`}
                                alt="You"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        </div>
                        <label className="absolute bottom-0 right-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full p-1.5 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-pink-500/30">
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>
                    <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">Your Story</span>
                </motion.div>

                {/* Other Stories */}
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse" />
                            <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
                        </div>
                    ))
                ) : (
                    stories.map((userStory, index) => (
                        <motion.div
                            key={userStory.userId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group"
                            onClick={() => {
                                setSelectedStoryIndex(index);
                                setCurrentItemIndex(0);
                                setProgress(0);
                            }}
                        >
                            <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 group-hover:scale-105 transition-transform">
                                <img
                                    src={userStory.userAvatar}
                                    alt={userStory.username}
                                    className="w-full h-full rounded-[14px] object-cover"
                                />
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-white transition-colors truncate w-16 text-center">
                                {userStory.username?.split(' ')[0]}
                            </span>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Story Viewer Modal */}
            <AnimatePresence>
                {selectedStoryIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
                        onClick={() => setSelectedStoryIndex(null)}
                    >
                        {/* Close Button */}
                        <button 
                            className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50" 
                            onClick={() => setSelectedStoryIndex(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Story Container */}
                        <div
                            className="relative w-full max-w-[400px] h-full max-h-[700px] mx-4"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Progress Bars */}
                            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                                {stories[selectedStoryIndex].items.map((_, idx) => (
                                    <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white rounded-full transition-all duration-100"
                                            style={{ 
                                                width: idx < currentItemIndex ? '100%' : 
                                                       idx === currentItemIndex ? `${progress}%` : '0%' 
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Navigation Areas */}
                            <div 
                                className="absolute inset-y-0 left-0 w-1/3 z-10" 
                                onClick={handlePrevStory}
                            />
                            <div 
                                className="absolute inset-y-0 right-0 w-1/3 z-10" 
                                onClick={handleNextStory}
                            />

                            {/* User Info */}
                            <div className="absolute top-10 left-4 right-4 z-20 flex items-center gap-3">
                                <img
                                    src={stories[selectedStoryIndex].userAvatar}
                                    className="w-9 h-9 rounded-full ring-2 ring-white/30"
                                    alt=""
                                />
                                <div className="flex-1">
                                    <span className="text-white font-semibold text-sm">
                                        {stories[selectedStoryIndex].username}
                                    </span>
                                </div>
                                <Sparkles className="w-5 h-5 text-white/50" />
                            </div>

                            {/* Story Image */}
                            <img
                                src={stories[selectedStoryIndex].items[currentItemIndex]?.imageUrl}
                                className="w-full h-full object-cover rounded-2xl"
                                alt="Story"
                            />

                            {/* Gradient Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 rounded-2xl pointer-events-none" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
