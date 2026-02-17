import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, doc, updateDoc, arrayRemove, arrayUnion, onSnapshot, getDoc, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, MessageCircle, UserPlus, Loader2, Bell, Check, X, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notifications() {
    const { currentUser, userProfile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [senderCache, setSenderCache] = useState({});

    const getSenderDetails = useCallback(async (senderId) => {
        if (senderCache[senderId]) {
            return senderCache[senderId];
        }

        try {
            const senderDoc = await getDoc(doc(db, 'users', senderId));
            if (senderDoc.exists()) {
                const data = senderDoc.data();
                const senderInfo = {
                    senderName: data.displayName || data.username || 'Learner',
                    senderAvatar: data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || data.email || 'User')}&background=random`
                };
                setSenderCache(prev => ({ ...prev, [senderId]: senderInfo }));
                return senderInfo;
            }
        } catch (err) {
            console.error('Error fetching sender details:', err);
        }

        const defaultInfo = {
            senderName: 'Learner',
            senderAvatar: `https://ui-avatars.com/api/?name=User&background=random`
        };
        setSenderCache(prev => ({ ...prev, [senderId]: defaultInfo }));
        return defaultInfo;
    }, [senderCache]);

    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const pendingConnections = userProfile?.pendingConnections || [];
            const requestNotifications = pendingConnections.map(uid => ({
                id: `req_${uid}`,
                type: 'follow_request',
                senderId: uid,
                timestamp: { seconds: Date.now() / 1000 }
            }));

            const allNotifs = [...requestNotifications, ...fetchedNotifs];
            
            const enrichedNotifs = await Promise.all(
                allNotifs.map(async (notif) => {
                    if (notif.senderName && notif.senderName !== 'Learner') {
                        return notif;
                    }
                    const senderInfo = await getSenderDetails(notif.senderId);
                    return { ...notif, ...senderInfo };
                })
            );

            setNotifications(enrichedNotifs);
            setLoading(false);
        }, (error) => {
            console.error('Notifications error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, userProfile, getSenderDetails]);

    const handleAcceptRequest = async (senderId) => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                pendingConnections: arrayRemove(senderId),
                connections: arrayUnion(senderId)
            });

            const senderRef = doc(db, 'users', senderId);
            await updateDoc(senderRef, {
                connections: arrayUnion(currentUser.uid)
            });

            await updateDoc(senderRef, {
                sentRequests: arrayRemove(currentUser.uid)
            });

            await addDoc(collection(db, 'notifications'), {
                recipientId: senderId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email?.split('@')[0],
                senderAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`,
                type: 'follow',
                timestamp: serverTimestamp(),
                read: false
            });

            setNotifications(prev => prev.filter(n => n.id !== `req_${senderId}`));
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    const handleDeclineRequest = async (senderId) => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                pendingConnections: arrayRemove(senderId)
            });

            const senderRef = doc(db, 'users', senderId);
            await updateDoc(senderRef, {
                sentRequests: arrayRemove(currentUser.uid)
            });

            setNotifications(prev => prev.filter(n => n.id !== `req_${senderId}`));
        } catch (error) {
            console.error("Error declining request:", error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like': return <Heart className="w-4 h-4 text-pink-500 fill-current" />;
            case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500 fill-current" />;
            case 'follow_request': return <UserPlus className="w-4 h-4 text-purple-500" />;
            case 'follow': return <Users className="w-4 h-4 text-green-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'requests') return n.type === 'follow_request';
        if (filter === 'interactions') return n.type !== 'follow_request';
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-16">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                    <Bell className="w-8 h-8 text-pink-400" />
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Notifications</h2>
                        <p className="text-sm text-gray-500">{notifications.length} updates</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'requests', label: 'Requests' },
                    { id: 'interactions', label: 'Interactions' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            filter === tab.id
                                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={notif.senderAvatar}
                                            alt=""
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                                        />
                                        <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#12121a] border border-white/10">
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-300">
                                            <span className="font-semibold text-white">{notif.senderName}</span>{' '}
                                            {notif.type === 'like' && 'liked your post'}
                                            {notif.type === 'comment' && `commented: "${notif.text?.slice(0, 30)}..."`}
                                            {notif.type === 'follow_request' && 'wants to connect with you'}
                                            {notif.type === 'follow' && 'started following you'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {notif.timestamp?.seconds
                                                ? new Date(notif.timestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : 'Just now'}
                                        </p>
                                    </div>

                                    {notif.type === 'follow_request' ? (
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleAcceptRequest(notif.senderId)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-pink-500/20"
                                            >
                                                <Check className="w-4 h-4" /> Accept
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDeclineRequest(notif.senderId)}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    ) : (
                                        notif.postImage && (
                                            <div className="w-12 h-12 bg-white/5 rounded-xl overflow-hidden">
                                                <img src={notif.postImage} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
                            <p className="text-gray-400">Check back later for new notifications</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
