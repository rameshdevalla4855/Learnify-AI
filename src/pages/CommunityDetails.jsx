import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, MessageCircle, ArrowLeft } from 'lucide-react';

export default function CommunityDetails() {
    const { communityId } = useParams();
    const [community, setCommunity] = useState(null);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [creating, setCreating] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (communityId) {
            fetchData();
        }
    }, [communityId]);

    async function fetchData() {
        try {
            const commRef = doc(db, "communities", communityId);
            const commSnap = await getDoc(commRef);
            if (commSnap.exists()) {
                setCommunity(commSnap.data());

                // Fetch threads (subcollection)
                const threadsRef = collection(db, "communities", communityId, "threads");
                const q = query(threadsRef, orderBy("createdAt", "desc"));
                const threadsSnap = await getDocs(q);
                setThreads(threadsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!currentUser) {
            alert("You must be logged in to post a discussion.");
            return;
        }
        setCreating(true);
        try {
            await addDoc(collection(db, "communities", communityId, "threads"), {
                title: newTitle,
                content: newContent,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email,
                createdAt: serverTimestamp(),
                repliesCount: 0
            });
            setNewTitle('');
            setNewContent('');
            setShowCreate(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to post discussion. Please try again.");
        } finally {
            setCreating(false);
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;
    if (!community) return <div className="p-8 text-center">Community not found.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link to="/communities" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Communities
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{community.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">{community.description}</p>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Discussions</h2>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    New Discussion
                </button>
            </div>

            {showCreate && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Start a Discussion</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                            <input
                                required
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                                placeholder="What's on your mind?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                            <textarea
                                required
                                rows={4}
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                                placeholder="Elaborate on your question or topic..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300">Cancel</button>
                            <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
                                {creating ? 'Posting...' : 'Post Discussion'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {threads.map(thread => (
                    <Link key={thread.id} to={`${thread.id}`} className="block">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:border-primary-200">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-primary-600">{thread.title}</h3>
                                    <p className="text-sm text-gray-500">Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{thread.authorName}</span> • {new Date(thread.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full text-xs font-medium">
                                    <MessageCircle className="h-4 w-4 mr-1.5" />
                                    {thread.repliesCount || 0} replies
                                </div>
                            </div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300 line-clamp-2">{thread.content}</p>
                        </div>
                    </Link>
                ))}
                {threads.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        No discussions yet. Start one!
                    </div>
                )}
            </div>
        </div>
    );
}
