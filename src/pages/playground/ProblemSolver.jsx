import { useState, useCallback, useEffect, useRef } from 'react';
import CodePlayground from '../../components/CodePlayground';
import {
    FileText, ChevronLeft, History, BookOpen, Play, Loader2, X,
    Maximize2, Minimize2, Terminal, ChevronUp, Code
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { leetcodeService } from '../../services/leetcode';
import { PROBLEMS } from '../../data/problems';

// Simple markdown-to-HTML for local problem descriptions
function markdownToHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') // escape HTML
        .replace(/`([^`]+)`/g, '<code>$1</code>') // inline code
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // bold
        .replace(/\n\n/g, '</p><p>') // paragraphs
        .replace(/\n(\d+)\./g, '<br/>$1.') // numbered list items
        .replace(/\n/g, '<br/>'); // line breaks
}

export default function ProblemSolver() {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    const [activeLeftTab, setActiveLeftTab] = useState('description');
    const [leftPanelWidth, setLeftPanelWidth] = useState(42);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showConsole, setShowConsole] = useState(false);
    const [activeConsoleTab, setActiveConsoleTab] = useState('testcase');
    const [mobileView, setMobileView] = useState('description'); // 'description' | 'code'

    const [selectedProblem, setSelectedProblem] = useState(null);
    const [localProblem, setLocalProblem] = useState(null); // from PROBLEMS data (has testRunner)
    const [loading, setLoading] = useState(true);
    const [editorCode, setEditorCode] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('javascript');
    const [executionResult, setExecutionResult] = useState(null);
    const [testResults, setTestResults] = useState(null); // array of {passed, input, expected, actual, error}
    const [isRunning, setIsRunning] = useState(false);

    // Load problem — check local PROBLEMS first, then fallback to API
    useEffect(() => {
        if (!problemId) return;
        (async () => {
            setLoading(true);
            try {
                // 1. Check if we have this problem locally (with testRunner + starterCode)
                const local = PROBLEMS.find(p => p.id === problemId);
                setLocalProblem(local || null);

                if (local) {
                    setSelectedProblem({
                        id: problemId,
                        title: local.title,
                        difficulty: local.difficulty,
                        description: local.description,
                        examples: local.examples,
                    });
                    // Set starter code for default language
                    const defaultLang = 'javascript';
                    setEditorLanguage(defaultLang);
                    setEditorCode(local.starterCode?.[defaultLang] || '');
                } else {
                    // 2. Fallback to API
                    const data = await leetcodeService.getProblemDetails(problemId);
                    if (data) {
                        setSelectedProblem({
                            id: problemId,
                            title: data.questionTitle || problemId.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' '),
                            difficulty: data.difficulty || 'Medium',
                            description: data.question || data.content || (typeof data === 'string' ? data : 'No description available.'),
                        });
                    }
                }
            } catch (err) {
                console.error("Error loading problem", err);
                navigate('/playground/problems');
            } finally {
                setLoading(false);
            }
        })();
    }, [problemId, navigate]);

    // Resize
    const handleMouseDown = useCallback(() => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPanelWidth(Math.min(Math.max(pct, 25), 70));
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleRunCode = async () => {
        setIsRunning(true);
        setShowConsole(true);
        setActiveConsoleTab('result');
        setExecutionResult({ status: 'running' });
        setTestResults(null);

        try {
            // Check if we have a local test runner for the current language
            const runner = localProblem?.testRunner?.[editorLanguage];
            if (runner) {
                const startTime = performance.now();
                const results = runner(editorCode);
                const elapsed = (performance.now() - startTime).toFixed(1);

                // results is an array of { passed, input, expected, actual, error }
                setTestResults(Array.isArray(results) ? results : []);

                const passed = Array.isArray(results) ? results.filter(r => r.passed).length : 0;
                const total = Array.isArray(results) ? results.length : 0;
                const allPassed = passed === total && total > 0;

                setExecutionResult({
                    status: allPassed ? 'accepted' : 'wrong_answer',
                    runtime: `${elapsed} ms`,
                    passed,
                    total,
                });
            } else {
                // No local test runner available — delegate to CodePlayground's internal execution
                setExecutionResult({
                    status: 'no_runner',
                    message: localProblem
                        ? `No test runner for ${editorLanguage}. Try JavaScript.`
                        : 'This problem was loaded from API and has no local test cases. Use the Run button inside the editor.'
                });
            }
        } catch (err) {
            setExecutionResult({
                status: 'error',
                error: err.message,
            });
            setTestResults(null);
        } finally {
            setIsRunning(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#1a1a2e] gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <span className="text-xs text-gray-500">Loading problem...</span>
            </div>
        );
    }

    if (!selectedProblem) {
        return (
            <div className="h-full flex items-center justify-center bg-[#1a1a2e] text-gray-500 text-sm">
                Problem not found.
            </div>
        );
    }

    const diffStyle = (d) => d === 'Easy' ? 'text-emerald-400 bg-emerald-400/10' : d === 'Medium' ? 'text-amber-400 bg-amber-400/10' : 'text-rose-400 bg-rose-400/10';

    const leftTabs = [
        { id: 'description', label: 'Description', icon: FileText, color: 'text-blue-400' },
        { id: 'solutions', label: 'Solutions', icon: BookOpen, color: 'text-emerald-400' },
        { id: 'submissions', label: 'Submissions', icon: History, color: 'text-gray-400' },
    ];

    // ─── Console Content (shared) ────────────────────────────────
    const consoleContent = (
        <div className="h-[240px] border-t border-white/[0.06] bg-[#0d0d1a] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    {['testcase', 'result'].map(tab => (
                        <button key={tab} onClick={() => setActiveConsoleTab(tab)}
                            className={`text-[11px] font-medium pb-1 transition-colors ${activeConsoleTab === tab ? 'text-white border-b border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}>
                            {tab === 'testcase' ? 'Testcase' : 'Result'}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowConsole(false)} className="text-gray-500 hover:text-white p-0.5">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs min-h-0">
                {activeConsoleTab === 'testcase' ? (
                    <div className="space-y-2">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Sample Inputs</span>
                        {selectedProblem?.examples?.length > 0 ? (
                            selectedProblem.examples.map((ex, i) => (
                                <div key={i} className="bg-white/[0.04] rounded-md px-3 py-2 text-gray-300 border border-white/[0.06]">
                                    <span className="text-gray-500 text-[9px]">Case {i + 1}:</span>
                                    <div className="mt-0.5">{ex.input}</div>
                                    <div className="text-emerald-400/70 mt-1">→ {ex.output}</div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/[0.04] rounded-md px-3 py-2 text-gray-300 border border-white/[0.06]">
                                No test cases available for this problem
                            </div>
                        )}
                    </div>
                ) : executionResult?.status === 'running' ? (
                    <div className="flex items-center text-gray-400 gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running test cases...
                    </div>
                ) : executionResult?.status === 'accepted' ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-bold text-sm">✅ Accepted</span>
                            <span className="text-[10px] text-gray-500">{executionResult.passed}/{executionResult.total} passed • {executionResult.runtime}</span>
                        </div>
                        {testResults?.map((r, i) => (
                            <div key={i} className={`rounded-lg px-3 py-2 border ${r.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                <div className={`text-[11px] font-semibold ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    Test {i + 1}: {r.passed ? 'PASSED ✓' : 'FAILED ✗'}
                                </div>
                                {!r.passed && (
                                    <div className="mt-1.5 space-y-1 text-[10px]">
                                        <div><span className="text-gray-500">Input:</span> <span className="text-gray-300">{r.input}</span></div>
                                        <div><span className="text-gray-500">Expected:</span> <span className="text-emerald-300">{r.expected}</span></div>
                                        <div><span className="text-gray-500">Got:</span> <span className="text-rose-300">{r.actual}</span></div>
                                        {r.error && <div><span className="text-gray-500">Error:</span> <span className="text-rose-300">{r.error}</span></div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : executionResult?.status === 'wrong_answer' ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-rose-400 font-bold text-sm">❌ Wrong Answer</span>
                            <span className="text-[10px] text-gray-500">{executionResult.passed}/{executionResult.total} passed • {executionResult.runtime}</span>
                        </div>
                        {testResults?.map((r, i) => (
                            <div key={i} className={`rounded-lg px-3 py-2 border ${r.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                <div className={`text-[11px] font-semibold ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    Test {i + 1}: {r.passed ? 'PASSED ✓' : 'FAILED ✗'}
                                </div>
                                {!r.passed && (
                                    <div className="mt-1.5 space-y-1 text-[10px]">
                                        <div><span className="text-gray-500">Input:</span> <span className="text-gray-300">{r.input}</span></div>
                                        <div><span className="text-gray-500">Expected:</span> <span className="text-emerald-300">{r.expected}</span></div>
                                        <div><span className="text-gray-500">Got:</span> <span className="text-rose-300">{r.actual}</span></div>
                                        {r.error && <div><span className="text-gray-500">Error:</span> <span className="text-rose-300">{r.error}</span></div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : executionResult?.status === 'error' ? (
                    <div className="space-y-2">
                        <span className="text-rose-400 font-bold text-sm">⚠ Runtime Error</span>
                        <pre className="text-rose-300 text-[11px] whitespace-pre-wrap bg-rose-500/5 rounded-lg px-3 py-2 border border-rose-500/20">{executionResult.error}</pre>
                    </div>
                ) : executionResult?.status === 'no_runner' ? (
                    <div className="space-y-2">
                        <span className="text-amber-400 font-semibold text-sm">⚠ No Test Runner</span>
                        <p className="text-gray-400 text-[11px]">{executionResult.message}</p>
                    </div>
                ) : (
                    <span className="text-gray-600">Run your code to see results</span>
                )}
            </div>
        </div>
    );

    return (
        <div className={`h-full w-full bg-[#1a1a2e] text-white flex flex-col overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>

            {/* ═══ TOOLBAR ═══ */}
            <div className="h-10 border-b border-white/[0.06] bg-[#1e1e32] flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    {!isFullscreen && (
                        <Link to="/playground/problems" className="flex items-center text-gray-500 hover:text-white transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                    )}
                    <div className="h-3.5 w-px bg-white/[0.08] mx-1 hidden sm:block" />
                    <span className="text-[13px] font-medium text-gray-200 truncate hidden sm:block">{selectedProblem.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-1 ${diffStyle(selectedProblem.difficulty)}`}>
                        {selectedProblem.difficulty}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={handleRunCode} disabled={isRunning}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] rounded-md text-[11px] font-medium text-gray-300 transition-all disabled:opacity-50">
                        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Run
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-md text-[11px] font-bold text-white transition-all">
                        Submit
                    </button>
                    <button onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded transition-colors ml-1 hidden md:flex">
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* ═══ DESKTOP LAYOUT ═══ */}
            <div ref={containerRef} className="flex-1 min-h-0 hidden md:flex flex-row overflow-hidden">
                {/* Left Panel: Description */}
                {!isFullscreen && (
                    <div style={{ width: `${leftPanelWidth}%` }} className="h-full bg-[#1e1e32] flex flex-col min-w-0 flex-shrink-0">
                        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.06] shrink-0 overflow-x-auto no-scrollbar">
                            {leftTabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveLeftTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${activeLeftTab === tab.id ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                                        }`}>
                                    <tab.icon className={`w-3 h-3 ${activeLeftTab === tab.id ? tab.color : ''}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {activeLeftTab === 'description' && (
                                <div className="p-5">
                                    {/* Title + difficulty badge */}
                                    <h2 className="text-lg font-bold text-white mb-1">{selectedProblem.title}</h2>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${diffStyle(selectedProblem.difficulty)}`}>
                                        {selectedProblem.difficulty}
                                    </span>

                                    {/* Description text */}
                                    {localProblem ? (
                                        <div className="mt-4 text-[13px] text-gray-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: '<p>' + markdownToHtml(selectedProblem.description) + '</p>' }} />
                                    ) : (
                                        <div className="mt-4 prose prose-invert prose-sm max-w-none text-gray-300 prose-headings:text-white prose-strong:text-white prose-code:text-orange-300 prose-code:bg-white/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                                            dangerouslySetInnerHTML={{ __html: selectedProblem.description }} />
                                    )}

                                    {/* Examples */}
                                    {selectedProblem.examples?.length > 0 && (
                                        <div className="mt-6 space-y-3">
                                            {selectedProblem.examples.map((ex, i) => (
                                                <div key={i} className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-3">
                                                    <div className="text-[11px] font-semibold text-gray-400 mb-2">Example {i + 1}:</div>
                                                    <div className="space-y-1 text-[12px] font-mono">
                                                        <div><span className="text-gray-500">Input: </span><span className="text-gray-200">{ex.input}</span></div>
                                                        <div><span className="text-gray-500">Output: </span><span className="text-emerald-300">{ex.output}</span></div>
                                                        {ex.explanation && (
                                                            <div className="mt-2 text-[11px] text-gray-400 font-sans"><span className="text-gray-500">Explanation: </span>{ex.explanation}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeLeftTab === 'solutions' && (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-2"><BookOpen className="w-6 h-6 opacity-30" /><span className="text-xs">Solutions coming soon</span></div>
                            )}
                            {activeLeftTab === 'submissions' && (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-2"><History className="w-6 h-6 opacity-30" /><span className="text-xs">No submissions yet</span></div>
                            )}
                        </div>
                    </div>
                )}

                {/* Resize Handle */}
                {!isFullscreen && (
                    <div onMouseDown={handleMouseDown}
                        className="w-[3px] bg-transparent hover:bg-orange-500/50 active:bg-orange-500 transition-colors cursor-col-resize flex-shrink-0 relative group">
                        <div className="absolute inset-y-0 -left-1 -right-1" />
                    </div>
                )}

                {/* Right Panel: Editor + Console */}
                <div className="flex-1 min-w-0 h-full flex flex-col bg-[#1e1e32] overflow-hidden">
                    <div className="flex-1 min-h-0">
                        <CodePlayground wrapped={false} initialCode={editorCode} initialLanguage={editorLanguage}
                            onCodeChange={(val) => setEditorCode(val || '')}
                            onRun={async (code, language) => { if (localProblem?.testRunner?.[language]) return localProblem.testRunner[language](code); }} />
                    </div>
                    {showConsole && consoleContent}
                </div>
            </div>

            {/* ═══ MOBILE LAYOUT ═══ */}
            <div className="flex-1 min-h-0 flex md:hidden flex-col overflow-hidden">
                {/* Mobile tab switcher */}
                <div className="flex border-b border-white/[0.06] shrink-0 bg-[#1e1e32]">
                    <button onClick={() => setMobileView('description')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${mobileView === 'description' ? 'text-white border-b-2 border-orange-500' : 'text-gray-500'}`}>
                        <FileText className="w-3.5 h-3.5" /> Description
                    </button>
                    <button onClick={() => setMobileView('code')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${mobileView === 'code' ? 'text-white border-b-2 border-orange-500' : 'text-gray-500'}`}>
                        <Code className="w-3.5 h-3.5" /> Code
                    </button>
                </div>

                {mobileView === 'description' ? (
                    <div className="flex-1 overflow-y-auto min-h-0 bg-[#1e1e32]">
                        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.06] shrink-0 overflow-x-auto no-scrollbar">
                            {leftTabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveLeftTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${activeLeftTab === tab.id ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                                        }`}>
                                    <tab.icon className={`w-3 h-3 ${activeLeftTab === tab.id ? tab.color : ''}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {activeLeftTab === 'description' && (
                                <div className="p-4">
                                    <h2 className="text-base font-bold text-white mb-1">{selectedProblem.title}</h2>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${diffStyle(selectedProblem.difficulty)}`}>
                                        {selectedProblem.difficulty}
                                    </span>
                                    {localProblem ? (
                                        <div className="mt-3 text-[13px] text-gray-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: '<p>' + markdownToHtml(selectedProblem.description) + '</p>' }} />
                                    ) : (
                                        <div className="mt-3 prose prose-invert prose-sm max-w-none text-gray-300 prose-headings:text-white prose-code:text-orange-300 prose-code:bg-white/[0.06] prose-code:px-1 prose-code:rounded"
                                            dangerouslySetInnerHTML={{ __html: selectedProblem.description }} />
                                    )}
                                    {selectedProblem.examples?.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {selectedProblem.examples.map((ex, i) => (
                                                <div key={i} className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-3">
                                                    <div className="text-[11px] font-semibold text-gray-400 mb-1">Example {i + 1}:</div>
                                                    <div className="space-y-1 text-[12px] font-mono">
                                                        <div><span className="text-gray-500">Input: </span><span className="text-gray-200">{ex.input}</span></div>
                                                        <div><span className="text-gray-500">Output: </span><span className="text-emerald-300">{ex.output}</span></div>
                                                        {ex.explanation && <div className="mt-1 text-[11px] text-gray-400 font-sans"><span className="text-gray-500">Explanation: </span>{ex.explanation}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeLeftTab === 'solutions' && <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-2"><BookOpen className="w-6 h-6 opacity-30" /><span className="text-xs">Coming soon</span></div>}
                            {activeLeftTab === 'submissions' && <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-2"><History className="w-6 h-6 opacity-30" /><span className="text-xs">No submissions yet</span></div>}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0">
                            <CodePlayground wrapped={false} initialCode={editorCode} initialLanguage={editorLanguage}
                                onCodeChange={(val) => setEditorCode(val || '')}
                                onRun={async (code, language) => { if (localProblem?.testRunner?.[language]) return localProblem.testRunner[language](code); }} />
                        </div>
                        {showConsole && consoleContent}
                    </div>
                )}
            </div>

            {/* ═══ STATUS BAR ═══ */}
            <div className="h-6 bg-[#1e1e32] border-t border-white/[0.06] flex items-center justify-between px-3 text-[10px] text-gray-500 shrink-0 select-none">
                <button onClick={() => setShowConsole(!showConsole)} className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
                    <Terminal className="w-3 h-3" />
                    Console
                    <ChevronUp className={`w-3 h-3 transition-transform ${showConsole ? 'rotate-180' : ''}`} />
                </button>
                <span>{selectedProblem.difficulty} • {selectedProblem.id}</span>
            </div>
        </div>
    );
}
