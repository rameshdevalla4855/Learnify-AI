import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Grid, Bookmark, Users, Loader2, Settings, Flame, Award } from 'lucide-react';

export default function SocialProfile() {
    const { currentUser, userProfile } = useAuth();
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');

    useEffect(() => {
        if (!currentUser) return;

        const fetchUserPosts = async () => {
            try {
                const q = query(
                    collection(db, 'posts'),
                    where('authorId', '==', currentUser.uid),
                    orderBy('timestamp', 'desc')
                );
                const snapshot = await getDocs(q);
                setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching user posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPosts();
    }, [currentUser]);

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 px-4 py-8 border-b border-gray-200 dark:border-gray-800">
                {/* Avatar */}
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 shrink-0">
                    <img
                        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-4 border-white dark:border-black"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col items-center md:items-start space-y-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl md:text-2xl font-light text-gray-900 dark:text-white">
                            {currentUser.displayName || currentUser.email.split('@')[0]}
                        </h1>
                        <button className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Edit profile
                        </button>
                        <button className="p-2">
                            <Settings className="w-5 h-5 text-gray-900 dark:text-white" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8">
                        <div className="text-center md:text-left">
                            <span className="font-bold text-gray-900 dark:text-white block md:inline mr-1">{userPosts.length}</span>
                            <span className="text-gray-500">posts</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold text-gray-900 dark:text-white block md:inline mr-1">{userProfile?.connections?.length || 0}</span>
                            <span className="text-gray-500">followers</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold text-gray-900 dark:text-white block md:inline mr-1">{userProfile?.following?.length || 0}</span>
                            <span className="text-gray-500">following</span>
                        </div>
                    </div>

                    {/* Gamification: Streak & Badges */}
                    <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar max-w-full">
                        <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-800 shrink-0">
                            <Flame className="w-4 h-4 fill-current animate-pulse" />
                            <span>12 Day Streak</span>
                        </div>

                        {/* Placeholder Badges */}
                        <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 flex items-center justify-center text-yellow-600 dark:text-yellow-400" title="Top Contributor">
                                <Award className="w-4 h-4" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold" title="Code Wizard">
                                {`</>`}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 flex items-center justify-center text-purple-600 dark:text-purple-400 text-[10px] font-bold" title="Early Adopter">
                                🚀
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="text-center md:text-left text-sm text-gray-900 dark:text-white max-w-md">
                        <p className="font-semibold">{currentUser.displayName}</p>
                        <p>{userProfile?.bio || "Digital Creator • Learner • Tech Enthusiast"}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center border-t border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex items-center gap-2 h-12 px-4 text-xs font-semibold tracking-widest uppercase border-t flex-1 md:flex-none justify-center ${activeTab === 'posts' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400'}`}
                >
                    <Grid className="w-3 h-3" /> Posts
                </button>
                <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-2 h-12 px-4 text-xs font-semibold tracking-widest uppercase border-t flex-1 md:flex-none justify-center ${activeTab === 'saved' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400'}`}
                >
                    <Bookmark className="w-3 h-3" /> Saved
                </button>
                <button
                    onClick={() => setActiveTab('tagged')}
                    className={`flex items-center gap-2 h-12 px-4 text-xs font-semibold tracking-widest uppercase border-t flex-1 md:flex-none justify-center ${activeTab === 'tagged' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400'}`}
                >
                    <Users className="w-3 h-3" /> Tagged
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-1 sm:gap-4 pb-10">
                {activeTab === 'posts' && userPosts.map(post => (
                    <div key={post.id} className="aspect-square bg-gray-100 dark:bg-gray-900 relative group cursor-pointer">
                        {post.imageUrl ? (
                            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-2 text-xs text-center text-gray-500">
                                {post.content}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}

                {activeTab === 'saved' && (
                    <div className="col-span-3 py-20 text-center text-gray-500 text-sm">
                        Only you can see what you've saved.
                    </div>
                )}
            </div>
        </div>
    );
}
