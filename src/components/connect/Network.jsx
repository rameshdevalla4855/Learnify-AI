import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, UserCheck, Search, Loader2, MessageSquare, Sparkles, Users, TrendingUp, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Network() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [localSentRequests, setLocalSentRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('discover');

    useEffect(() => {
        if (currentUser) fetchUsers();
    }, [currentUser]);

    const fetchUsers = async (searchTerm = '') => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef);
            const snapshot = await getDocs(q);

            let fetchedUsers = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.id !== currentUser.uid);

            if (searchTerm) {
                const lowerTerm = searchTerm.toLowerCase();
                fetchedUsers = fetchedUsers.filter(u =>
                    (u.displayName && u.displayName.toLowerCase().includes(lowerTerm)) ||
                    (u.email && u.email.toLowerCase().includes(lowerTerm)) ||
                    (u.username && u.username.toLowerCase().includes(lowerTerm))
                );
            }

            setUsers(fetchedUsers.slice(0, 20));
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(searchQuery);
    };

    const handleConnect = async (targetUserId) => {
        try {
            const targetUserRef = doc(db, 'users', targetUserId);
            await updateDoc(targetUserRef, {
                pendingConnections: arrayUnion(currentUser.uid)
            });

            const currentUserRef = doc(db, 'users', currentUser.uid);
            await updateDoc(currentUserRef, {
                sentRequests: arrayUnion(targetUserId)
            });

            await addDoc(collection(db, 'notifications'), {
                recipientId: targetUserId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email?.split('@')[0],
                senderAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`,
                type: 'follow_request',
                timestamp: serverTimestamp(),
                read: false
            });

            setLocalSentRequests([...localSentRequests, targetUserId]);
        } catch (error) {
            console.error("Error sending connection request:", error);
        }
    };

    const handleStartChat = (user) => {
        navigate('/connect/chat', { state: { initialTarget: user } });
    };

    const sentRequests = userProfile?.sentRequests || [];
    const connections = userProfile?.connections || [];

    if (!currentUser) return null;

    const suggestedUsers = users.slice(0, 3);
    const allUsers = users;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Discover</h2>
                        <p className="text-sm text-gray-500">Find and connect with learners</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{connections.length} connections</span>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or username..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-sm font-medium text-white"
                >
                    Search
                </button>
            </form>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                    onClick={() => setActiveTab('discover')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'discover'
                            ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" /> Discover
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'all'
                            ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Users className="w-4 h-4" /> All Learners
                </button>
            </div>

            {/* Suggested Section */}
            {activeTab === 'discover' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Suggested for you</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 animate-pulse">
                                    <div className="w-20 h-20 bg-white/5 rounded-full mx-auto mb-4" />
                                    <div className="h-4 bg-white/5 rounded w-24 mx-auto mb-2" />
                                    <div className="h-3 bg-white/5 rounded w-32 mx-auto" />
                                </div>
                            ))
                        ) : suggestedUsers.map((user, index) => {
                            const isRequested = sentRequests.includes(user.id) || localSentRequests.includes(user.id);
                            const isConnected = connections.includes(user.id);

                            return (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-2xl p-6 text-center hover:border-pink-500/20 transition-colors group"
                                >
                                    <div className="relative inline-block mb-4">
                                        <img
                                            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`}
                                            alt={user.displayName}
                                            className="w-20 h-20 rounded-full object-cover ring-4 ring-white/5 group-hover:ring-pink-500/20 transition-all"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <Star className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-white mb-1">{user.displayName || "Learner"}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{user.bio?.slice(0, 40) || 'Learning enthusiast'}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleConnect(user.id)}
                                            disabled={isRequested || isConnected}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isConnected
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : isRequested
                                                        ? 'bg-white/5 text-gray-400'
                                                        : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40'
                                                }`}
                                        >
                                            {isConnected ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                            {isConnected ? 'Connected' : isRequested ? 'Sent' : 'Connect'}
                                        </button>
                                        <button
                                            onClick={() => handleStartChat(user)}
                                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* All Users Grid */}
            {activeTab === 'all' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                                    <div className="w-12 h-12 bg-white/5 rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-white/5 rounded w-24 mb-2" />
                                        <div className="h-3 bg-white/5 rounded w-32" />
                                    </div>
                                </div>
                            ))
                        ) : allUsers.map((user, index) => {
                            const isRequested = sentRequests.includes(user.id) || localSentRequests.includes(user.id);
                            const isConnected = connections.includes(user.id);

                            return (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.03] transition-colors"
                                >
                                    <img
                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`}
                                        alt={user.displayName}
                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate">{user.displayName || "Learner"}</h3>
                                        <p className="text-sm text-gray-500 truncate">@{user.username || 'learner'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleConnect(user.id)}
                                            disabled={isRequested || isConnected}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isConnected
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : isRequested
                                                        ? 'bg-white/5 text-gray-400'
                                                        : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                                                }`}
                                        >
                                            {isConnected ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{isConnected ? 'Connected' : isRequested ? 'Sent' : 'Connect'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleStartChat(user)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {allUsers.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No learners found</h3>
                            <p className="text-gray-400">Try a different search term</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
