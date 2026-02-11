import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Stories() {
    const { currentUser } = useAuth();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch recent stories (last 24h)
    useEffect(() => {
        if (!currentUser) return;

        // In a real app, we'd filter by timestamp > 24h ago. 
        // For simplicity/demo, we connect to a 'stories' collection and just get recent ones.
        const q = query(collection(db, 'stories'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedStories = [];
            snapshot.forEach(doc => {
                fetchedStories.push({ id: doc.id, ...doc.data() });
            });
            // Group by user
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
            alert("Failed to upload story.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleNextStory = () => {
        if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
            setSelectedStoryIndex(selectedStoryIndex + 1);
        } else {
            setSelectedStoryIndex(null); // Close if at end
        }
    };

    const handlePrevStory = () => {
        if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
            setSelectedStoryIndex(selectedStoryIndex - 1);
        }
    };

    return (
        <>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
                {/* Add Story Button */}
                <div className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer relative group">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full p-[2px] border-2 border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-colors">
                            <img
                                src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email || 'User'}`}
                                alt="You"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <label className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-1 cursor-pointer hover:bg-primary-600 transition-colors border-2 border-white dark:border-black">
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Your Story</span>
                </div>

                {/* Other Stories */}
                {stories.map((userStory, index) => (
                    <div
                        key={userStory.userId}
                        className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer"
                        onClick={() => setSelectedStoryIndex(index)}
                    >
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                            <img
                                src={userStory.userAvatar}
                                alt={userStory.username}
                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black"
                            />
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-16 text-center">
                            {userStory.username}
                        </span>
                    </div>
                ))}
            </div>

            {/* Story Viewer Modal */}
            <AnimatePresence>
                {selectedStoryIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
                        onClick={() => setSelectedStoryIndex(null)}
                    >
                        <button className="absolute top-4 right-4 text-white p-2 z-50" onClick={() => setSelectedStoryIndex(null)}>
                            <X className="w-8 h-8" />
                        </button>

                        <div
                            className="relative w-full max-w-md aspect-[9/16] bg-black rounded-xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Navigation Overlays */}
                            <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={handlePrevStory} />
                            <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={handleNextStory} />

                            {/* User Info Overlay */}
                            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-20 flex items-center gap-3">
                                <img
                                    src={stories[selectedStoryIndex].userAvatar}
                                    className="w-8 h-8 rounded-full border border-white/50"
                                    alt=""
                                />
                                <span className="text-white font-semibold text-sm">
                                    {stories[selectedStoryIndex].username}
                                </span>
                            </div>

                            {/* Image Content - Show latest for now (improvement: carousel of items) */}
                            <img
                                src={stories[selectedStoryIndex].items[0].imageUrl}
                                className="w-full h-full object-cover"
                                alt="Story"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
