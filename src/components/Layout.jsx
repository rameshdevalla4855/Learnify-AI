import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home,
    BookOpen,
    Users,
    User,
    LogOut,
    Menu,
    X,
    Map,
    Globe,
    Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    const navigation = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'My Courses', href: '/my-courses', icon: BookOpen },
        { name: 'Communities', href: '/communities', icon: Users },
        { name: 'Roadmap', href: '/roadmap', icon: Map },
        { name: 'Playground', href: '/playground', icon: Terminal },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xl font-bold text-primary-600">Learnify AI</span>
                <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </div>

            <div className="flex h-screen overflow-hidden">
                {/* Mobile Sidebar Backdrop */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <aside className={`
          glass-panel border-r-0 fixed inset-y-4 left-4 z-50 w-64 rounded-2xl transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:h-[calc(100vh-2rem)] lg:my-4 lg:ml-4 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}
        `}>
                    <div className="flex h-full flex-col justify-between overflow-y-auto custom-scrollbar">
                        <div className="px-4 py-6">
                            <div className="flex items-center justify-between mb-8 lg:mb-8">
                                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 px-2">
                                    Learnify AI
                                </span>
                                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-md">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <nav className="space-y-2">
                                {navigation.map((item) => {
                                    const isActive = location.pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${isActive
                                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 translate-x-1'
                                                    : 'text-gray-600 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-gray-700/50 hover:translate-x-1'}
                      `}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    );
                                })}

                                {/* Social Portal Entry */}
                                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700/50">
                                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        Social
                                    </h3>
                                    <Link
                                        to="/connect"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 hover:translate-x-1 group"
                                    >
                                        <Globe className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                        <span className="flex-1">Learnify Social</span>
                                        <span className="text-[10px] bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-800">
                                            NEW
                                        </span>
                                    </Link>
                                </div>
                            </nav>
                        </div>

                        <div className="p-4 mt-auto">
                            {currentUser ? (
                                <div className="glass-card flex items-center gap-3 px-3 py-3 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50">
                                    <img
                                        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                                        alt="User"
                                        className="h-9 w-9 rounded-full ring-2 ring-white dark:ring-gray-700"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {currentUser.displayName || currentUser.email}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">Student</p>
                                    </div>
                                    <button
                                        onClick={() => logout()}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="btn-primary flex w-full justify-center rounded-xl px-4 py-3 text-sm font-bold shadow-lg"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-3 lg:p-8 relative w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
