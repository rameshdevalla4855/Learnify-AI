import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, onSnapshot, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Grid, Bookmark, Users, Loader2, Settings, Flame, Award, Edit2, Share2, Calendar, MapPin, Link as LinkIcon, Heart, MessageCircle, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SocialProfile() {
    const { userId: routeUserId } = useParams();
    const navigate = useNavigate();
    const { currentUser, userProfile: currentUserProfile } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedPostsData, setSavedPostsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('none'); // none, pending, connected

    const isOwnProfile = !routeUserId || routeUserId === currentUser?.uid;
    const targetUserId = isOwnProfile ? currentUser?.uid : routeUserId;

    // Fetch profile data for the target user
    useEffect(() => {
        if (!targetUserId) return;

        if (isOwnProfile) {
            setProfileUser(currentUser);
            setProfileData(currentUserProfile);
            setBio(currentUserProfile?.bio || '');
            return;
        }

        // Fetch other user's profile
        const userRef = doc(db, 'users', targetUserId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData(data);
                setProfileUser({
                    uid: targetUserId,
                    displayName: data.displayName,
                    email: data.email,
                    photoURL: data.photoURL,
                });
                setBio(data.bio || '');
            }
        });

        return () => unsubscribe();
    }, [targetUserId, isOwnProfile, currentUser, currentUserProfile]);

    // Check connection status
    useEffect(() => {
        if (isOwnProfile || !currentUserProfile || !targetUserId) return;

        if (currentUserProfile.connections?.includes(targetUserId)) {
            setConnectionStatus('connected');
        } else if (currentUserProfile.sentRequests?.includes(targetUserId)) {
            setConnectionStatus('pending');
        } else {
            setConnectionStatus('none');
        }
    }, [currentUserProfile, targetUserId, isOwnProfile]);

    // Fetch user posts
    useEffect(() => {
        if (!targetUserId) return;

        const fetchUserPosts = async () => {
            try {
                const q = query(
                    collection(db, 'posts'),
                    where('authorId', '==', targetUserId),
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
    }, [targetUserId]);

    // Fetch saved posts (only for own profile)
    useEffect(() => {
        if (!isOwnProfile || !currentUser) return;

        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSavedPosts(data.savedPosts || []);
            }
        });

        return () => unsubscribe();
    }, [currentUser, isOwnProfile]);

    useEffect(() => {
        const fetchSavedPostsData = async () => {
            if (savedPosts.length === 0) {
                setSavedPostsData([]);
                return;
            }

            setLoadingSaved(true);
            try {
                const postsData = [];
                for (const postId of savedPosts) {
                    const postDoc = await getDocs(query(collection(db, 'posts'), where('__name__', '==', postId)));
                    postDoc.forEach(doc => {
                        postsData.push({ id: doc.id, ...doc.data() });
                    });
                }
                setSavedPostsData(postsData);
            } catch (error) {
                console.error("Error fetching saved posts:", error);
            } finally {
                setLoadingSaved(false);
            }
        };

        if (activeTab === 'saved' && isOwnProfile) {
            fetchSavedPostsData();
        }
    }, [savedPosts, activeTab, isOwnProfile]);

    const handleSaveBio = async () => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { bio });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating bio:", error);
        }
    };

    const handleConnect = async () => {
        if (!currentUser || !targetUserId) return;
        try {
            const targetUserRef = doc(db, 'users', targetUserId);
            await updateDoc(targetUserRef, {
                pendingConnections: arrayUnion(currentUser.uid)
            });
            const currentUserRef = doc(db, 'users', currentUser.uid);
            await updateDoc(currentUserRef, {
                sentRequests: arrayUnion(targetUserId)
            });
            setConnectionStatus('pending');
        } catch (error) {
            console.error("Error sending connection request:", error);
        }
    };

    const handleStartChat = () => {
        navigate('/connect/chat', { state: { initialTarget: { id: targetUserId, ...profileData } } });
    };

    const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const totalComments = userPosts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);

    if (loading || (!profileUser && !currentUser)) {
        return (
            <div className="flex justify-center p-16">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        );
    }

    if (!profileUser && isOwnProfile) {
        return (
            <div className="flex justify-center p-16">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
                    <p className="text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    const displayName = profileUser?.displayName || profileUser?.email?.split('@')[0] || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
    const photoURL = profileUser?.photoURL || `https://ui-avatars.com/api/?name=${displayName}`;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl p-6 md:p-8 mb-6"
            >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500">
                            <img
                                src={photoURL}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover border-4 border-[#0a0a0f]"
                            />
                        </div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-[#0a0a0f]">
                            <span className="text-[10px] text-white">✓</span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                            <h1 className="text-2xl font-bold text-white">
                                {displayName}
                            </h1>
                            <div className="flex items-center gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors flex items-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit profile
                                        </button>
                                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                                            <Settings className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleConnect}
                                            disabled={connectionStatus !== 'none'}
                                            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all ${connectionStatus === 'connected'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : connectionStatus === 'pending'
                                                        ? 'bg-white/5 text-gray-400 border border-white/10'
                                                        : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40'
                                                }`}
                                        >
                                            {connectionStatus === 'connected' ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Request Sent' : 'Connect'}
                                        </button>
                                        <button
                                            onClick={handleStartChat}
                                            className="flex items-center gap-1.5 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center md:justify-start gap-8 mb-6">
                            <div className="text-center">
                                <span className="text-xl font-bold text-white">{userPosts.length}</span>
                                <span className="text-gray-400 text-sm ml-1">posts</span>
                            </div>
                            <div className="text-center">
                                <span className="text-xl font-bold text-white">{profileData?.connections?.length || 0}</span>
                                <span className="text-gray-400 text-sm ml-1">followers</span>
                            </div>
                            <div className="text-center">
                                <span className="text-xl font-bold text-white">{totalLikes}</span>
                                <span className="text-gray-400 text-sm ml-1">likes</span>
                            </div>
                        </div>

                        {/* Bio */}
                        {isEditing && isOwnProfile ? (
                            <div className="space-y-3">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Write something about yourself..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
                                    rows={2}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveBio}
                                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-sm font-medium text-white"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 bg-white/5 rounded-lg text-sm font-medium text-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-300 text-sm leading-relaxed max-w-md">
                                <p className="font-semibold text-white mb-1">{displayName}</p>
                                <p>{profileData?.bio || "Learning enthusiast • Tech lover • Always growing 🚀"}</p>
                            </div>
                        )}

                        {/* Badges */}
                        <div className="flex items-center gap-3 mt-5 justify-center md:justify-start">
                            <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-500/30">
                                <Flame className="w-4 h-4" />
                                <span>{profileData?.learningStats?.xp || 0} XP</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400" title="Top Contributor">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono text-[10px] font-bold" title="Code Wizard">
                                    {`</>`}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs" title="Early Adopter">
                                    🚀
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex justify-center border-b border-white/5 mb-6">
                {[
                    { id: 'posts', icon: Grid, label: 'Posts' },
                    ...(isOwnProfile ? [{ id: 'saved', icon: Bookmark, label: 'Saved' }] : []),
                    { id: 'tagged', icon: Users, label: 'Tagged' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 h-12 px-6 text-xs font-semibold tracking-wider uppercase border-t-2 transition-colors ${activeTab === tab.id
                                ? 'border-pink-500 text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <AnimatePresence mode="wait">
                {activeTab === 'posts' && (
                    <motion.div
                        key="posts"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-3 gap-1 sm:gap-2"
                    >
                        {userPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden rounded-lg"
                            >
                                {post.imageUrl ? (
                                    <img src={post.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : post.codeSnippet ? (
                                    <div className="w-full h-full bg-gray-900 flex items-center justify-center p-3">
                                        <code className="text-[8px] text-emerald-400 font-mono truncate">{post.codeSnippet}</code>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-4 text-xs text-center text-gray-400">
                                        {post.content?.slice(0, 50)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-4">
                                    <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
                                        <Heart className="w-4 h-4 fill-current" /> {post.likes?.length || 0}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
                                        <MessageCircle className="w-4 h-4" /> {post.commentsCount || 0}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {userPosts.length === 0 && (
                            <div className="col-span-3 py-20 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Grid className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
                                <p className="text-gray-400">{isOwnProfile ? 'Share your first post to get started!' : 'This user hasn\'t posted yet.'}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'saved' && isOwnProfile && (
                    <motion.div
                        key="saved"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-3 gap-1 sm:gap-2"
                    >
                        {loadingSaved ? (
                            <div className="col-span-3 flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                            </div>
                        ) : savedPostsData.length > 0 ? (
                            savedPostsData.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden rounded-lg"
                                >
                                    {post.imageUrl ? (
                                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : post.codeSnippet ? (
                                        <div className="w-full h-full bg-gray-900 flex items-center justify-center p-3">
                                            <code className="text-[8px] text-emerald-400 font-mono truncate">{post.codeSnippet}</code>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-4 text-xs text-center text-gray-400">
                                            {post.content?.slice(0, 50)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-4">
                                        <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
                                            <Heart className="w-4 h-4 fill-current" /> {post.likes?.length || 0}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
                                            <MessageCircle className="w-4 h-4" /> {post.commentsCount || 0}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-3 py-20 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Bookmark className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No saved posts yet</h3>
                                <p className="text-gray-400">Save posts to see them here</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'tagged' && (
                    <motion.div
                        key="tagged"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="py-20 text-center"
                    >
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Photos of you</h3>
                        <p className="text-gray-400">Posts where you've been tagged will appear here</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
