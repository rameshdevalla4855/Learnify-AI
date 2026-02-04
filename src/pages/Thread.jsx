import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { generateReply } from '../services/gemini';
import { Loader2, Send, ArrowLeft, Bot, Sparkles, User, MessageCircle } from 'lucide-react';

export default function Thread() {
    const { communityId, threadId } = useParams();
    const [thread, setThread] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newReply, setNewReply] = useState('');
    const [replying, setReplying] = useState(false);
    const [generating, setGenerating] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (threadId) {
            fetchData();
        }
    }, [threadId]);

    async function fetchData() {
        try {
            const threadRef = doc(db, "communities", communityId, "threads", threadId);
            const threadSnap = await getDoc(threadRef);
            if (threadSnap.exists()) {
                setThread(threadSnap.data());

                // Fetch replies
                const repliesRef = collection(db, "communities", communityId, "threads", threadId, "replies");
                const q = query(repliesRef, orderBy("createdAt", "asc"));
                const repliesSnap = await getDocs(q);
                setReplies(repliesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleReply(e) {
        e.preventDefault();
        if (!currentUser || !newReply.trim()) return;
        setReplying(true);
        try {
            await addDoc(collection(db, "communities", communityId, "threads", threadId, "replies"), {
                content: newReply,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email,
                createdAt: serverTimestamp(),
                isAI: false
            });

            // Update reply count
            const threadRef = doc(db, "communities", communityId, "threads", threadId);
            await updateDoc(threadRef, {
                repliesCount: increment(1)
            });

            setNewReply('');
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setReplying(false);
        }
    }

    async function handleAIGenerate() {
        setGenerating(true);
        try {
            const suggestion = await generateReply(thread.title, thread.content);
            setNewReply(suggestion);
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;
    if (!thread) return <div className="p-8 text-center">Discussion not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            <Link to={`/communities/${communityId}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Discussions
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{thread.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                        {thread.authorName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <span className="font-medium text-gray-900 dark:text-white">{thread.authorName}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(thread.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {thread.content}
                </div>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent dark:before:via-gray-700">
                <div className="relative">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pl-12 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {replies.length} Replies
                    </h3>
                </div>

                {replies.map(reply => (
                    <div key={reply.id} className="relative pl-12">
                        <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white ring-8 ring-white dark:border-gray-700 dark:bg-gray-800 dark:ring-gray-900">
                            <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">{reply.authorName}</span>
                                <span className="text-xs text-gray-500">{new Date(reply.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg sticky bottom-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add a reply</h3>
                <form onSubmit={handleReply}>
                    <div className="relative">
                        <textarea
                            rows={4}
                            value={newReply}
                            onChange={e => setNewReply(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-3 border pr-32"
                            placeholder="Type your reply here..."
                        />
                        <button
                            type="button"
                            onClick={handleAIGenerate}
                            disabled={generating}
                            className="absolute top-2 right-2 flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors disabled:opacity-50"
                            title="Generate reply with AI"
                        >
                            {generating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            AI Suggestion
                        </button>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={replying || !newReply.trim()}
                            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                        >
                            {replying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Post Reply
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
