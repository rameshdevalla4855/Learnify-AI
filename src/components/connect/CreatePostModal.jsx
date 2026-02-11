import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import { X, Image, Code, Video, XCircle, Loader2, Tag, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePostModal({ onClose }) {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('media'); // 'media' or 'code'
    const [caption, setCaption] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [codeSnippet, setCodeSnippet] = useState('');
    const [codeLanguage, setCodeLanguage] = useState('javascript');
    const [tags, setTags] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const fileInputRef = useRef(null);

    const languages = [
        { id: 'javascript', name: 'JavaScript' },
        { id: 'python', name: 'Python' },
        { id: 'html', name: 'HTML' },
        { id: 'css', name: 'CSS' },
        { id: 'java', name: 'Java' },
        { id: 'cpp', name: 'C++' },
        { id: 'csharp', name: 'C#' },
        { id: 'typescript', name: 'TypeScript' },
        { id: 'sql', name: 'SQL' },
        { id: 'react', name: 'React (JSX)' },
    ];

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!caption.trim() && !selectedFile && !codeSnippet.trim()) return;

        setIsPosting(true);
        try {
            let mediaUrl = null;
            let mediaType = null;

            if (activeTab === 'media' && selectedFile) {
                mediaUrl = await uploadToCloudinary(selectedFile);
                mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
            }

            const postData = {
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email.split('@')[0],
                authorAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`,
                content: caption,
                timestamp: serverTimestamp(),
                likes: [],
                commentsCount: 0,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                type: activeTab === 'code' ? 'code' : (mediaType || 'text'),
            };

            if (mediaUrl) {
                postData.imageUrl = mediaUrl; // Keeping legacy field for backward compat, or use mediaUrl
                postData.mediaUrl = mediaUrl;
                postData.mediaType = mediaType;
            }

            if (activeTab === 'code' && codeSnippet) {
                postData.codeSnippet = codeSnippet;
                postData.codeLanguage = codeLanguage;
            }

            await addDoc(collection(db, 'posts'), postData);

            // Optional: Update user stats (posts count)
            // await updateDoc(doc(db, 'users', currentUser.uid), { postsCount: increment(1) });

            onClose();
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Post</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-6">
                        <img
                            src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email}`}
                            className="w-10 h-10 rounded-full object-cover"
                            alt=""
                        />
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {currentUser?.displayName || currentUser?.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500">Posting to Public Feed</p>
                        </div>
                    </div>

                    {/* Content Type Tabs */}
                    <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'media' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Image className="w-4 h-4" /> Media
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'code' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Code className="w-4 h-4" /> Code Snippet
                        </button>
                    </div>

                    {/* Main Input Area */}
                    <div className="space-y-4">
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="What do you want to share today?"
                            className="w-full text-base bg-transparent border-none focus:ring-0 placeholder-gray-400 text-gray-900 dark:text-white resize-none min-h-[80px]"
                        />

                        {activeTab === 'media' && (
                            <div className="space-y-4">
                                {!previewUrl ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-3">
                                            <Image className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Add Photos or Video</p>
                                        <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        {selectedFile?.type.startsWith('image') ? (
                                            <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-cover" />
                                        ) : (
                                            <video src={previewUrl} controls className="w-full max-h-[300px]" />
                                        )}
                                        <button
                                            onClick={clearFile}
                                            className="absolute top-2 right-2 text-white/80 hover:text-white bg-black/50 rounded-full p-1"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        )}

                        {activeTab === 'code' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Language</label>
                                    <select
                                        value={codeLanguage}
                                        onChange={(e) => setCodeLanguage(e.target.value)}
                                        className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:border-primary-500 text-gray-900 dark:text-white"
                                    >
                                        {languages.map(lang => (
                                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea
                                    value={codeSnippet}
                                    onChange={(e) => setCodeSnippet(e.target.value)}
                                    placeholder="// Paste your code here..."
                                    className="w-full h-48 font-mono text-sm bg-gray-800 text-green-400 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    spellCheck={false}
                                />
                            </div>
                        )}

                        {/* Tags Input */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Add tags (separated by comma)..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isPosting || (!caption && !selectedFile && !codeSnippet)}
                        className="btn-primary rounded-lg px-6 py-2.5 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isPosting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Posting...
                            </>
                        ) : (
                            'Post'
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
