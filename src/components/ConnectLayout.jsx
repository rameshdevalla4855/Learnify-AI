import { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/AppThemeContext';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

const CreatePostModal = lazy(() => import('./connect/CreatePostModal'));
import {
    Home,
    Bell,
    MessageSquare,
    LogOut,
    Menu,
    X,
    ArrowLeft,
    Sparkles,
    Compass,
    User,
    Plus,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const { currentUser, logout, userProfile } = useAuth();
    const { theme, setTheme } = useAppTheme();
    const location = useLocation();

    useEffect(() => {
        if (!currentUser) return;

        const pendingCount = userProfile?.pendingConnections?.length || 0;

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNotificationCount(snapshot.size + pendingCount);
        });

        return () => unsubscribe();
    }, [currentUser, userProfile]);

    const navigation = [
        { name: 'Home', href: '/connect', icon: Home },
        { name: 'Explore', href: '/connect/explore', icon: Compass },
        { name: 'Network', href: '/connect/network', icon: Search },
        { name: 'Notifications', href: '/connect/notifications', icon: Bell, badge: notificationCount },
        { name: 'Messages', href: '/connect/chat', icon: MessageSquare },
        { name: 'Profile', href: '/connect/profile', icon: User },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const isActive = (href) => {
        if (href === '/connect') return location.pathname === '/connect';
        return location.pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-4 h-16">
                    <Link to="/connect" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            Social
                        </span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link to="/connect/notifications" className="p-2 relative">
                            <Bell className="w-5 h-5 text-gray-400" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </Link>
                        <button onClick={toggleSidebar} className="p-2">
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-out
                lg:translate-x-0 lg:static
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Logo */}
                    <Link to="/connect" className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                Learnify Social
                            </span>
                            <span className="block text-[10px] text-gray-500 font-medium">Connect & Learn</span>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${isActive(item.href)
                                    ? 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive(item.href)
                                    ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20'
                                    : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                                    }`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="flex-1">{item.name}</span>
                                {item.badge && (
                                    <span className="w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Create Post Button */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full mt-6 flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Post
                    </button>
                </div>

                {/* Bottom Section */}
                <div className="p-4 border-t border-white/5 space-y-4">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl">
                        <span className="text-sm text-gray-400">Dark Mode</span>
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-10 h-6 bg-white/10 rounded-full relative transition-colors"
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${theme === 'dark' ? 'translate-x-5 bg-pink-500' : 'translate-x-1 bg-gray-400'
                                }`} />
                        </button>
                    </div>

                    {/* Back to Learnify */}
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Learnify</span>
                    </Link>

                    {/* User Profile */}
                    {currentUser && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                            <img
                                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                                alt="User"
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/30"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-500">@{userProfile?.username || 'learner'}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto w-full lg:max-w-2xl mx-auto pt-20 lg:pt-8 px-4 pb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <Outlet />
            </main>



            {/* Create Post Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <Suspense fallback={null}>
                        <CreatePostModal onClose={() => setIsCreateModalOpen(false)} />
                    </Suspense>
                )}
            </AnimatePresence>
        </div>
    );
}
