import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import { X, Image, Code, Video, XCircle, Loader2, Hash, Sparkles, Globe, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePostModal({ onClose }) {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('media');
    const [caption, setCaption] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [codeSnippet, setCodeSnippet] = useState('');
    const [codeLanguage, setCodeLanguage] = useState('javascript');
    const [tags, setTags] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [visibility, setVisibility] = useState('public');

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
                visibility,
            };

            if (mediaUrl) {
                postData.imageUrl = mediaUrl;
                postData.mediaUrl = mediaUrl;
                postData.mediaType = mediaType;
            }

            if (activeTab === 'code' && codeSnippet) {
                postData.codeSnippet = codeSnippet;
                postData.codeLanguage = codeLanguage;
            }

            await addDoc(collection(db, 'posts'), postData);
            onClose();
        } catch (error) {
            console.error("Error creating post:", error);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#12121a] w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Create Post</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* User Info & Visibility */}
                    <div className="p-5 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email}`}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/30"
                                    alt=""
                                />
                                <div>
                                    <p className="font-semibold text-white text-sm">
                                        {currentUser?.displayName || currentUser?.email.split('@')[0]}
                                    </p>
                                    <select
                                        value={visibility}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="text-xs text-gray-400 bg-transparent border-none outline-none cursor-pointer hover:text-white transition-colors"
                                    >
                                        <option value="public" className="bg-gray-900">🌍 Public</option>
                                        <option value="followers" className="bg-gray-900">👥 Followers</option>
                                        <option value="private" className="bg-gray-900">🔒 Only me</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Type Tabs */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('media')}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    activeTab === 'media' 
                                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Image className="w-4 h-4" /> Media
                            </button>
                            <button
                                onClick={() => setActiveTab('code')}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    activeTab === 'code' 
                                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Code className="w-4 h-4" /> Code
                            </button>
                        </div>
                    </div>

                    {/* Main Input Area */}
                    <div className="p-5 space-y-4">
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Share your learning journey..."
                            className="w-full text-base bg-transparent border-none focus:ring-0 placeholder-gray-500 text-white resize-none min-h-[100px] outline-none"
                            autoFocus
                        />

                        {activeTab === 'media' && (
                            <div className="space-y-4">
                                {!previewUrl ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/30 hover:bg-white/[0.02] transition-all group"
                                    >
                                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Image className="w-7 h-7 text-pink-400" />
                                        </div>
                                        <p className="text-sm font-medium text-white mb-1">Add photos or videos</p>
                                        <p className="text-xs text-gray-500">or drag and drop</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden bg-black">
                                        {selectedFile?.type.startsWith('image') ? (
                                            <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-contain" />
                                        ) : (
                                            <video src={previewUrl} controls className="w-full max-h-[300px]" />
                                        )}
                                        <button
                                            onClick={clearFile}
                                            className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors"
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
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Language</label>
                                    <select
                                        value={codeLanguage}
                                        onChange={(e) => setCodeLanguage(e.target.value)}
                                        className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:border-pink-500/50 text-white"
                                    >
                                        {languages.map(lang => (
                                            <option key={lang.id} value={lang.id} className="bg-gray-900">{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea
                                    value={codeSnippet}
                                    onChange={(e) => setCodeSnippet(e.target.value)}
                                    placeholder="// Paste your code here..."
                                    className="w-full h-48 font-mono text-sm bg-black/50 text-emerald-400 p-4 rounded-xl border border-white/5 focus:border-pink-500/30 focus:outline-none resize-none"
                                    spellCheck={false}
                                />
                            </div>
                        )}

                        {/* Tags Input */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-xl hover:border-pink-500/30 transition-colors">
                            <Hash className="w-4 h-4 text-pink-400" />
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Add tags separated by commas..."
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-pink-400">
                            <Image className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-purple-400">
                            <Video className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isPosting || (!caption.trim() && !selectedFile && !codeSnippet.trim())}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-pink-500/20"
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
