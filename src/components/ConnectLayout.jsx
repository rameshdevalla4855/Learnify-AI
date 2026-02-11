import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Home,
    Search,
    MessageSquare,
    LogOut,
    Menu,
    X,
    ArrowLeft,
    Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { currentUser, logout } = useAuth();
    const { socialTheme, setSocialTheme } = useTheme();
    const location = useLocation();

    const navigation = [
        { name: 'Home', href: '/connect', icon: Home },
        { name: 'Search', href: '/connect/network', icon: Search },
        { name: 'Notifications', href: '/connect/notifications', icon: Heart },
        { name: 'Messages', href: '/connect/chat', icon: MessageSquare },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const suggestUsers = [
        { id: 1, name: "Sarah Chen", role: "Frontend Dev", avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=random" },
        { id: 2, name: "Alex Kumar", role: "AI Researcher", avatar: "https://ui-avatars.com/api/?name=Alex+Kumar&background=random" },
        { id: 3, name: "Jordan Lee", role: "Full Stack", avatar: "https://ui-avatars.com/api/?name=Jordan+Lee&background=random" },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xl font-bold font-instagram">Learnify Social</span>
                <button onClick={toggleSidebar} className="p-2">
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar (Desktop) / Drawer (Mobile) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 md:p-8">
                    <h1 className="text-2xl font-extrabold mb-8 hidden md:block font-instagram">Learnify Social</h1>

                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href || (item.href !== '/connect' && location.pathname.startsWith(item.href) && item.href !== '/connect/notifications');
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-4 px-4 py-3 rounded-lg text-md font-medium transition-all group
                                        ${isActive ? 'font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}
                                    `}
                                >
                                    <item.icon className={`w-6 h-6 ${isActive ? 'fill-current scale-110' : 'group-hover:scale-110'} transition-transform`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
                    {/* Theme Switcher */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Theme</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setSocialTheme('light')}
                                className={`h-8 rounded-lg border flex items-center justify-center transition-all ${socialTheme === 'light' ? 'bg-white border-primary-500 shadow-sm' : 'bg-white border-gray-200 opacity-50 hover:opacity-100'}`}
                                title="Modern Light"
                            >
                                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-gray-100 to-white border border-gray-200"></div>
                            </button>
                            <button
                                onClick={() => setSocialTheme('midnight')}
                                className={`h-8 rounded-lg border flex items-center justify-center transition-all ${socialTheme === 'midnight' ? 'bg-slate-950 border-purple-500 shadow-sm' : 'bg-slate-950 border-slate-800 opacity-50 hover:opacity-100'}`}
                                title="Midnight Premium"
                            >
                                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-slate-900 to-purple-900 border border-slate-700"></div>
                            </button>
                            <button
                                onClick={() => setSocialTheme('gold')}
                                className={`h-8 rounded-lg border flex items-center justify-center transition-all ${socialTheme === 'gold' ? 'bg-neutral-950 border-yellow-500 shadow-sm' : 'bg-neutral-950 border-neutral-800 opacity-50 hover:opacity-100'}`}
                                title="Royal Gold"
                            >
                                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-neutral-900 to-yellow-600 border border-yellow-900"></div>
                            </button>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center gap-4 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg w-full transition-colors group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Learnify</span>
                    </Link>

                    {currentUser && (
                        <div className="flex items-center gap-3 px-4 py-2 mb-2">
                            <img
                                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                                alt="User"
                                className="h-8 w-8 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">
                                    {currentUser.displayName || currentUser.email}
                                </p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full transition-colors"
                    >
                        <LogOut className="w-6 h-6" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto w-full md:max-w-2xl mx-auto py-8 px-4">
                <Outlet />
            </main>

            {/* Right Sidebar (Suggestions) - Desktop Only */}
            <aside className="hidden xl:block w-80 p-8 border-l border-gray-200 dark:border-gray-800">
                <div className="fixed w-80 pr-8">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-bold text-gray-500">Suggested for you</span>
                        <Link to="/connect/network" className="text-xs font-semibold text-primary-600 hover:text-primary-700">See All</Link>
                    </div>

                    <div className="space-y-4">
                        {suggestUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between">
                                <Link to={`/connect/profile/${user.id}`} className="flex items-center gap-3 group">
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{user.role}</p>
                                    </div>
                                </Link>
                                <button className="text-xs font-semibold text-blue-500 hover:text-blue-700">
                                    Follow
                                </button>
                            </div>
                        ))}
                    </div>

                    <footer className="mt-8 text-xs text-gray-400">
                        © 2024 Learnify AI Social
                    </footer>
                </div>
            </aside>
        </div>
    );
}
