import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, arrayRemove, arrayUnion, onSnapshot } from 'firebase/firestore';
import { Heart, MessageCircle, UserPlus, Loader2 } from 'lucide-react';

export default function Notifications() {
    const { currentUser, userProfile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // 1. Fetch Connection Requests (from user profile)
        const requests = userProfile?.pendingConnections || [];
        const requestNotifications = requests.map(uid => ({
            id: `req_${uid}`,
            type: 'follow_request',
            senderId: uid,
            timestamp: new Date() // Placeholder, ideally specific time
        }));

        // 2. Fetch Interaction Notifications (Likes/Comments)
        // In a real app, we'd have a 'notifications' collection.
        // For MVP, checking local state or if we implemented the collection trigger.
        // Let's rely on a 'notifications' collection query for future proofing.
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Merge requests and interactions
            // We need to fetch details for requests (sender names)
            fetchSenderDetails([...requestNotifications, ...fetchedNotifs])
                .then(finalNotifs => {
                    setNotifications(finalNotifs);
                    setLoading(false);
                });
        });

        return () => unsubscribe();
    }, [currentUser, userProfile]);

    const fetchSenderDetails = async (notifs) => {
        // Dedup user IDs to fetch
        const userIds = [...new Set(notifs.map(n => n.senderId))];
        // Fetch users (this is expensive in loop, in production use key-value store or include data in notif)
        // For MVP, assuming we can get minimal info or just use ID if fetch fails.
        // Optimisation: assume notifs already have 'senderName' if content interaction. 
        // Only fetch for follow requests.

        // Simulating populated data for requests since we don't have bulk fetch util ready
        return notifs.map(n => ({
            ...n,
            senderName: n.senderName || "User",
            senderAvatar: n.senderAvatar || `https://ui-avatars.com/api/?name=${n.senderId}`
        }));
    };

    const handleAcceptRequest = async (senderId) => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                pendingConnections: arrayRemove(senderId),
                connections: arrayUnion(senderId)
            });

            // Also update the sender's connections
            const senderRef = doc(db, 'users', senderId);
            await updateDoc(senderRef, {
                connections: arrayUnion(currentUser.uid),
                // sentRequests: arrayRemove(currentUser.uid) // If we tracked this on sender
            });

            // Remove from local list immediately for UI responsiveness
            setNotifications(prev => prev.filter(n => n.senderId !== senderId));
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-bold text-xl px-4 text-gray-900 dark:text-white">Notifications</h2>

            <div className="space-y-2">
                {/* Section: New */}
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div key={notif.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="relative">
                                <img
                                    src={notif.senderAvatar}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-gray-900">
                                    {notif.type === 'like' && <Heart className="w-3 h-3 text-red-500 fill-current" />}
                                    {notif.type === 'comment' && <MessageCircle className="w-3 h-3 text-blue-500 fill-current" />}
                                    {notif.type === 'follow_request' && <UserPlus className="w-3 h-3 text-purple-500 fill-current" />}
                                </div>
                            </div>

                            <div className="flex-1 text-sm">
                                <span className="font-semibold text-gray-900 dark:text-white mr-1">
                                    {notif.senderName}
                                </span>
                                <span className="text-gray-600 dark:text-gray-300">
                                    {notif.type === 'like' && 'liked your post.'}
                                    {notif.type === 'comment' && `commented: "${notif.text}"`}
                                    {notif.type === 'follow_request' && 'requested to follow you.'}
                                </span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {notif.timestamp ? new Date(notif.timestamp).toLocaleDateString() : 'Today'}
                                </p>
                            </div>

                            {notif.type === 'follow_request' ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAcceptRequest(notif.senderId)}
                                        className="btn-primary px-4 py-1.5 text-xs rounded-lg"
                                    >
                                        Confirm
                                    </button>
                                    <button className="px-4 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                        Delete
                                    </button>
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    {/* Thumbnail of post if interaction */}
                                    {notif.postImage && <img src={notif.postImage} alt="" className="w-full h-full object-cover" />}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>No notifications yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
