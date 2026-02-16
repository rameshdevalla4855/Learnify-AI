import { useState, lazy, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/AppThemeContext';
import {
    Home, BookOpen, Users, User, LogOut, Menu, X, Map,
    Globe, Terminal, Zap, Sparkles, ChevronRight, Bell, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Courses', href: '/my-courses', icon: BookOpen },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Roadmap', href: '/roadmap', icon: Map },
    { name: 'Playground', href: '/playground', icon: Terminal },
    { name: 'Profile', href: '/profile', icon: User },
];

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hoveredNav, setHoveredNav] = useState(null);
    const { currentUser, logout } = useAuth();
    const { navbarAlign } = useAppTheme();
    const location = useLocation();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f1a]">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                        Learnify
                    </span>
                </Link>
                <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {isSidebarOpen ? <X className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
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
                    fixed inset-y-0 z-50 w-72 transform transition-transform duration-300 ease-out lg:static lg:translate-x-0
                    ${navbarAlign === 'right' ? 'right-0' : 'left-0'}
                    ${isSidebarOpen ? 'translate-x-0' : navbarAlign === 'right' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className={`h-full bg-white dark:bg-gray-900/95 border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col ${navbarAlign === 'right' ? 'lg:border-l lg:border-r-0' : ''}`}>
                        {/* Logo */}
                        <div className="p-6">
                            <Link to="/" className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                                        Learnify
                                    </span>
                                    <span className="block text-[10px] text-gray-400 font-medium">AI Learning Platform</span>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                            <div className="mb-4">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3">Main Menu</span>
                            </div>
                            
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.href || 
                                    (item.href !== '/' && location.pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        onMouseEnter={() => setHoveredNav(item.name)}
                                        onMouseLeave={() => setHoveredNav(null)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group
                                            ${isActive
                                                ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 dark:text-orange-400'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                            }
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                            isActive 
                                                ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20' 
                                                : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/10 text-gray-500 dark:text-gray-400 group-hover:text-orange-500'
                                        }`}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="flex-1">{item.name}</span>
                                        {isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        )}
                                        {hoveredNav === item.name && !isActive && (
                                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Social Portal Entry */}
                            <div className="pt-6 mt-6 border-t border-gray-200/50 dark:border-gray-800/50">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3 block">Social</span>
                                <Link
                                    to="/connect"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1">Learnify Social</span>
                                    <span className="text-[10px] bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 px-2 py-0.5 rounded-full font-semibold">
                                        NEW
                                    </span>
                                </Link>
                            </div>
                        </nav>

                        {/* User Section */}
                        <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50">
                            {currentUser ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white dark:ring-gray-900 overflow-hidden">
                                        {currentUser.photoURL ? (
                                            <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            currentUser.email?.[0]?.toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {currentUser.displayName || currentUser.email?.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-gray-500">Student</p>
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
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition-all"
                                >
                                    <Zap className="w-4 h-4" />
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto lg:p-6 relative w-full bg-gray-50 dark:bg-[#0f0f1a]">
                    <div className="max-w-6xl mx-auto">
                        <Suspense fallback={
                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>
                            <Outlet />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
}
