import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Send, Loader2, MessageSquare, Search, Plus, ArrowLeft, MoreVertical, Phone, Video, Image, Smile, Users, Clock, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat({ initialTarget: propInitialTarget }) {
    const { currentUser, userProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const initialTarget = propInitialTarget || location.state?.initialTarget;

    const [chats, setChats] = useState([]);
    const [connections, setConnections] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingConnections, setLoadingConnections] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('recent');
    const [editingMessage, setEditingMessage] = useState(null);
    const [editMessageText, setEditMessageText] = useState('');
    const [showDeleteMessage, setShowDeleteMessage] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (initialTarget && currentUser) {
            initChatWithTarget(initialTarget);
        }
    }, [initialTarget, currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => {
                const data = doc.data();
                const otherUid = data.participants.find(uid => uid !== currentUser.uid);
                const otherDetails = data.participantDetails?.[otherUid] || {};

                return {
                    id: doc.id,
                    ...data,
                    otherUserId: otherDetails.displayName || otherUid || "User",
                    otherUserAvatar: otherDetails.photoURL
                };
            }).sort((a, b) => {
                const aTime = a.lastMessageTimestamp?.seconds || 0;
                const bTime = b.lastMessageTimestamp?.seconds || 0;
                return bTime - aTime;
            });
            setChats(chatList);
            setLoadingChats(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !userProfile?.connections) return;

        const fetchConnections = async () => {
            setLoadingConnections(true);
            try {
                const connectionUsers = [];
                for (const connId of userProfile.connections) {
                    const userDoc = await getDoc(doc(db, 'users', connId));
                    if (userDoc.exists()) {
                        connectionUsers.push({
                            id: userDoc.id,
                            ...userDoc.data()
                        });
                    }
                }
                setConnections(connectionUsers);
            } catch (error) {
                console.error('Error fetching connections:', error);
            } finally {
                setLoadingConnections(false);
            }
        };

        fetchConnections();
    }, [currentUser, userProfile?.connections]);

    useEffect(() => {
        if (!activeChat) return;

        const q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, [activeChat]);

    const initChatWithTarget = async (target) => {
        const participants = [currentUser.uid, target.id].sort();
        const chatId = `${participants[0]}_${participants[1]}`;
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
            const data = chatDoc.data();
            const otherUid = data.participants.find(uid => uid !== currentUser.uid);
            const otherDetails = data.participantDetails?.[otherUid] || {};

            setActiveChat({
                id: chatDoc.id,
                ...data,
                otherUserId: otherDetails.displayName || target.displayName || target.email,
                otherUserAvatar: otherDetails.photoURL || target.photoURL
            });
            setIsMobileChatOpen(true);
        } else {
            const newChatData = {
                participants: participants,
                participantDetails: {
                    [currentUser.uid]: { displayName: currentUser.displayName, photoURL: currentUser.photoURL },
                    [target.id]: { displayName: target.displayName, photoURL: target.photoURL }
                },
                lastMessage: '',
                lastMessageTimestamp: serverTimestamp()
            };
            await setDoc(chatRef, newChatData);
            setActiveChat({
                id: chatId,
                ...newChatData,
                otherUserId: target.displayName || target.email,
                otherUserAvatar: target.photoURL
            });
            setIsMobileChatOpen(true);
        }
    };

    const handleStartChat = (user) => {
        initChatWithTarget(user);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
                senderId: currentUser.uid,
                text: newMessage,
                timestamp: serverTimestamp()
            });

            const chatRef = doc(db, 'chats', activeChat.id);
            await updateDoc(chatRef, {
                lastMessage: newMessage,
                lastMessageTimestamp: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleEditMessage = async (messageId) => {
        if (!editMessageText.trim()) return;
        try {
            const messageRef = doc(db, 'chats', activeChat.id, 'messages', messageId);
            await updateDoc(messageRef, { 
                text: editMessageText,
                edited: true,
                editedAt: serverTimestamp()
            });
            setEditingMessage(null);
            setEditMessageText('');
        } catch (error) {
            console.error('Error editing message:', error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteDoc(doc(db, 'chats', activeChat.id, 'messages', messageId));
            setShowDeleteMessage(null);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const startEditingMessage = (msg) => {
        setEditingMessage(msg.id);
        setEditMessageText(msg.text);
    };

    const filteredChats = chats.filter(chat =>
        chat.otherUserId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredConnections = connections.filter(conn =>
        (conn.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (conn.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getChatForConnection = (connId) => {
        return chats.find(chat => {
            const otherUid = chat.participants?.find(uid => uid !== currentUser.uid);
            return otherUid === connId;
        });
    };

    if (!currentUser) return null;

    return (
        <div className="flex h-[calc(100vh-140px)] lg:h-[600px] bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
            {/* Sidebar */}
            <div className={`${isMobileChatOpen ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-white/5`}>
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Messages</h2>
                        <button 
                            onClick={() => navigate('/connect/network')}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-1 p-2 border-b border-white/5">
                    <button
                        onClick={() => setActiveSection('recent')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeSection === 'recent'
                                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Clock className="w-4 h-4" /> Recent
                    </button>
                    <button
                        onClick={() => setActiveSection('connections')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeSection === 'connections'
                                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Users className="w-4 h-4" /> Connections
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {activeSection === 'recent' ? (
                        loadingChats ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageSquare className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-white font-medium mb-1">No messages yet</p>
                                <p className="text-sm text-gray-500">Start a conversation</p>
                            </div>
                        ) : (
                            filteredChats.map(chat => (
                                <motion.button
                                    key={chat.id}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                    onClick={() => {
                                        setActiveChat(chat);
                                        setIsMobileChatOpen(true);
                                    }}
                                    className={`w-full p-4 flex items-center gap-3 border-b border-white/5 transition-colors ${
                                        activeChat?.id === chat.id ? 'bg-pink-500/10' : ''
                                    }`}
                                >
                                    <div className="relative">
                                        <img
                                            src={chat.otherUserAvatar || `https://ui-avatars.com/api/?name=${chat.otherUserId}`}
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                                            alt=""
                                        />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-white truncate">{chat.otherUserId}</span>
                                            <span className="text-xs text-gray-500">
                                                {chat.lastMessageTimestamp?.seconds 
                                                    ? new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 truncate">{chat.lastMessage || "Start chatting..."}</p>
                                    </div>
                                </motion.button>
                            ))
                        )
                    ) : (
                        loadingConnections ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                            </div>
                        ) : filteredConnections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-white font-medium mb-1">No connections yet</p>
                                <p className="text-sm text-gray-500">Connect with learners to chat</p>
                            </div>
                        ) : (
                            filteredConnections.map(conn => {
                                const existingChat = getChatForConnection(conn.id);
                                return (
                                    <motion.button
                                        key={conn.id}
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                        onClick={() => handleStartChat(conn)}
                                        className="w-full p-4 flex items-center gap-3 border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                                    >
                                        <div className="relative">
                                            <img
                                                src={conn.photoURL || `https://ui-avatars.com/api/?name=${conn.displayName}`}
                                                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                                                alt=""
                                            />
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <span className="font-medium text-white truncate">{conn.displayName}</span>
                                            <p className="text-sm text-gray-500 truncate">@{conn.username || 'learner'}</p>
                                        </div>
                                        {existingChat && (
                                            <div className="w-2 h-2 bg-pink-500 rounded-full" />
                                        )}
                                    </motion.button>
                                );
                            })
                        )
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`${isMobileChatOpen ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#0c0c12]`}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0f]">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setIsMobileChatOpen(false)}
                                    className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                                </button>
                                <div className="relative">
                                    <img
                                        src={activeChat.otherUserAvatar || `https://ui-avatars.com/api/?name=${activeChat.otherUserId}`}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/30"
                                        alt=""
                                    />
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{activeChat.otherUserId}</h3>
                                    <p className="text-xs text-green-400">Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                                    <Video className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map(msg => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                                    >
                                        {editingMessage === msg.id ? (
                                            <div className="max-w-[70%] bg-white/5 rounded-2xl px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={editMessageText}
                                                    onChange={(e) => setEditMessageText(e.target.value)}
                                                    className="w-full bg-transparent text-white text-sm outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleEditMessage(msg.id)}
                                                        className="p-1.5 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingMessage(null); setEditMessageText(''); }}
                                                        className="p-1.5 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className={`max-w-[70%] ${
                                                    isMe
                                                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl rounded-br-md'
                                                        : 'bg-white/10 text-white rounded-2xl rounded-bl-md'
                                                } px-4 py-2.5`}>
                                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                                        <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
                                                            {msg.timestamp?.seconds 
                                                                ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : '...'}
                                                        </span>
                                                        {msg.edited && (
                                                            <span className={`text-[9px] ${isMe ? 'text-white/40' : 'text-gray-600'}`}>(edited)</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isMe && (
                                                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                        <button
                                                            onClick={() => startEditingMessage(msg)}
                                                            className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setShowDeleteMessage(msg.id)}
                                                            className="p-1 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#0a0a0f]">
                            <div className="flex items-center gap-2">
                                <button type="button" className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-pink-400">
                                    <Image className="w-5 h-5" />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                                    />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <MessageSquare className="w-10 h-10 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
                        <p className="text-gray-400 mb-6 max-w-xs">Send private messages to fellow learners and collaborate on your learning journey.</p>
                        <button
                            onClick={() => navigate('/connect/network')}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all"
                        >
                            Find Learners
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Message Confirmation */}
            <AnimatePresence>
                {showDeleteMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowDeleteMessage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#12121a] w-full max-w-sm rounded-2xl border border-white/10 p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-7 h-7 text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Delete Message?</h3>
                                <p className="text-gray-400 text-sm mb-6">This message will be permanently deleted.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteMessage(null)}
                                        className="flex-1 py-2.5 bg-white/5 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMessage(showDeleteMessage)}
                                        className="flex-1 py-2.5 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}