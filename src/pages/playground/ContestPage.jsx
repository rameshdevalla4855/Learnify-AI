import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
    Trophy, Calendar, Clock, Users, Zap, Star, Medal, 
    ChevronRight, Play, Lock, CheckCircle, Timer, Flame,
    Crown, Target, TrendingUp, Award, Gift, Bell
} from 'lucide-react';

const UPCOMING_CONTESTS = [
    {
        id: 'weekly-45',
        title: 'Weekly Contest 45',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 90,
        participants: 0,
        status: 'upcoming',
        difficulty: 'Mixed',
        prizes: '500 XP',
    },
    {
        id: 'biweekly-22',
        title: 'Biweekly Contest 22',
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: 90,
        participants: 0,
        status: 'upcoming',
        difficulty: 'Mixed',
        prizes: '500 XP',
    },
];

const PAST_CONTESTS = [
    {
        id: 'weekly-44',
        title: 'Weekly Contest 44',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 90,
        participants: 1247,
        status: 'completed',
        winner: 'Alex_Coder',
        yourRank: null,
    },
    {
        id: 'weekly-43',
        title: 'Weekly Contest 43',
        startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        duration: 90,
        participants: 1089,
        status: 'completed',
        winner: 'SpeedCoder',
        yourRank: 156,
    },
    {
        id: 'biweekly-21',
        title: 'Biweekly Contest 21',
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        duration: 90,
        participants: 892,
        status: 'completed',
        winner: 'CodeNinja',
        yourRank: 89,
    },
];

const LEADERBOARD = [
    { rank: 1, name: 'Alex_Coder', rating: 2847, contests: 45, avatar: null },
    { rank: 2, name: 'SpeedCoder', rating: 2756, contests: 52, avatar: null },
    { rank: 3, name: 'CodeNinja', rating: 2698, contests: 38, avatar: null },
    { rank: 4, name: 'ByteMaster', rating: 2634, contests: 41, avatar: null },
    { rank: 5, name: 'AlgoQueen', rating: 2589, contests: 35, avatar: null },
    { rank: 6, name: 'DevChampion', rating: 2534, contests: 48, avatar: null },
    { rank: 7, name: 'LogicLord', rating: 2498, contests: 33, avatar: null },
    { rank: 8, name: 'ProCoder', rating: 2467, contests: 29, avatar: null },
    { rank: 9, name: 'StackOverflow', rating: 2434, contests: 44, avatar: null },
    { rank: 10, name: 'BinaryBoss', rating: 2398, contests: 37, avatar: null },
];

export default function ContestPage() {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [selectedContest, setSelectedContest] = useState(null);
    const { currentUser } = useAuth();

    const formatTimeLeft = (date) => {
        const diff = date - new Date();
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="h-full overflow-y-auto bg-[#1a1a2e]">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-orange-500" />
                            Contests
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Compete, improve, and climb the leaderboard</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors">
                        <Bell className="w-3.5 h-3.5" />
                        Remind Me
                    </button>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {['upcoming', 'live', 'past', 'leaderboard'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap ${
                                activeTab === tab
                                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                                    : 'bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block mr-1.5" />}
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'upcoming' && (
                    <div className="space-y-3">
                        {UPCOMING_CONTESTS.map(contest => (
                            <div key={contest.id} className="bg-[#1e1e32] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold rounded-full uppercase">Upcoming</span>
                                            <span className="px-2 py-0.5 bg-white/[0.04] text-gray-400 text-[10px] font-medium rounded-full">{contest.difficulty}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{contest.title}</h3>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(contest.startTime)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {contest.duration} minutes
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                {contest.participants} registered
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-orange-400 text-xs font-semibold mb-3">
                                            <Timer className="w-3.5 h-3.5" />
                                            Starts in {formatTimeLeft(contest.startTime)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
                                            <Gift className="w-3.5 h-3.5 text-amber-400" />
                                            {contest.prizes}
                                        </div>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-lg text-xs font-semibold transition-all">
                                            <Zap className="w-3.5 h-3.5" />
                                            Register
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-white">Weekly Challenges</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">Join contests every Saturday and Sunday to improve your ranking</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'live' && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                            <Play className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Live Contests</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto">
                            There's no contest happening right now. Check upcoming contests or practice problems in the meantime.
                        </p>
                    </div>
                )}

                {activeTab === 'past' && (
                    <div className="space-y-2">
                        {PAST_CONTESTS.map(contest => (
                            <div key={contest.id} className="bg-[#1e1e32] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">{contest.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span>{formatDate(contest.startTime)}</span>
                                                <span>•</span>
                                                <span>{contest.participants} participants</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {contest.yourRank && (
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Your Rank</div>
                                                <div className="text-sm font-semibold text-emerald-400">#{contest.yourRank}</div>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Winner</div>
                                            <div className="text-sm font-semibold text-amber-400 flex items-center gap-1">
                                                <Crown className="w-3 h-3" />
                                                {contest.winner}
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors">
                                            View Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 bg-[#1e1e32] border border-white/[0.06] rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.06]">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-orange-400" />
                                    Global Leaderboard
                                </h3>
                            </div>
                            <div className="divide-y divide-white/[0.04]">
                                {LEADERBOARD.map((user, idx) => (
                                    <div key={user.rank} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                            idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                                            idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                                            idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                                            'bg-white/[0.04] text-gray-500'
                                        }`}>
                                            {idx < 3 ? <Medal className="w-4 h-4" /> : user.rank}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white">
                                            {user.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.contests} contests</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-orange-400">{user.rating}</div>
                                            <div className="text-[10px] text-gray-500">rating</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-[#1e1e32] border border-white/[0.06] rounded-xl p-5">
                                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    Your Stats
                                </h4>
                                {currentUser ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Current Rating</span>
                                            <span className="text-lg font-bold text-orange-400">1,847</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Global Rank</span>
                                            <span className="text-sm font-semibold text-white">#1,247</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Contests</span>
                                            <span className="text-sm font-semibold text-white">12</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Best Rank</span>
                                            <span className="text-sm font-semibold text-emerald-400">#89</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        Sign in to see your stats
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Flame className="w-5 h-5 text-orange-400" />
                                    <h4 className="text-sm font-semibold text-white">Streak Bonus</h4>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    Participate in consecutive contests to earn bonus XP!
                                </p>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                            i <= 3 ? 'bg-orange-500/30 text-orange-400' : 'bg-white/[0.04] text-gray-600'
                                        }`}>
                                            {i}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
