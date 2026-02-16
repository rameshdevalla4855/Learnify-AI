import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/AppThemeContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
    User, BookOpen, Award, BarChart2, Edit2, Save, Settings,
    Moon, Sun, Monitor, Palette, Layout, Bell, Shield, LogOut,
    ChevronRight, Check, Zap, Trophy, Target, Flame, Calendar,
    Github, Twitter, Linkedin, Globe, PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const THEMES = [
    { id: 'system', name: 'System', icon: Monitor },
    { id: 'light', name: 'Light', icon: Sun },
    { id: 'dark', name: 'Dark', icon: Moon },
];

const NAVBAR_ALIGNMENTS = [
    { id: 'left', name: 'Left' },
    { id: 'center', name: 'Center' },
];

const ACCENT_COLORS = [
    { id: 'orange', name: 'Orange', color: '#f97316' },
    { id: 'blue', name: 'Blue', color: '#3b82f6' },
    { id: 'purple', name: 'Purple', color: '#8b5cf6' },
    { id: 'green', name: 'Green', color: '#22c55e' },
    { id: 'pink', name: 'Pink', color: '#ec4899' },
];

export default function Profile() {
    const { currentUser, logout, userProfile } = useAuth();
    const { theme: appTheme, setTheme: setAppTheme, accentColor: appAccentColor, setAccentColor: setAppAccentColor, navbarAlign: appNavbarAlign, setNavbarAlign: setAppNavbarAlign, notifications: appNotifications, setNotifications: setAppNotifications } = useAppTheme();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    
    const [theme, setTheme] = useState(appTheme);
    const [navbarAlign, setNavbarAlign] = useState(appNavbarAlign);
    const [accentColor, setAccentColor] = useState(appAccentColor);
    const [notifications, setNotifications] = useState(appNotifications);

    useEffect(() => {
        if (userProfile) {
            setProfile(userProfile);
            setBio(userProfile.bio || '');
            setDisplayName(userProfile.displayName || currentUser?.displayName || '');
            setLoading(false);
        } else if (currentUser) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [currentUser, userProfile]);

    async function fetchProfile() {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile(data);
                setBio(data.bio || '');
                setDisplayName(data.displayName || currentUser.displayName || '');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function calculateStreak() {
        if (!profile?.lastActiveDate) return 0;
        const lastActive = new Date(profile.lastActiveDate);
        const today = new Date();
        const diffTime = today.getTime() - lastActive.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 1) return 0;
        return profile.currentStreak || 0;
    }

    function calculateLevel() {
        const xp = profile?.learningStats?.xp || 0;
        if (xp >= 1000) return { level: 'Expert', color: 'text-purple-500' };
        if (xp >= 500) return { level: 'Advanced', color: 'text-blue-500' };
        if (xp >= 200) return { level: 'Intermediate', color: 'text-green-500' };
        if (xp >= 50) return { level: 'Learner', color: 'text-yellow-500' };
        return { level: 'Beginner', color: 'text-gray-400' };
    }

    async function handleSaveProfile() {
        if (!currentUser) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                bio,
                displayName,
            }, { merge: true });
            setProfile(prev => ({ ...prev, bio, displayName }));
            setEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveSettings() {
        if (!currentUser) return;
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                settings: {
                    theme,
                    navbarAlign,
                    accentColor,
                    notifications,
                }
            }, { merge: true });
        } catch (err) {
            console.error(err);
        }
    }

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        setAppTheme(newTheme);
    };

    const handleAccentChange = (newAccent) => {
        setAccentColor(newAccent);
        setAppAccentColor(newAccent);
    };

    const handleNavbarAlignChange = (newAlign) => {
        setNavbarAlign(newAlign);
        setAppNavbarAlign(newAlign);
    };

    const handleNotificationsChange = (value) => {
        setNotifications(value);
        setAppNotifications(value);
    };

    useEffect(() => {
        if (profile) handleSaveSettings();
    }, [theme, navbarAlign, accentColor, notifications]);

    const streak = calculateStreak();
    const levelInfo = calculateLevel();

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const stats = [
        { icon: BookOpen, label: 'Courses', value: profile?.learningStats?.coursesCompleted || 0, color: 'from-blue-500 to-cyan-500' },
        { icon: PlayCircle, label: 'Videos', value: profile?.learningStats?.videosWatched || 0, color: 'from-purple-500 to-violet-500' },
        { icon: Trophy, label: 'Quizzes', value: profile?.learningStats?.quizzesTaken || 0, color: 'from-amber-500 to-orange-500' },
        { icon: Zap, label: 'XP Points', value: profile?.learningStats?.xp || 0, color: 'from-emerald-500 to-green-500' },
    ];

    const tabs = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30 overflow-hidden flex items-center justify-center shrink-0">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-white" />
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl font-bold text-white mb-1">
                            {profile?.displayName || currentUser.displayName || "Student"}
                        </h1>
                        <p className="text-white/80">{currentUser.email}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium flex items-center gap-1">
                                <Flame className="w-4 h-4" /> {streak} day streak
                            </span>
                            <span className={`px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium flex items-center gap-1`}>
                                <Target className="w-4 h-4" /> {levelInfo.level}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50"
                    >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                            <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                                : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50 hover:border-orange-300 dark:hover:border-orange-500/30'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                            {!editing && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Display Name</div>
                                    <div className="text-gray-900 dark:text-white font-medium">{profile?.displayName || currentUser.displayName || 'Not set'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Bio</div>
                                    <div className="text-gray-900 dark:text-white">{profile?.bio || 'No bio yet.'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Email</div>
                                    <div className="text-gray-900 dark:text-white">{currentUser.email}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Connected Accounts */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connected Accounts</h2>
                        <div className="space-y-3">
                            {[
                                { name: 'Google', icon: Globe, connected: true },
                                { name: 'GitHub', icon: Github, connected: false },
                                { name: 'Twitter', icon: Twitter, connected: false },
                            ].map(account => (
                                <div key={account.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <account.icon className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{account.name}</span>
                                    </div>
                                    {account.connected ? (
                                        <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Connected
                                        </span>
                                    ) : (
                                        <button className="text-xs text-orange-500 font-medium hover:text-orange-600">
                                            Connect
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    {/* Appearance */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-orange-500" />
                            Appearance
                        </h2>
                        
                        {/* Theme */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                            <div className="flex gap-3">
                                {THEMES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleThemeChange(t.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                            theme === t.id
                                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-2 border-orange-500/30'
                                                : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                    >
                                        <t.icon className="w-4 h-4" />
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accent Color</label>
                            <div className="flex gap-3">
                                {ACCENT_COLORS.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleAccentChange(c.id)}
                                        className={`w-10 h-10 rounded-xl transition-all ${
                                            accentColor === c.id ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : ''
                                        }`}
                                        style={{ backgroundColor: c.color }}
                                    >
                                        {accentColor === c.id && <Check className="w-5 h-5 text-white mx-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Layout */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-orange-500" />
                            Layout
                        </h2>

                        {/* Navbar Alignment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sidebar Position</label>
                            <div className="flex gap-3">
                                {NAVBAR_ALIGNMENTS.map(align => (
                                    <button
                                        key={align.id}
                                        onClick={() => handleNavbarAlignChange(align.id)}
                                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                            navbarAlign === align.id
                                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-2 border-orange-500/30'
                                                : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                    >
                                        {align.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-500" />
                            Notifications
                        </h2>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</div>
                                <div className="text-xs text-gray-500">Receive updates about your courses</div>
                            </div>
                            <button
                                onClick={() => handleNotificationsChange(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${
                                    notifications ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-200 dark:border-red-500/20">
                        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Danger Zone
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Sign Out</div>
                                <div className="text-xs text-gray-500">Sign out from your account</div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
