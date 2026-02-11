
import { useState, useCallback, useEffect, useRef } from 'react';
import CodePlayground from '../components/CodePlayground';
import { FileText, Settings, Share2, ChevronLeft, Lightbulb, History, BookOpen, List, CheckCircle, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PROBLEMS } from '../data/problems';

export default function PlaygroundPage() {
    const [activeLeftTab, setActiveLeftTab] = useState('problems'); // problems, description
    const [leftPanelWidth, setLeftPanelWidth] = useState(40); // percentage
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    const [selectedProblem, setSelectedProblem] = useState(null);

    // Editor State
    const [editorCode, setEditorCode] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('python');

    // Load problem code when selected
    useEffect(() => {
        if (selectedProblem) {
            setActiveLeftTab('description');
            // Default to Python or keep current if valid
            setEditorCode(selectedProblem.starterCode[editorLanguage] || selectedProblem.starterCode['python']);
            if (!selectedProblem.starterCode[editorLanguage]) setEditorLanguage('python');
        }
    }, [selectedProblem]);

    const handleProblemSelect = (problem) => {
        setSelectedProblem(problem);
    };

    const handleMouseDown = useCallback((e) => {
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
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
        setLeftPanelWidth(clampedWidth);
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div className="h-screen w-full bg-gray-950 text-white flex flex-col overflow-hidden font-sans">
            {/* 1. Header */}
            <header className="h-12 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/courses" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="font-semibold text-sm">Course List</span>
                    </Link>
                    <div className="h-4 w-px bg-gray-700 mx-2" />
                    <h1 className="font-medium text-sm text-gray-200">
                        {selectedProblem ? `Problem: ${selectedProblem.title}` : 'Independent Coding Practice'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium text-gray-300 transition-colors">
                        <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500/20">
                        U
                    </div>
                </div>
            </header>

            {/* 2. Main Workspace */}
            <div ref={containerRef} className="flex-1 flex min-h-0 relative">

                {/* LEFT PANEL */}
                <div style={{ width: `${leftPanelWidth}%` }} className="bg-gray-900 border-r border-gray-800 flex flex-col min-w-[250px] transition-none">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-2 bg-gray-900 border-b border-gray-800 overflow-x-auto no-scrollbar shrink-0">
                        <button
                            onClick={() => setActiveLeftTab('problems')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeLeftTab === 'problems' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <List className="w-3.5 h-3.5" /> Problems
                        </button>
                        {selectedProblem && (
                            <button
                                onClick={() => setActiveLeftTab('description')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeLeftTab === 'description' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <FileText className="w-3.5 h-3.5 text-blue-500" /> Description
                            </button>
                        )}
                        <button
                            onClick={() => setActiveLeftTab('submissions')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeLeftTab === 'submissions' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <History className="w-3.5 h-3.5 text-gray-400" /> Submissions
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-[#1a1a1a]">

                        {/* PROBLEM LIST View */}
                        {activeLeftTab === 'problems' && (
                            <div className="divide-y divide-gray-800">
                                {PROBLEMS.map(problem => (
                                    <button
                                        key={problem.id}
                                        onClick={() => handleProblemSelect(problem)}
                                        className={`w-full text-left p-4 hover:bg-gray-800 transition-colors group ${selectedProblem?.id === problem.id ? 'bg-gray-800/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-medium ${selectedProblem?.id === problem.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                {problem.title}
                                            </h3>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${problem.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' :
                                                    problem.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                                        'bg-red-900/30 text-red-400'
                                                }`}>
                                                {problem.difficulty}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* DESCRIPTION View */}
                        {activeLeftTab === 'description' && selectedProblem && (
                            <div className="p-6 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-white">{selectedProblem.title}</h2>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${selectedProblem.difficulty === 'Easy' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                                            {selectedProblem.difficulty}
                                        </span>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                                        <p className="whitespace-pre-wrap leading-relaxed">{selectedProblem.description}</p>
                                    </div>
                                </div>

                                {/* Examples */}
                                <div className="space-y-4">
                                    {selectedProblem.examples.map((ex, idx) => (
                                        <div key={idx} className="bg-gray-800/50 rounded-lg p-3 text-sm">
                                            <p className="text-white font-semibold mb-2">Example {idx + 1}:</p>
                                            <div className="space-y-1 pl-2 border-l-2 border-gray-700">
                                                <p><span className="text-gray-400">Input:</span> <code className="text-gray-200 bg-gray-800 px-1 rounded">{ex.input}</code></p>
                                                <p><span className="text-gray-400">Output:</span> <code className="text-gray-200 bg-gray-800 px-1 rounded">{ex.output}</code></p>
                                                {ex.explanation && <p className="text-gray-500 italic text-xs mt-1">Explanation: {ex.explanation}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty States */}
                        {activeLeftTab === 'description' && !selectedProblem && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 text-sm">
                                <List className="w-8 h-8 mb-2 opacity-50" />
                                <p>Select a problem from the list</p>
                            </div>
                        )}
                        {activeLeftTab === 'submissions' && (
                            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                                <History className="w-8 h-8 mb-2 opacity-50" />
                                <p>No submissions yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RESIZE HANDLE */}
                <div
                    onMouseDown={handleMouseDown}
                    className="w-1.5 bg-gray-950 hover:bg-blue-600 transition-colors cursor-col-resize active:bg-blue-600 flex flex-col justify-center items-center z-10 border-x border-gray-800"
                >
                    <div className="h-8 w-0.5 bg-gray-700/50 rounded-full" />
                </div>

                {/* RIGHT PANEL: Code Editor */}
                <div className="flex-1 min-w-[300px] flex flex-col bg-gray-900 overflow-hidden">
                    <CodePlayground
                        wrapped={false}
                        initialCode={editorCode}
                        initialLanguage={editorLanguage}
                    />
                </div>
            </div>

            {/* 3. Status Bar */}
            <div className="h-6 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-3 text-xs text-gray-500 shrink-0 select-none">
                <div className="flex items-center gap-4">
                    <span className="hover:text-gray-300 cursor-pointer">Console</span>
                    {selectedProblem && <span className="text-gray-400">Problem ID: {selectedProblem.id}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Ready</span>
                </div>
            </div>
        </div>
    );
}
