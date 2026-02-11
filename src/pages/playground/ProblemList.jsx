import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leetcodeService } from '../../services/leetcode';
import { getCachedProblems, getLastSyncTime } from '../../services/problemCacheService';
import { PROBLEMS } from '../../data/problems';
import {
    Search, CheckCircle, Zap, Loader2, RefreshCw, Database, Wifi, WifiOff
} from 'lucide-react';

const TOPICS = [
    'All Topics', 'Array', 'String', 'Hash Table', 'Dynamic Programming',
    'Math', 'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search',
    'Tree', 'Two Pointers', 'Stack', 'Linked List', 'Graph',
    'Backtracking', 'Bit Manipulation', 'Heap (Priority Queue)'
];
const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Medium', 'Hard'];

// Local PROBLEMS → normalised shape
const LOCAL_PROBLEMS = PROBLEMS.map(p => ({
    titleSlug: p.id,
    title: p.title,
    difficulty: p.difficulty,
    acRate: null,
    topicTags: [],
    topicNames: [],
    isPaidOnly: false,
    isLocal: true,
}));

export default function ProblemList() {
    // ─── State ────────────────────────────────────────────
    const [cachedProblems, setCachedProblems] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState(''); // 'done' | 'error' | ''
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [selectedTopic, setSelectedTopic] = useState('All Topics');
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const PAGE_SIZE = 30;

    const observerRef = useRef(null);
    const syncedRef = useRef(false); // prevent double-sync in strict mode

    // ─── Load cached problems from Firestore ─────────────
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

    // ─── Sync from API → Firebase (background) ──────────
    const syncFromApi = useCallback(async () => {
        setSyncing(true);
        setSyncStatus('');
        let totalFetched = 0;

        try {
            // Fetch up to 500 problems in batches of 50
            for (let skip = 0; skip < 500; skip += 50) {
                const { problems, fromApi } = await leetcodeService.fetchAndCacheProblems(50, skip);
                if (!fromApi || problems.length === 0) break;
                totalFetched += problems.length;
                if (problems.length < 50) break; // no more left
            }

            if (totalFetched > 0) {
                setSyncStatus('done');
                // Reload from cache to pick up new problems
                loadPage(true);
            } else {
                setSyncStatus('error');
            }
        } catch {
            setSyncStatus('error');
        } finally {
            setSyncing(false);
            const ts = await getLastSyncTime();
            setLastSyncTime(ts);
        }
    }, [loadPage]);

    // ─── Initial load: cache first, then background sync ─
    useEffect(() => {
        loadPage(true);
    }, [selectedDifficulty, selectedTopic]);

    // Background sync on first mount only
    useEffect(() => {
        if (syncedRef.current) return;
        syncedRef.current = true;

        // Check last sync time
        getLastSyncTime().then(ts => {
            setLastSyncTime(ts);
            const stale = !ts || (Date.now() - ts.getTime()) > 30 * 60 * 1000; // 30 min
            if (stale) syncFromApi();
        });
    }, []);

    // ─── Infinite scroll observer ────────────────────────
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

    // ─── Merge local + cached, apply search filter ───────
    const mergedProblems = (() => {
        // Filter local problems
        const filteredLocal = LOCAL_PROBLEMS.filter(p => {
            const matchDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
            return matchDiff; // local have no topicNames
        });

        // Dedup: remove cached if same slug as local
        const localIds = new Set(LOCAL_PROBLEMS.map(p => p.titleSlug));
        const filteredCached = cachedProblems.filter(p => !localIds.has(p.titleSlug));

        return [...filteredLocal, ...filteredCached];
    })();

    // Apply search on merged
    const displayProblems = searchTerm
        ? mergedProblems.filter(p =>
            (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.topicNames || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : mergedProblems;

    // ─── Helpers ─────────────────────────────────────────
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
        return `${Math.round(mins / 60)}h ago`;
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="h-full overflow-y-auto bg-[#1a1a2e]">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">Problems</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                {displayProblems.length} shown
                            </span>
                            <span className="text-[11px] text-gray-600 flex items-center gap-1">
                                {syncing ? (
                                    <><Loader2 className="w-3 h-3 animate-spin text-orange-400" /> Syncing API...</>
                                ) : syncStatus === 'error' ? (
                                    <><WifiOff className="w-3 h-3 text-rose-400" /> API offline</>
                                ) : (
                                    <><Wifi className="w-3 h-3 text-emerald-400" /> Synced {formatSyncTime(lastSyncTime)}</>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { if (!syncing) syncFromApi(); }}
                            disabled={syncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:border-orange-500/30 text-[11px] font-medium rounded-lg transition-all disabled:opacity-40"
                            title="Refresh from LeetCode API"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                            Sync
                        </button>
                        <Link to="/playground/problem/two-sum" className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:border-orange-500/50 transition-all">
                            <Zap className="w-3.5 h-3.5 fill-orange-400" /> Daily Challenge
                        </Link>
                    </div>
                </div>

                {/* ── Search + Difficulty ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06] focus-within:border-orange-500/40 transition-colors">
                        <Search className="w-4 h-4 text-gray-500 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by title or tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-white w-full placeholder-gray-500"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white text-xs">✕</button>
                        )}
                    </div>
                    <div className="flex gap-1.5">
                        {DIFFICULTY_OPTIONS.map(d => (
                            <button
                                key={d}
                                onClick={() => setSelectedDifficulty(d)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedDifficulty === d
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

                {/* ── Topic Pills ── */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {TOPICS.map(topic => (
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

                {/* ── Problem Table ── */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-white/[0.06] text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-7 md:col-span-5">Title</div>
                        <div className="col-span-2 hidden md:block text-center">Acceptance</div>
                        <div className="col-span-4 md:col-span-2 text-center">Difficulty</div>
                        <div className="col-span-2 hidden md:block text-center">Source</div>
                    </div>

                    {/* Body */}
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
                                            {problem.isLocal
                                                ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                                                : <span className="text-xs text-gray-600">{problem.frontendQuestionId || idx + 1}</span>
                                            }
                                        </div>
                                        <div className="col-span-7 md:col-span-5 flex items-center gap-2 min-w-0">
                                            <span className="text-[13px] font-medium text-gray-200 group-hover:text-white truncate">
                                                {problem.title}
                                            </span>
                                            {problem.isPaidOnly && (
                                                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-semibold shrink-0">PRO</span>
                                            )}
                                        </div>
                                        <div className="col-span-2 hidden md:block text-center">
                                            <span className="text-xs text-gray-500">
                                                {problem.acRate ? `${Math.round(problem.acRate)}%` : '—'}
                                            </span>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 text-center">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getDifficultyStyle(problem.difficulty)}`}>
                                                {problem.difficulty}
                                            </span>
                                        </div>
                                        <div className="col-span-2 hidden md:flex justify-center">
                                            {problem.isLocal ? (
                                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                                    ✓ Runnable
                                                </span>
                                            ) : (
                                                <span className="text-[9px] bg-white/[0.04] text-gray-500 px-2 py-0.5 rounded-full">
                                                    LeetCode
                                                </span>
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

                        {/* Loading more */}
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                            </div>
                        )}

                        {/* End of list */}
                        {!hasMore && displayProblems.length > 0 && !loading && (
                            <div className="text-center py-4 text-[11px] text-gray-600">
                                {syncing ? 'Fetching more from API...' : `All ${displayProblems.length} problems loaded`}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
