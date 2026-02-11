import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, getDoc } from 'firebase/firestore';
import { UserPlus, UserCheck, Search, Loader2, MessageSquare } from 'lucide-react';

export default function Network() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [localSentRequests, setLocalSentRequests] = useState([]); // For immediate feedback

    if (!currentUser) {
        return null; // Handled by wrapper
    }

    // Fetch initial suggestions or all users (limited)
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (searchTerm = '') => {
        setLoading(true);
        try {
            let q;
            const usersRef = collection(db, 'users');

            // Note: Simple search. Ideally use Algolia or specialized search service for production.
            if (searchTerm) {
                // This is a very basic prefix search and requires careful index setup or client-side filtering
                // for small datasets. Here we fetch all (limit 50) and filter client side for better UX in MVP.
                q = query(usersRef);
            } else {
                q = query(usersRef);
            }

            const snapshot = await getDocs(q);
            let fetchedUsers = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.id !== currentUser.uid); // Exclude self

            if (searchTerm) {
                const lowerTerm = searchTerm.toLowerCase();
                fetchedUsers = fetchedUsers.filter(u =>
                    (u.displayName && u.displayName.toLowerCase().includes(lowerTerm)) ||
                    (u.email && u.email.toLowerCase().includes(lowerTerm))
                );
            }

            setUsers(fetchedUsers.slice(0, 20)); // Limit display
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
            // Add targetUser to currentUser's 'sentRequests' (optional local tracking)
            // Add currentUser to targetUser's 'pendingConnections'

            // 1. Update target user's pending requests
            const targetUserRef = doc(db, 'users', targetUserId);
            await updateDoc(targetUserRef, {
                pendingConnections: arrayUnion(currentUser.uid)
            });

            // 2. Update current user's sent requests (to update UI immediately)
            const currentUserRef = doc(db, 'users', currentUser.uid);
            await updateDoc(currentUserRef, {
                sentRequests: arrayUnion(targetUserId)
            });

            setLocalSentRequests([...localSentRequests, targetUserId]);
        } catch (error) {
            console.error("Error sending connection request:", error);
            alert("Failed to send request.");
        }
    };

    const handleStartChat = (user) => {
        navigate('/connect/chat', { state: { initialTarget: user } });
    };

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            {/* Search Bar */}
            <div className="glass-card rounded-xl p-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for learners by name or email..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <button type="submit" className="btn-primary px-6 py-2 rounded-lg font-medium">
                        Search
                    </button>
                </form>
            </div>

            {/* User Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(user => {
                    const sentRequests = userProfile?.sentRequests || [];
                    const connections = userProfile?.connections || [];

                    const isRequested = sentRequests.includes(user.id) || localSentRequests.includes(user.id);
                    const isConnected = connections.includes(user.id);

                    return (
                        <div key={user.id} className="glass-card rounded-xl p-6 flex flex-col items-center text-center">
                            <img
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`}
                                alt={user.displayName}
                                className="w-20 h-20 rounded-full mb-4 object-cover ring-4 ring-gray-50 dark:ring-gray-900"
                            />
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                {user.displayName || "Learner"}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                            <div className="mt-auto w-full flex gap-2">
                                <button
                                    onClick={() => handleConnect(user.id)}
                                    disabled={isRequested || isConnected}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors font-medium text-sm ${isRequested || isConnected
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/40'
                                        }`}
                                >
                                    {isConnected ? (
                                        <>
                                            <UserCheck className="w-4 h-4" /> Connected
                                        </>
                                    ) : isRequested ? (
                                        <>
                                            <UserCheck className="w-4 h-4" /> Sent
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" /> Connect
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleStartChat(user)}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                                    title="Message"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {users.length === 0 && !loading && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No users found. Try a different search.
                    </div>
                )}

                {loading && (
                    <div className="col-span-full flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                )}
            </div>
        </div>
    );
}
