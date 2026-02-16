import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leetcodeService, TOPIC_TAGS } from '../../services/leetcode';
import { getCachedProblems, getLastSyncTime } from '../../services/problemCacheService';
import { PROBLEMS } from '../../data/problems';
import { cacheProblems } from '../../services/problemCacheService';
import {
    Search, CheckCircle, Zap, Loader2, RefreshCw, Database, Wifi, WifiOff,
    TrendingUp, Clock, BarChart3, Filter, ChevronDown, Download, Pause, Play as PlayIcon
} from 'lucide-react';

const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Medium', 'Hard'];
const STATUS_OPTIONS = ['All', 'Todo', 'Solved', 'Attempted'];

const LOCAL_PROBLEMS = PROBLEMS.map(p => ({
    titleSlug: p.id,
    title: p.title,
    difficulty: p.difficulty,
    acRate: null,
    topicTags: (p.tags || []).map(t => ({ name: t, slug: t.toLowerCase() })),
    topicNames: p.tags || [],
    isPaidOnly: false,
    isLocal: true,
    functionName: p.functionName,
    testCasesCount: p.testCases?.length || 0,
}));

export default function ProblemList() {
    const [cachedProblems, setCachedProblems] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [syncProgress, setSyncProgress] = useState({ fetched: 0, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [selectedTopic, setSelectedTopic] = useState('All Topics');
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [totalProblemsCount, setTotalProblemsCount] = useState(0);
    const PAGE_SIZE = 50;

    const observerRef = useRef(null);
    const syncedRef = useRef(false);
    const abortSyncRef = useRef(false);

    const loadPage = useCallback(async (reset = false) => {
        if (reset) {
            setLoading(true);
            setCachedProblems([]);
            setLastDoc(null);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const cursor = reset ? null : lastDoc;
            const filters = {};
            if (selectedDifficulty !== 'All') filters.difficulty = selectedDifficulty;
            if (selectedTopic !== 'All Topics') filters.topicName = selectedTopic;

            const result = await getCachedProblems(PAGE_SIZE, cursor, filters);
            setCachedProblems(prev => reset ? result.problems : [...prev, ...result.problems]);
            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Error loading cached problems:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [lastDoc, selectedDifficulty, selectedTopic]);

    const syncAllFromApi = useCallback(async () => {
        setSyncing(true);
        setSyncStatus('syncing');
        setSyncProgress({ fetched: 0, total: 0 });
        abortSyncRef.current = false;

        try {
            const result = await leetcodeService.fetchAllAndCache((fetched, batchCount) => {
                if (abortSyncRef.current) return;
                setSyncProgress(prev => ({
                    fetched,
                    total: Math.max(prev.total, fetched + batchCount)
                }));
            });

            if (!abortSyncRef.current) {
                if (result.total > 0) {
                    setSyncStatus('done');
                    setTotalProblemsCount(result.total);
                    loadPage(true);
                } else {
                    setSyncStatus('error');
                }
            }
        } catch (err) {
            if (!abortSyncRef.current) {
                setSyncStatus('error');
            }
        } finally {
            if (!abortSyncRef.current) {
                setSyncing(false);
            }
            const ts = await getLastSyncTime();
            setLastSyncTime(ts);
        }
    }, [loadPage]);

    const abortSync = useCallback(() => {
        abortSyncRef.current = true;
        setSyncing(false);
        setSyncStatus('aborted');
    }, []);

    useEffect(() => {
        loadPage(true);
    }, [selectedDifficulty, selectedTopic]);

    useEffect(() => {
        if (syncedRef.current) return;
        syncedRef.current = true;

        const formattedLocal = PROBLEMS.map(p => ({
            titleSlug: p.id,
            title: p.title,
            difficulty: p.difficulty,
            acRate: null,
            isPaidOnly: false,
            frontendQuestionId: null,
            topicTags: (p.tags || []).map(t => ({ name: t, slug: t.toLowerCase() })),
            topicNames: p.tags || [],
            description: p.description || '',
            examples: p.examples || [],
            constraints: p.constraints || [],
            hints: p.hints || [],
            starterCode: p.starterCode || {},
            hasDetails: true,
            isLocal: true,
        }));

        cacheProblems(formattedLocal).then(() => {
            loadPage(true);
        });

        getLastSyncTime().then(ts => {
            setLastSyncTime(ts);
            const stale = !ts || (Date.now() - ts.getTime()) > 60 * 60 * 1000;
            if (stale) {
                syncAllFromApi();
            }
        });
    }, []);

    const lastProblemRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadPage(false);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, loadingMore, hasMore, loadPage]);

    const mergedProblems = (() => {
        const filteredLocal = LOCAL_PROBLEMS.filter(p => {
            const matchDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
            const matchTopic = selectedTopic === 'All Topics' || (p.topicNames || []).includes(selectedTopic);
            return matchDiff && matchTopic;
        });

        const localIds = new Set(LOCAL_PROBLEMS.map(p => p.titleSlug));
        const filteredCached = cachedProblems.filter(p => !localIds.has(p.titleSlug));

        return [...filteredLocal, ...filteredCached];
    })();

    const displayProblems = searchTerm
        ? mergedProblems.filter(p =>
            (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.topicNames || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : mergedProblems;

    const stats = {
        total: displayProblems.length,
        easy: displayProblems.filter(p => p.difficulty === 'Easy').length,
        medium: displayProblems.filter(p => p.difficulty === 'Medium').length,
        hard: displayProblems.filter(p => p.difficulty === 'Hard').length,
        local: displayProblems.filter(p => p.isLocal).length,
    };

    const getDifficultyStyle = (d) => {
        if (d === 'Easy') return 'text-emerald-400 bg-emerald-400/10';
        if (d === 'Medium') return 'text-amber-400 bg-amber-400/10';
        return 'text-rose-400 bg-rose-400/10';
    };

    const formatSyncTime = (date) => {
        if (!date) return 'Never';
        const mins = Math.round((Date.now() - date.getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.round(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.round(hours / 24)}d ago`;
    };

    const progressPercent = syncProgress.total > 0 
        ? Math.round((syncProgress.fetched / syncProgress.total) * 100) 
        : 0;

    return (
        <div className="h-full overflow-y-auto bg-[#1a1a2e]">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-orange-500" />
                            Problems
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                {stats.total} shown
                                {totalProblemsCount > 0 && <span className="text-gray-600">/ {totalProblemsCount} total</span>}
                            </span>
                            <span className="text-[11px] flex items-center gap-2">
                                <span className="text-emerald-400">{stats.easy} Easy</span>
                                <span className="text-amber-400">{stats.medium} Medium</span>
                                <span className="text-rose-400">{stats.hard} Hard</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 flex items-center gap-1">
                            {syncing ? (
                                <><Loader2 className="w-3 h-3 animate-spin text-orange-400" /> Syncing...</>
                            ) : syncStatus === 'error' ? (
                                <><WifiOff className="w-3 h-3 text-rose-400" /> Error</>
                            ) : (
                                <><Wifi className="w-3 h-3 text-emerald-400" /> {formatSyncTime(lastSyncTime)}</>
                            )}
                        </span>
                        {syncing ? (
                            <button
                                onClick={abortSync}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-medium rounded-lg transition-all"
                            >
                                <Zap className="w-3 h-3" />
                                Stop
                            </button>
                        ) : (
                            <button
                                onClick={syncAllFromApi}
                                disabled={syncing}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:border-orange-500/30 text-[10px] font-medium rounded-lg transition-all disabled:opacity-40"
                                title="Sync all problems from LeetCode API"
                            >
                                <Download className="w-3 h-3" />
                                Sync All
                            </button>
                        )}
                        <Link to="/playground/problem/two-sum" className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:border-orange-500/50 transition-all">
                            <Zap className="w-3.5 h-3.5 fill-orange-400" /> Daily
                        </Link>
                    </div>
                </div>

                {syncing && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Syncing from LeetCode API...</span>
                            <span className="text-xs text-orange-400">{syncProgress.fetched} problems</span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-[11px] font-medium">Runnable</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.local}</div>
                        <div className="text-[10px] text-gray-500">with test cases</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-2 text-amber-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[11px] font-medium">API Problems</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{totalProblemsCount || '—'}</div>
                        <div className="text-[10px] text-gray-500">from LeetCode</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-[11px] font-medium">Execution</span>
                        </div>
                        <div className="text-2xl font-bold text-white">Piston</div>
                        <div className="text-[10px] text-gray-500">code runner</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06] focus-within:border-orange-500/40 transition-colors">
                        <Search className="w-4 h-4 text-gray-500 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search problems by title or tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-white w-full placeholder-gray-500"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white text-xs">✕</button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {DIFFICULTY_OPTIONS.map(d => (
                            <button
                                key={d}
                                onClick={() => setSelectedDifficulty(d)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${selectedDifficulty === d
                                    ? d === 'Easy' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                        : d === 'Medium' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                            : d === 'Hard' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                : 'bg-white/[0.08] border-white/[0.1] text-white'
                                    : 'bg-transparent border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.1]'
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setSelectedTopic('All Topics')}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border ${selectedTopic === 'All Topics'
                            ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                            : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.1]'
                            }`}
                    >
                        All Topics
                    </button>
                    {TOPIC_TAGS.slice(0, 20).map(topic => (
                        <button
                            key={topic}
                            onClick={() => setSelectedTopic(topic)}
                            className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border ${selectedTopic === topic
                                ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                                : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.1]'
                                }`}
                        >
                            {topic}
                        </button>
                    ))}
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-5 md:col-span-5">Title</div>
                        <div className="col-span-2 hidden md:block text-center">Acceptance</div>
                        <div className="col-span-3 md:col-span-2 text-center">Difficulty</div>
                        <div className="col-span-3 hidden md:block text-center">Tags</div>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                        {loading && displayProblems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                <span className="text-xs text-gray-500">Loading problems...</span>
                            </div>
                        ) : displayProblems.length > 0 ? (
                            displayProblems.map((problem, idx) => {
                                const isLast = idx === displayProblems.length - 1;
                                return (
                                    <Link
                                        to={`/playground/problem/${problem.titleSlug}`}
                                        key={problem.titleSlug || idx}
                                        ref={isLast ? lastProblemRef : null}
                                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors group"
                                    >
                                        <div className="col-span-1 text-center">
                                            {problem.isLocal ? (
                                                <div className="flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600">{problem.frontendQuestionId || idx + 1}</span>
                                            )}
                                        </div>
                                        <div className="col-span-5 md:col-span-5 flex flex-col min-w-0">
                                            <span className="text-[13px] font-medium text-gray-200 group-hover:text-white truncate">
                                                {problem.title}
                                            </span>
                                            <div className="flex items-center gap-1 mt-0.5 md:hidden">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getDifficultyStyle(problem.difficulty)}`}>
                                                    {problem.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 hidden md:block text-center">
                                            <span className="text-xs text-gray-500">
                                                {problem.acRate ? `${Math.round(problem.acRate)}%` : '—'}
                                            </span>
                                        </div>
                                        <div className="col-span-3 md:col-span-2 text-center">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getDifficultyStyle(problem.difficulty)}`}>
                                                {problem.difficulty}
                                            </span>
                                        </div>
                                        <div className="col-span-3 hidden md:flex justify-center gap-1 flex-wrap">
                                            {(problem.topicNames || []).slice(0, 2).map((tag, i) => (
                                                <span key={i} className="text-[9px] bg-white/[0.04] text-gray-500 px-1.5 py-0.5 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                            {(problem.topicNames || []).length > 2 && (
                                                <span className="text-[9px] text-gray-600">+{problem.topicNames.length - 2}</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-500">
                                <Search className="w-6 h-6 opacity-30" />
                                <span className="text-sm">No problems match your filters</span>
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedDifficulty('All'); setSelectedTopic('All Topics'); }}
                                    className="text-xs text-orange-400 hover:underline mt-1"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}

                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                            </div>
                        )}

                        {!hasMore && displayProblems.length > 0 && !loading && (
                            <div className="text-center py-4 text-[11px] text-gray-600">
                                {totalProblemsCount > 0 
                                    ? `Showing ${displayProblems.length} of ${totalProblemsCount} problems`
                                    : `All ${displayProblems.length} problems loaded`
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
