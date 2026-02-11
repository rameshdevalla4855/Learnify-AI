import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Send, Loader2, MessageSquare } from 'lucide-react';

export default function Chat({ initialTarget: propInitialTarget }) {
    const { currentUser } = useAuth();
    const location = useLocation();

    // Use prop if available (legacy/embedded), otherwise check navigation state
    const initialTarget = propInitialTarget || location.state?.initialTarget;

    if (!currentUser) {
        return null; // Handled by wrapper
    }

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle initial target (start chat with specific user)
    useEffect(() => {
        const initChat = async () => {
            if (initialTarget && currentUser) {
                const participants = [currentUser.uid, initialTarget.id].sort();
                const chatId = `${participants[0]}_${participants[1]}`;
                const chatRef = doc(db, 'chats', chatId);
                const chatDoc = await getDoc(chatRef);

                if (chatDoc.exists()) {
                    const data = chatDoc.data();
                    // Helper to get the "other" participant ID (could be improved)
                    const otherUid = data.participants.find(uid => uid !== currentUser.uid);
                    const otherDetails = data.participantDetails?.[otherUid] || {};

                    setActiveChat({
                        id: chatDoc.id,
                        ...data,
                        otherUserId: otherDetails.displayName || initialTarget.displayName || initialTarget.email,
                        otherUserAvatar: otherDetails.photoURL || initialTarget.photoURL
                    });
                } else {
                    // Create new chat
                    const newChatData = {
                        participants: participants,
                        participantDetails: {
                            [currentUser.uid]: { displayName: currentUser.displayName, photoURL: currentUser.photoURL },
                            [initialTarget.id]: { displayName: initialTarget.displayName, photoURL: initialTarget.photoURL }
                        },
                        lastMessage: '',
                        lastMessageTimestamp: serverTimestamp()
                    };
                    await setDoc(chatRef, newChatData);
                    setActiveChat({
                        id: chatId,
                        ...newChatData,
                        otherUserId: initialTarget.displayName || initialTarget.email,
                        otherUserAvatar: initialTarget.photoURL
                    });
                }
            }
        };

        initChat();
    }, [initialTarget, currentUser]);

    // Fetch active chats
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => {
                const data = doc.data();
                // Find other participant ID
                const otherUid = data.participants.find(uid => uid !== currentUser.uid);
                // Try to get details from participantDetails map if available, else fallback
                const otherDetails = data.participantDetails?.[otherUid] || {};

                return {
                    id: doc.id,
                    ...data,
                    otherUserId: otherDetails.displayName || otherUid || "User",
                    otherUserAvatar: otherDetails.photoURL
                };
            });
            setChats(chatList);
            setLoadingChats(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Fetch messages for active chat
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
                senderId: currentUser.uid,
                text: newMessage,
                timestamp: serverTimestamp()
            });

            // Update last message in chat doc
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

    return (
        <div className="flex h-[600px] glass-card rounded-xl overflow-hidden">
            {/* Chat List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold text-lg">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingChats ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : chats.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No conversations yet.</div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-800 ${activeChat?.id === chat.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={chat.otherUserAvatar || `https://ui-avatars.com/api/?name=${chat.otherUserId}`}
                                        className="w-10 h-10 rounded-full object-cover"
                                        alt=""
                                    />
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium truncate text-gray-900 dark:text-white">{chat.otherUserId}</div>
                                        <div className="text-sm text-gray-500 truncate">{chat.lastMessage || "Start chatting..."}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                            <img
                                src={activeChat.otherUserAvatar || `https://ui-avatars.com/api/?name=${activeChat.otherUserId}`}
                                className="w-8 h-8 rounded-full object-cover"
                                alt=""
                            />
                            <h3 className="font-bold text-gray-900 dark:text-white">{activeChat.otherUserId}</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                            ? 'bg-primary-600 text-white rounded-tr-sm'
                                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm shadow-sm'
                                            }`}>
                                            <p>{msg.text}</p>
                                            <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                                                {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="btn-primary p-2 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium">Your Messages</p>
                        <p className="text-sm">Select a conversation or connect with learners to chat.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
