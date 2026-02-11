import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { generateSummary } from '../services/gemini';
import { Loader2, Save, FileText, Sparkles, PenTool } from 'lucide-react';

export default function Notes({ videoId, videoTitle, videoDescription }) {
    const [noteContent, setNoteContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const { currentUser } = useAuth();
    const noteId = `${currentUser?.uid}_${videoId}`;

    useEffect(() => {
        async function loadNotes() {
            if (!currentUser || !videoId) return;
            try {
                const docRef = doc(db, "notes", noteId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setNoteContent(docSnap.data().content);
                }
            } catch (err) {
                console.error("Error loading notes:", err);
            }
        }
        loadNotes();
    }, [videoId, currentUser]);

    async function handleGenerateSummary() {
        setLoading(true);
        setMessage('');
        try {
            const summary = await generateSummary(`Video: ${videoTitle}\nDescription: ${videoDescription}`);
            setNoteContent(prev => prev + (prev ? '\n\n' : '') + `### AI Summary\n${summary}`);
        } catch (err) {
            console.error(err);
            setMessage('Failed to generate summary.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!currentUser) return;
        setSaving(true);
        setMessage('');
        try {
            await setDoc(doc(db, "notes", noteId), {
                userId: currentUser.uid,
                videoId: videoId,
                videoTitle: videoTitle,
                content: noteContent,
                updatedAt: new Date().toISOString()
            });
            setMessage('Notes saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to save notes.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto min-h-[600px] h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-primary-600" />
                    My Notes
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={loading}
                        className="flex items-center px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate AI Summary
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Notes
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Start typing your notes here..."
                    className="w-full h-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                />
                {message && (
                    <div className="absolute bottom-4 right-4 bg-gray-900 text-white px-3 py-1 rounded text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}
