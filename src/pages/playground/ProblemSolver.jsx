import { useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
    FileText, ChevronLeft, History, BookOpen, Play, Loader2, X,
    Maximize2, Minimize2, Terminal, ChevronUp, Code, Lightbulb,
    AlertCircle, CheckCircle, Clock, Zap, Settings, ChevronDown,
    ThumbsUp, ThumbsDown, ExternalLink
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { leetcodeService } from '../../services/leetcode';
import { getCachedProblemDetails, cacheProblemDetails } from '../../services/problemCacheService';
import { PROBLEMS } from '../../data/problems';
import { executeCode, LANGUAGE_CONFIG, getSupportedLanguages } from '../../services/piston';
import { runTests, generateTestCasesFromExamples, extractFunctionName } from '../../services/testRunner';

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp'];

function markdownToHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n(\d+)\./g, '<br/>$1.')
        .replace(/\n/g, '<br/>');
}

export default function ProblemSolver() {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    const [activeLeftTab, setActiveLeftTab] = useState('description');
    const [leftPanelWidth, setLeftPanelWidth] = useState(42);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showConsole, setShowConsole] = useState(true);
    const [activeConsoleTab, setActiveConsoleTab] = useState('testcase');
    const [mobileView, setMobileView] = useState('description');

    const [selectedProblem, setSelectedProblem] = useState(null);
    const [localProblem, setLocalProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editorCode, setEditorCode] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('javascript');
    const [executionResult, setExecutionResult] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [currentHintIndex, setCurrentHintIndex] = useState(0);
    const [customTestInput, setCustomTestInput] = useState('');
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    const languages = getSupportedLanguages().filter(l => SUPPORTED_LANGUAGES.includes(l.id));

    useEffect(() => {
        if (!problemId) return;
        (async () => {
            setLoading(true);
            try {
                const local = PROBLEMS.find(p => p.id === problemId);
                setLocalProblem(local || null);

                if (local) {
                    setSelectedProblem({
                        id: problemId,
                        title: local.title,
                        difficulty: local.difficulty,
                        description: local.description,
                        examples: local.examples,
                        constraints: local.constraints || [],
                        hints: local.hints || [],
                        tags: local.tags || [],
                        starterCode: local.starterCode || {},
                    });
                    setEditorLanguage('javascript');
                    setEditorCode(local.starterCode?.javascript || '');
                    return;
                }

                const cached = await getCachedProblemDetails(problemId);
                if (cached && cached.hasDetails) {
                    const starterCode = cached.starterCode || {};
                    const availableLangs = Object.keys(starterCode);
                    const defaultLang = availableLangs.includes('javascript') ? 'javascript' 
                        : availableLangs.includes('python') ? 'python' 
                        : availableLangs[0] || 'javascript';
                    
                    setSelectedProblem({
                        id: problemId,
                        title: cached.title,
                        difficulty: cached.difficulty,
                        description: cached.description || 'No description available.',
                        examples: cached.examples || [],
                        exampleTestcases: cached.exampleTestcases || [],
                        constraints: cached.constraints || [],
                        hints: cached.hints || [],
                        tags: cached.topicTags || [],
                        starterCode,
                        likes: cached.likes || 0,
                        dislikes: cached.dislikes || 0,
                    });
                    setEditorLanguage(defaultLang);
                    setEditorCode(starterCode[defaultLang] || '');
                    return;
                }

                const data = await leetcodeService.getProblemDetails(problemId);
                if (data) {
                    const starterCode = data.starterCode || {};
                    const availableLangs = Object.keys(starterCode).filter(k => starterCode[k]);
                    const defaultLang = availableLangs.includes('javascript') ? 'javascript' 
                        : availableLangs.includes('python') ? 'python' 
                        : availableLangs[0] || 'javascript';

                    setSelectedProblem({
                        id: problemId,
                        title: data.title || problemId.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' '),
                        difficulty: data.difficulty || 'Medium',
                        description: data.description || 'No description available.',
                        examples: data.examples || [],
                        exampleTestcases: data.exampleTestcases || [],
                        constraints: data.constraints || [],
                        hints: data.hints || [],
                        tags: data.topicTags || [],
                        starterCode,
                        likes: data.likes || 0,
                        dislikes: data.dislikes || 0,
                    });
                    setEditorLanguage(defaultLang);
                    setEditorCode(starterCode[defaultLang] || '// Write your solution here');
                } else {
                    setSelectedProblem({
                        id: problemId,
                        title: problemId.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' '),
                        difficulty: 'Medium',
                        description: 'Problem details could not be loaded. Please try again later.',
                        examples: [],
                        constraints: [],
                        hints: [],
                        tags: [],
                        starterCode: {},
                    });
                    setEditorLanguage('javascript');
                    setEditorCode('// Write your solution here');
                }
            } catch (err) {
                console.error("Error loading problem", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [problemId]);

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

    const handleLanguageChange = (langId) => {
        setEditorLanguage(langId);
        setShowLanguageDropdown(false);
        
        const starterCode = localProblem?.starterCode || selectedProblem?.starterCode || {};
        if (starterCode[langId]) {
            setEditorCode(starterCode[langId]);
        }
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setShowConsole(true);
        setActiveConsoleTab('result');
        setExecutionResult({ status: 'running' });
        setTestResults(null);

        try {
            let testCases = null;
            let functionName = null;
            
            if (localProblem?.testCases && localProblem?.functionName) {
                testCases = localProblem.testCases;
                functionName = localProblem.functionName;
            } else if (selectedProblem?.exampleTestcases?.length > 0) {
                testCases = selectedProblem.exampleTestcases;
                functionName = extractFunctionName(editorCode, editorLanguage);
            } else if (selectedProblem?.examples && selectedProblem.examples.length > 0) {
                testCases = generateTestCasesFromExamples(selectedProblem.examples);
                functionName = extractFunctionName(editorCode, editorLanguage);
            }

            if (testCases && testCases.length > 0 && functionName) {
                const result = await runTests(
                    editorLanguage,
                    editorCode,
                    functionName,
                    testCases
                );

                if (result.success && result.results) {
                    const passed = result.results.filter(r => r.passed).length;
                    const total = result.results.length;
                    const allPassed = passed === total && total > 0;

                    setTestResults(result.results);
                    setExecutionResult({
                        status: allPassed ? 'accepted' : 'wrong_answer',
                        runtime: result.results[0]?.runtime || 'N/A',
                        passed,
                        total,
                    });
                } else {
                    setExecutionResult({
                        status: 'error',
                        error: result.error || 'Failed to run tests',
                    });
                }
            } else {
                const result = await executeCode(editorLanguage, editorCode);
                
                if (result.success) {
                    setTestResults(null);
                    setExecutionResult({
                        status: 'completed',
                        output: result.output,
                        stdout: result.stdout,
                        stderr: result.stderr,
                    });
                } else {
                    setExecutionResult({
                        status: 'error',
                        error: result.error,
                    });
                }
            }
        } catch (err) {
            setExecutionResult({
                status: 'error',
                error: err.message,
            });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        let testCases = null;
        let functionName = null;
        
        if (localProblem?.testCases && localProblem?.functionName) {
            testCases = localProblem.testCases;
            functionName = localProblem.functionName;
        } else if (selectedProblem?.exampleTestcases?.length > 0) {
            testCases = selectedProblem.exampleTestcases;
            functionName = extractFunctionName(editorCode, editorLanguage);
        } else if (selectedProblem?.examples && selectedProblem.examples.length > 0) {
            testCases = generateTestCasesFromExamples(selectedProblem.examples);
            functionName = extractFunctionName(editorCode, editorLanguage);
        }

        if (!testCases || testCases.length === 0) {
            setExecutionResult({
                status: 'error',
                error: 'No test cases available for this problem.',
            });
            setShowConsole(true);
            setActiveConsoleTab('result');
            return;
        }

        setIsSubmitting(true);
        setShowConsole(true);
        setActiveConsoleTab('result');
        setExecutionResult({ status: 'running' });

        try {
            const result = await runTests(
                editorLanguage,
                editorCode,
                functionName,
                testCases
            );

            if (result.success && result.results) {
                const passed = result.results.filter(r => r.passed).length;
                const total = result.results.length;
                const allPassed = passed === total && total > 0;

                setTestResults(result.results);
                setExecutionResult({
                    status: allPassed ? 'accepted' : 'wrong_answer',
                    runtime: result.results[0]?.runtime || 'N/A',
                    passed,
                    total,
                    isSubmit: true,
                });
            } else {
                setExecutionResult({
                    status: 'error',
                    error: result.error || 'Submission failed',
                });
            }
        } catch (err) {
            setExecutionResult({
                status: 'error',
                error: err.message,
            });
        } finally {
            setIsSubmitting(false);
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

    const consoleContent = (
        <div className="h-[260px] border-t border-white/[0.06] bg-[#0d0d1a] flex flex-col shrink-0">
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
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider">Test Cases</span>
                        </div>
                        {localProblem?.testCases?.length > 0 ? (
                            localProblem.testCases.map((tc, i) => (
                                <div key={i} className="bg-white/[0.04] rounded-md px-3 py-2 text-gray-300 border border-white/[0.06]">
                                    <span className="text-gray-500 text-[9px]">Case {i + 1}:</span>
                                    <div className="mt-1 text-[11px]">
                                        <span className="text-gray-500">Input: </span>
                                        <span className="text-orange-300">{JSON.stringify(tc.input)}</span>
                                    </div>
                                    <div className="text-[11px]">
                                        <span className="text-gray-500">Expected: </span>
                                        <span className="text-emerald-300">{JSON.stringify(tc.expected)}</span>
                                    </div>
                                </div>
                            ))
                        ) : selectedProblem?.examples?.length > 0 ? (
                            selectedProblem.examples.map((ex, i) => (
                                <div key={i} className="bg-white/[0.04] rounded-md px-3 py-2 text-gray-300 border border-white/[0.06]">
                                    <span className="text-gray-500 text-[9px]">Example {i + 1}:</span>
                                    <div className="mt-0.5">{ex.input}</div>
                                    <div className="text-emerald-400/70 mt-1">→ {ex.output}</div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/[0.04] rounded-md px-3 py-2 text-gray-300 border border-white/[0.06]">
                                No test cases available
                            </div>
                        )}
                    </div>
                ) : executionResult?.status === 'running' ? (
                    <div className="flex items-center text-gray-400 gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> 
                        {isSubmitting ? 'Submitting...' : 'Running test cases...'}
                    </div>
                ) : executionResult?.status === 'accepted' ? (
                    <div className="space-y-3">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${executionResult.isSubmit ? 'bg-emerald-500/10 border border-emerald-500/30' : ''}`}>
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <div>
                                <span className="text-emerald-400 font-bold text-sm">
                                    {executionResult.isSubmit ? 'Accepted' : 'All Test Cases Passed'}
                                </span>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                    {executionResult.passed}/{executionResult.total} passed • Runtime: {executionResult.runtime}ms
                                </div>
                            </div>
                        </div>
                        {testResults?.map((r, i) => (
                            <div key={i} className={`rounded-lg px-3 py-2 border ${r.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                <div className={`text-[11px] font-semibold ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    Test {i + 1}: {r.passed ? 'PASSED ✓' : 'FAILED ✗'}
                                    {r.runtime && <span className="text-gray-500 ml-2">{r.runtime}ms</span>}
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
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                            <div>
                                <span className="text-rose-400 font-bold text-sm">Wrong Answer</span>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                    {executionResult.passed}/{executionResult.total} test cases passed
                                </div>
                            </div>
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
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                            <span className="text-rose-400 font-bold text-sm">Runtime Error</span>
                        </div>
                        <pre className="text-rose-300 text-[11px] whitespace-pre-wrap bg-rose-500/5 rounded-lg px-3 py-2 border border-rose-500/20">{executionResult.error}</pre>
                    </div>
                ) : executionResult?.status === 'completed' ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                            <CheckCircle className="w-4 h-4" /> Execution Completed
                        </div>
                        <pre className="text-gray-300 text-[11px] whitespace-pre-wrap bg-white/[0.03] rounded-lg px-3 py-2">
                            {executionResult.stdout}
                            {executionResult.stderr && <span className="text-rose-400">{executionResult.stderr}</span>}
                        </pre>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <Terminal className="w-6 h-6 mb-2" />
                        <span>Run your code to see results</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`h-full w-full bg-[#1a1a2e] text-white flex flex-col overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>

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
                    <button onClick={handleRunCode} disabled={isRunning || isSubmitting}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-md text-[11px] font-medium text-gray-300 transition-all disabled:opacity-50 border border-white/[0.08]">
                        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Run
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isRunning || isSubmitting}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-md text-[11px] font-bold text-white transition-all disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Submit
                    </button>
                    <button onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded transition-colors ml-1 hidden md:flex">
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="flex-1 min-h-0 hidden md:flex flex-row overflow-hidden">
                {!isFullscreen && (
                    <div style={{ width: `${leftPanelWidth}%` }} className="h-full bg-[#1e1e32] flex flex-col min-w-0 flex-shrink-0">
                        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.06] shrink-0 overflow-x-auto no-scrollbar">
                            {leftTabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveLeftTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${activeLeftTab === tab.id ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}>
                                    <tab.icon className={`w-3 h-3 ${activeLeftTab === tab.id ? tab.color : ''}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {activeLeftTab === 'description' && (
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h2 className="text-lg font-bold text-white">{selectedProblem.title}</h2>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${diffStyle(selectedProblem.difficulty)}`}>
                                            {selectedProblem.difficulty}
                                        </span>
                                        {selectedProblem.tags?.map((tag, i) => (
                                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400">
                                                {tag.name || tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-4 prose prose-invert prose-sm max-w-none text-gray-300 prose-headings:text-white prose-strong:text-white prose-code:text-orange-300 prose-code:bg-white/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                                        dangerouslySetInnerHTML={{ __html: selectedProblem.description || 'No description available.' }} />

                                    {selectedProblem.constraints?.length > 0 && (
                                        <div className="mt-6">
                                            <div className="text-[11px] font-semibold text-gray-400 mb-2">Constraints:</div>
                                            <ul className="space-y-1">
                                                {selectedProblem.constraints.map((c, i) => (
                                                    <li key={i} className="text-[12px] text-gray-400 font-mono flex items-start gap-2">
                                                        <span className="text-orange-500">•</span>
                                                        <span dangerouslySetInnerHTML={{ __html: c.replace(/`([^`]+)`/g, '<code class="text-orange-300 bg-white/[0.06] px-1 rounded">$1</code>') }} />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {selectedProblem.examples?.length > 0 && (
                                        <div className="mt-6 space-y-3">
                                            <div className="text-[11px] font-semibold text-gray-400">Examples:</div>
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

                                    {selectedProblem.hints?.length > 0 && (
                                        <div className="mt-6">
                                            <button 
                                                onClick={() => setShowHints(!showHints)}
                                                className="flex items-center gap-2 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                                            >
                                                <Lightbulb className="w-3.5 h-3.5" />
                                                {showHints ? 'Hide Hints' : 'Show Hints'}
                                            </button>
                                            {showHints && (
                                                <div className="mt-3 space-y-2">
                                                    {selectedProblem.hints.map((hint, i) => (
                                                        <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 text-[11px] text-amber-200/80">
                                                            <span className="text-amber-400 font-semibold">Hint {i + 1}:</span> {hint}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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

                {!isFullscreen && (
                    <div onMouseDown={handleMouseDown}
                        className="w-[3px] bg-transparent hover:bg-orange-500/50 active:bg-orange-500 transition-colors cursor-col-resize flex-shrink-0 relative group">
                        <div className="absolute inset-y-0 -left-1 -right-1" />
                    </div>
                )}

                <div className="flex-1 min-w-0 h-full flex flex-col bg-[#1e1e32] overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-[#1a1a2e]">
                        <div className="relative">
                            <button 
                                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                className="flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium text-gray-300 hover:bg-white/[0.06] transition-colors"
                            >
                                <Code className="w-3.5 h-3.5 text-orange-400" />
                                {LANGUAGE_CONFIG[editorLanguage]?.displayName || editorLanguage}
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                            </button>
                            {showLanguageDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-[#1e1e32] border border-white/[0.1] rounded-lg shadow-xl z-50 min-w-[140px]">
                                    {languages.map(lang => (
                                        <button
                                            key={lang.id}
                                            onClick={() => handleLanguageChange(lang.id)}
                                            className={`w-full text-left px-3 py-2 text-[11px] hover:bg-white/[0.06] transition-colors first:rounded-t-lg last:rounded-b-lg ${editorLanguage === lang.id ? 'text-orange-400 bg-white/[0.04]' : 'text-gray-300'}`}
                                        >
                                            {lang.displayName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <Clock className="w-3 h-3" />
                            Powered by Piston
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language={editorLanguage === 'cpp' ? 'cpp' : editorLanguage}
                            value={editorCode}
                            theme="vs-dark"
                            onChange={(val) => setEditorCode(val || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                padding: { top: 12, bottom: 12 },
                                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                                fontLigatures: true,
                                tabSize: 4,
                                automaticLayout: true,
                                lineNumbers: 'on',
                                renderLineHighlight: 'line',
                                cursorBlinking: 'smooth',
                                smoothScrolling: true,
                            }}
                        />
                    </div>
                    {showConsole && consoleContent}
                </div>
            </div>

            <div className="flex-1 min-h-0 flex md:hidden flex-col overflow-hidden">
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
                        <div className="p-4">
                            <h2 className="text-base font-bold text-white mb-1">{selectedProblem.title}</h2>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${diffStyle(selectedProblem.difficulty)}`}>
                                {selectedProblem.difficulty}
                            </span>
                            <div className="mt-3 prose prose-invert prose-sm max-w-none text-gray-300"
                                dangerouslySetInnerHTML={{ __html: selectedProblem.description || 'No description available.' }} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0">
                            <Editor
                                height="100%"
                                language={editorLanguage === 'cpp' ? 'cpp' : editorLanguage}
                                value={editorCode}
                                theme="vs-dark"
                                onChange={(val) => setEditorCode(val || '')}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    scrollBeyondLastLine: false,
                                    padding: { top: 12, bottom: 12 },
                                }}
                            />
                        </div>
                        {showConsole && consoleContent}
                    </div>
                )}
            </div>

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
