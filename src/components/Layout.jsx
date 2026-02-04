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
    Map
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
                {/* Sidebar */}
                <aside className={`
          glass-panel border-r-0 fixed inset-y-4 left-4 z-50 w-64 rounded-2xl transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0 lg:h-[calc(100vh-2rem)] lg:my-4 lg:ml-4
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
                    <div className="flex h-full flex-col justify-between">
                        <div className="px-4 py-6">
                            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 px-2 hidden lg:block mb-8">
                                Learnify AI
                            </span>

                            <nav className="space-y-2">
                                {navigation.map((item) => {
                                    const isActive = location.pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
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
                                    className="btn-primary flex w-full justify-center rounded-xl px-4 py-3 text-sm font-bold shadow-lg"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
