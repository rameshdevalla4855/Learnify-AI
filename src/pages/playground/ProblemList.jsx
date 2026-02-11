import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leetcodeService } from '../../services/leetcode';
import { Search, CheckCircle, Circle, Clock, Zap, Loader2, ChevronDown, SlidersHorizontal } from 'lucide-react';

const TOPICS = ['All Topics', 'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search', 'Tree', 'Two Pointers', 'Stack', 'Linked List'];
const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Medium', 'Hard'];

export default function ProblemList() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('All Topics');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 30;
    const observerRef = useRef(null);

    // Initial fetch
    useEffect(() => {
        setProblems([]);
        setSkip(0);
        setHasMore(true);
        loadProblems(0, true);
    }, [selectedTopic]);

    const loadProblems = async (offset, reset = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        try {
            let data = [];
            if (selectedTopic === 'All Topics') {
                data = await leetcodeService.getProblems(LIMIT, offset);
            } else {
                // Client-side filter from a larger batch
                const allData = await leetcodeService.getProblems(200, 0);
                data = (allData || []).filter(p =>
                    (p.topicTags || []).some(t => t.name === selectedTopic)
                );
            }

            if (Array.isArray(data)) {
                setProblems(prev => reset ? data : [...prev, ...data]);
                setHasMore(data.length >= LIMIT && selectedTopic === 'All Topics');
                setSkip(offset + LIMIT);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load problems", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Infinite scroll observer
    const lastProblemRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && selectedTopic === 'All Topics') {
                loadProblems(skip);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, loadingMore, hasMore, skip, selectedTopic]);

    // Client-side filtering for search & difficulty
    const filteredProblems = problems.filter(p => {
        const matchesSearch = !searchTerm ||
            (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.topicTags || []).some(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDifficulty = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
        return matchesSearch && matchesDifficulty;
    });

    const getDifficultyStyle = (d) => {
        if (d === 'Easy') return 'text-emerald-400 bg-emerald-400/10';
        if (d === 'Medium') return 'text-amber-400 bg-amber-400/10';
        return 'text-rose-400 bg-rose-400/10';
    };

    return (
        <div className="h-full overflow-y-auto bg-[#1a1a2e]">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">Problems</h1>
                        <p className="text-xs text-gray-500 mt-0.5">{problems.length} problems loaded</p>
                    </div>
                    <Link to="/playground/problem/two-sum" className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:border-orange-500/50 transition-all">
                        <Zap className="w-3.5 h-3.5 fill-orange-400" /> Daily Challenge
                    </Link>
                </div>

                {/* Search + Difficulty Filter */}
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

                {/* Topic Pills */}
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

                {/* Table */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-white/[0.06] text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-7 md:col-span-5">Title</div>
                        <div className="col-span-2 hidden md:block text-center">Acceptance</div>
                        <div className="col-span-4 md:col-span-2 text-center">Difficulty</div>
                        <div className="col-span-2 hidden md:block text-center">Tags</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-white/[0.04]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                <span className="text-xs text-gray-500">Fetching problems...</span>
                            </div>
                        ) : filteredProblems.length > 0 ? (
                            filteredProblems.map((problem, idx) => {
                                const isLast = idx === filteredProblems.length - 1;
                                return (
                                    <Link
                                        to={`/playground/problem/${problem.titleSlug}`}
                                        key={problem.titleSlug || idx}
                                        ref={isLast ? lastProblemRef : null}
                                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors group"
                                    >
                                        <div className="col-span-1 text-center">
                                            {idx % 5 === 0
                                                ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                                                : <span className="text-xs text-gray-600">{idx + 1}</span>
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
                                        <div className="col-span-2 hidden md:flex justify-center gap-1 overflow-hidden">
                                            {(problem.topicTags || []).slice(0, 1).map(tag => (
                                                <span key={tag.slug} className="text-[9px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                                    {tag.name}
                                                </span>
                                            ))}
                                            {(problem.topicTags || []).length > 1 && (
                                                <span className="text-[9px] text-gray-600">+{problem.topicTags.length - 1}</span>
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
                                    onClick={() => { setSearchTerm(''); setSelectedTopic('All Topics'); setSelectedDifficulty('All'); }}
                                    className="text-xs text-orange-400 hover:underline mt-1"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}

                        {/* Loading more indicator */}
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
