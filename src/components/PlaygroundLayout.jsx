import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    List, Trophy, User, LogOut, Menu, X, ArrowLeft, Code, Zap, Bell, Search, MessageSquare, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlaygroundLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    const navigation = [
        { name: 'Problems', href: '/playground/problems', icon: List },
        { name: 'Practice', href: '/playground/practice', icon: Terminal },
        { name: 'Contest', href: '/playground/contest', icon: Trophy },
        { name: 'Discuss', href: '/playground/discuss', icon: MessageSquare },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="h-screen bg-[#1a1a2e] text-white flex flex-col font-sans overflow-hidden">
            {/* Top Navigation Bar */}
            <nav className="h-12 border-b border-white/[0.06] bg-[#1e1e32]/90 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-50">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-6">
                    <Link to="/playground" className="flex items-center gap-2 group">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Code className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold tracking-tight hidden md:block">
                            Learnify<span className="text-orange-400">Code</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-0.5">
                        {navigation.map((item) => {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all relative ${isActive
                                        ? 'text-white bg-white/[0.08]'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    {item.name}
                                    {isActive && (
                                        <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-orange-500 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center bg-white/[0.05] rounded-lg px-2.5 py-1.5 border border-white/[0.06] gap-2">
                        <Search className="w-3.5 h-3.5 text-gray-500" />
                        <input type="text" placeholder="Search problems..." className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs w-32 text-gray-300 placeholder-gray-500" />
                        <kbd className="text-[9px] text-gray-500 bg-white/[0.06] px-1 py-0.5 rounded border border-white/[0.06]">⌘K</kbd>
                    </div>

                    <div className="flex items-center gap-1 bg-white/[0.05] px-2 py-1 rounded-lg border border-white/[0.06]">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-gray-300">0</span>
                    </div>

                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors relative hidden md:flex">
                        <Bell className="w-4 h-4" />
                    </button>

                    {currentUser && (
                        <div className="hidden md:flex items-center gap-2 ml-1">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-[11px] font-bold ring-2 ring-white/[0.06] overflow-hidden">
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    currentUser.email?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                        </div>
                    )}

                    <button onClick={toggleMobileMenu} className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg">
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-x-0 top-12 bg-[#1e1e32] border-b border-white/[0.06] z-40 md:hidden"
                    >
                        <div className="p-3 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.06] text-gray-300 text-sm"
                                >
                                    <item.icon className="w-4 h-4 text-gray-500" />
                                    {item.name}
                                </Link>
                            ))}
                            <div className="pt-2 mt-2 border-t border-white/[0.06]">
                                <Link to="/" className="flex items-center gap-3 p-2.5 text-gray-400 hover:text-white text-sm">
                                    <ArrowLeft className="w-4 h-4" /> Dashboard
                                </Link>
                                <button onClick={logout} className="flex items-center gap-3 p-2.5 text-red-400 hover:text-red-300 w-full text-left text-sm">
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative w-full flex flex-col">
                <Outlet />
            </main>
        </div>
    );
}
