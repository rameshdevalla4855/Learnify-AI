import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Users, Hash } from 'lucide-react';

export default function Communities() {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newByName, setNewByName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchCommunities();
    }, []);

    async function fetchCommunities() {
        try {
            const q = query(collection(db, "communities"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCommunities(data);
        } catch (err) {
            console.error("Error fetching communities:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!currentUser) {
            alert("You must be logged in to create a community.");
            return;
        }
        setCreating(true);
        try {
            await addDoc(collection(db, "communities"), {
                name: newByName,
                description: newDesc,
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
                membersCount: 1
            });
            setNewByName('');
            setNewDesc('');
            setShowCreate(false);
            fetchCommunities();
        } catch (err) {
            console.error(err);
            alert("Failed to create community. Please try again.");
        } finally {
            setCreating(false);
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Communities</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Join discussions and learn with peers.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Community
                </button>
            </div>

            {showCreate && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">New Community</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                required
                                type="text"
                                value={newByName}
                                onChange={e => setNewByName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea
                                required
                                rows={3}
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300">Cancel</button>
                            <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {communities.map(comm => (
                    <Link key={comm.id} to={`/communities/${comm.id}`} className="block group">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-6 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                                    <Hash className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{comm.name}</h3>
                                    <p className="text-xs text-gray-500">{new Date(comm.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">{comm.description}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                                <Users className="h-4 w-4 mr-1.5" />
                                {comm.membersCount || 1} members
                            </div>
                        </div>
                    </Link>
                ))}
                {communities.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No communities yet. Be the first to create one!
                    </div>
                )}
            </div>
        </div>
    );
}
