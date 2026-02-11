import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Terminal, Loader2, ChevronDown, Copy, Check, Maximize2, Minimize2, X, ChevronRight, Trash2 } from 'lucide-react';
import { executeJavaScript, executePython, executeTypeScript } from '../../services/clientExecutor';
import { executeCode } from '../../services/piston';

const LANGUAGES = [
    { id: 'javascript', name: 'JavaScript', icon: '⚡', version: 'ES2021', mode: 'client', editorLang: 'javascript', boilerplate: '// JavaScript — runs in your browser\n\nfunction fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log("Fibonacci sequence:");\nfor (let i = 0; i < 10; i++) {\n    console.log(`  fib(${i}) = ${fibonacci(i)}`);\n}' },
    { id: 'python', name: 'Python', icon: '🐍', version: '3.10 (Pyodide)', mode: 'client', editorLang: 'python', boilerplate: '# Python — runs in your browser via WebAssembly\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nprint("Fibonacci sequence:")\nfor i in range(10):\n    print(f"  fib({i}) = {fibonacci(i)}")' },
    { id: 'typescript', name: 'TypeScript', icon: '📘', version: 'Client', mode: 'client', editorLang: 'typescript', boilerplate: '// TypeScript — transpiled & runs in your browser\n\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n\nconst numbers: number[] = [1, 2, 3, 4, 5];\nconst doubled: number[] = numbers.map((n: number) => n * 2);\n\nconsole.log(greet("World"));\nconsole.log("Doubled:", doubled);' },
    { id: 'java', name: 'Java', icon: '☕', version: '15 (Server)', mode: 'server', editorLang: 'java', boilerplate: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n\n        int[] nums = {1, 2, 3, 4, 5};\n        int sum = 0;\n        for (int n : nums) sum += n;\n        System.out.println("Sum: " + sum);\n    }\n}' },
    { id: 'cpp', name: 'C++', icon: '⚙️', version: '17 (Server)', mode: 'server', editorLang: 'cpp', boilerplate: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n\n    vector<int> nums = {1, 2, 3, 4, 5};\n    int sum = 0;\n    for (int n : nums) sum += n;\n    cout << "Sum: " << sum << endl;\n    return 0;\n}' },
    { id: 'c', name: 'C', icon: '🔧', version: 'C17 (Server)', mode: 'server', editorLang: 'c', boilerplate: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n\n    int nums[] = {1, 2, 3, 4, 5};\n    int sum = 0;\n    for (int i = 0; i < 5; i++) sum += nums[i];\n    printf("Sum: %d\\n", sum);\n    return 0;\n}' },
    { id: 'go', name: 'Go', icon: '🐹', version: '1.21 (Server)', mode: 'server', editorLang: 'go', boilerplate: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n\n    nums := []int{1, 2, 3, 4, 5}\n    sum := 0\n    for _, n := range nums {\n        sum += n\n    }\n    fmt.Println("Sum:", sum)\n}' },
    { id: 'rust', name: 'Rust', icon: '🦀', version: '1.73 (Server)', mode: 'server', editorLang: 'rust', boilerplate: 'fn main() {\n    println!("Hello from Rust!");\n\n    let nums = vec![1, 2, 3, 4, 5];\n    let sum: i32 = nums.iter().sum();\n    println!("Sum: {}", sum);\n}' },
];

export default function CodePractice() {
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].boilerplate);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const editorRef = useRef(null);
    const [terminalHistory, setTerminalHistory] = useState([]);
    const [terminalInput, setTerminalInput] = useState('');
    const [cmdHistoryIndex, setCmdHistoryIndex] = useState(-1);
    const [cmdHistory, setCmdHistory] = useState([]);
    const terminalEndRef = useRef(null);
    const terminalInputRef = useRef(null);

    const handleLanguageChange = (lang) => {
        setSelectedLang(lang);
        setCode(lang.boilerplate);
        setOutput('');
        setShowLangMenu(false);
        setStatusMsg('');
        setTerminalHistory([]);
        setTerminalInput('');
        setCmdHistory([]);
        setCmdHistoryIndex(-1);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput('');
        setStatusMsg('Running...');

        // Let React paint the output panel before executing
        await new Promise(r => setTimeout(r, 50));

        try {
            let result;

            if (selectedLang.mode === 'client') {
                if (selectedLang.id === 'javascript') {
                    result = executeJavaScript(code);
                } else if (selectedLang.id === 'python') {
                    result = await executePython(code, (msg) => setStatusMsg(msg));
                } else if (selectedLang.id === 'typescript') {
                    result = executeTypeScript(code);
                }

                if (result) {
                    const timeInfo = `⏱ ${result.executionTime}`;
                    if (result.success) {
                        setOutput(result.output + '\n\n' + timeInfo);
                    } else {
                        setOutput(
                            (result.output ? result.output + '\n' : '') +
                            '❌ ' + result.error + '\n\n' + timeInfo
                        );
                    }
                } else {
                    setOutput('❌ No result returned from executor.');
                }
            } else {
                setStatusMsg('Compiling on server...');
                const langMap = { 'cpp': 'cpp', 'c': 'c', 'java': 'java', 'go': 'go', 'rust': 'rust' };
                try {
                    const pistonResult = await executeCode(langMap[selectedLang.id] || selectedLang.id, code);
                    if (pistonResult?.run) {
                        const stdout = pistonResult.run.stdout || '';
                        const stderr = pistonResult.run.stderr || '';
                        if (stderr) {
                            setOutput(stdout + (stdout ? '\n' : '') + '❌ ' + stderr);
                        } else {
                            setOutput(stdout || '(No output)');
                        }
                    } else {
                        setOutput('❌ Execution failed. Server might be unavailable.\nTry JavaScript or Python for instant local execution.');
                    }
                } catch (serverErr) {
                    setOutput('❌ Server error: ' + serverErr.message + '\nTry JavaScript or Python for instant local execution.');
                }
            }
        } catch (err) {
            setOutput('❌ Error: ' + err.message);
        } finally {
            setIsRunning(false);
            setStatusMsg('');
        }
    };

    const handleReset = () => {
        setCode(selectedLang.boilerplate);
        setOutput('');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Interactive terminal command handler
    const handleTerminalCommand = async (cmd) => {
        if (!cmd.trim()) return;

        // Add to command history
        setCmdHistory(prev => [...prev, cmd]);
        setCmdHistoryIndex(-1);

        const prompt = selectedLang.id === 'python' ? '>>>' : '>';
        setTerminalHistory(prev => [...prev, { type: 'input', text: `${prompt} ${cmd}` }]);

        try {
            let result;
            if (selectedLang.id === 'javascript' || selectedLang.id === 'typescript') {
                result = executeJavaScript(cmd);
            } else if (selectedLang.id === 'python') {
                result = await executePython(cmd, () => { });
            } else {
                setTerminalHistory(prev => [...prev, { type: 'error', text: '⚠ Interactive mode only available for JS, TS, and Python' }]);
                return;
            }

            if (result) {
                const outputText = result.success
                    ? (result.output || '(undefined)')
                    : `❌ ${result.error}`;
                setTerminalHistory(prev => [...prev, { type: result.success ? 'output' : 'error', text: outputText }]);
            }
        } catch (err) {
            setTerminalHistory(prev => [...prev, { type: 'error', text: `❌ ${err.message}` }]);
        }

        setTerminalInput('');
        setTimeout(() => terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const handleTerminalKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTerminalCommand(terminalInput);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length > 0) {
                const newIndex = cmdHistoryIndex === -1 ? cmdHistory.length - 1 : Math.max(0, cmdHistoryIndex - 1);
                setCmdHistoryIndex(newIndex);
                setTerminalInput(cmdHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (cmdHistoryIndex >= 0) {
                const newIndex = cmdHistoryIndex + 1;
                if (newIndex >= cmdHistory.length) {
                    setCmdHistoryIndex(-1);
                    setTerminalInput('');
                } else {
                    setCmdHistoryIndex(newIndex);
                    setTerminalInput(cmdHistory[newIndex]);
                }
            }
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setTerminalHistory([]);
        }
    };

    return (
        <div className={`h-full flex flex-col bg-[#1a1a2e] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>

            {/* Toolbar */}
            <div className="h-11 border-b border-white/[0.06] bg-[#1e1e32] flex items-center justify-between px-3 shrink-0 gap-2">
                {/* Language Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg border border-white/[0.06] text-sm transition-colors"
                    >
                        <span className="text-base leading-none">{selectedLang.icon}</span>
                        <span className="text-gray-200 text-xs font-medium">{selectedLang.name}</span>
                        {selectedLang.mode === 'client' && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-px rounded font-bold">LOCAL</span>
                        )}
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>

                    {showLangMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                            <div className="absolute top-full left-0 mt-1 w-56 bg-[#252542] border border-white/[0.08] rounded-xl shadow-2xl z-50 py-1 max-h-[70vh] overflow-y-auto">
                                <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Client-Side (Instant)</div>
                                {LANGUAGES.filter(l => l.mode === 'client').map(lang => (
                                    <LangOption key={lang.id} lang={lang} selected={selectedLang.id === lang.id} onClick={() => handleLanguageChange(lang)} />
                                ))}
                                <div className="my-1 border-t border-white/[0.06]" />
                                <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Server-Side</div>
                                {LANGUAGES.filter(l => l.mode === 'server').map(lang => (
                                    <LangOption key={lang.id} lang={lang} selected={selectedLang.id === lang.id} onClick={() => handleLanguageChange(lang)} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5">
                    <button onClick={handleCopy} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors" title="Copy code">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={handleReset} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors" title="Reset">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors hidden md:flex" title="Fullscreen">
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="w-px h-5 bg-white/[0.06] mx-0.5" />
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                    >
                        {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isRunning ? 'Running…' : 'Run'}</span>
                    </button>
                </div>
            </div>

            {/* ═══ DESKTOP LAYOUT ═══ */}
            <div className="flex-1 min-h-0 hidden md:flex flex-row overflow-hidden">
                {/* Editor */}
                <div className="flex-1 min-w-0 min-h-0 relative">
                    <Editor
                        height="100%"
                        language={selectedLang.editorLang}
                        value={code}
                        theme="vs-dark"
                        onChange={(val) => setCode(val || '')}
                        onMount={(editor) => { editorRef.current = editor; }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            padding: { top: 16, bottom: 16 },
                            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                            fontLigatures: true,
                            lineNumbers: 'on',
                            renderLineHighlight: 'all',
                            cursorBlinking: 'smooth',
                            smoothScrolling: true,
                            wordWrap: 'off',
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* Terminal Panel — always visible on desktop */}
                <div className="w-[420px] flex-shrink-0 border-l border-white/[0.06] bg-[#0d0d1a] flex flex-col">
                    <div className="h-9 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            <Terminal className="w-3.5 h-3.5" />
                            Terminal
                        </div>
                        <button
                            onClick={() => { setOutput(''); setTerminalHistory([]); }}
                            className="text-[10px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    <OutputContent output={output} isRunning={isRunning} statusMsg={statusMsg}
                        terminalHistory={terminalHistory} terminalInput={terminalInput}
                        setTerminalInput={setTerminalInput} handleTerminalKeyDown={handleTerminalKeyDown}
                        terminalEndRef={terminalEndRef} terminalInputRef={terminalInputRef}
                        selectedLang={selectedLang} setTerminalHistory={setTerminalHistory}
                        showTerminal={selectedLang.mode === 'client'} />
                </div>
            </div>

            {/* ═══ MOBILE LAYOUT ═══ */}
            <div className="flex-1 min-h-0 flex md:hidden flex-col overflow-hidden">
                {/* Editor */}
                <div style={{ height: '60%' }} className="min-h-0 relative">
                    <Editor
                        height="100%"
                        language={selectedLang.editorLang}
                        value={code}
                        theme="vs-dark"
                        onChange={(val) => setCode(val || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            scrollBeyondLastLine: false,
                            padding: { top: 12, bottom: 12 },
                            fontFamily: "'Fira Code', Consolas, monospace",
                            lineNumbers: 'on',
                            renderLineHighlight: 'all',
                            wordWrap: 'on',
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* Terminal Panel — always visible on mobile */}
                <div style={{ height: '40%' }} className="border-t border-white/[0.06] bg-[#0d0d1a] flex flex-col">
                    <div className="h-9 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            <Terminal className="w-3.5 h-3.5" />
                            Terminal
                        </div>
                        <button
                            onClick={() => { setOutput(''); setTerminalHistory([]); }}
                            className="text-[10px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    <OutputContent output={output} isRunning={isRunning} statusMsg={statusMsg}
                        terminalHistory={terminalHistory} terminalInput={terminalInput}
                        setTerminalInput={setTerminalInput} handleTerminalKeyDown={handleTerminalKeyDown}
                        terminalEndRef={terminalEndRef} terminalInputRef={terminalInputRef}
                        selectedLang={selectedLang} setTerminalHistory={setTerminalHistory}
                        showTerminal={selectedLang.mode === 'client'} />
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#1e1e32] border-t border-white/[0.06] flex items-center justify-between px-3 text-[10px] text-gray-500 shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="text-sm leading-none">{selectedLang.icon}</span>
                        {selectedLang.name}
                    </span>
                    <span>•</span>
                    <span>{code.split('\n').length} lines</span>
                    <span>•</span>
                    <span className={`flex items-center gap-1 ${selectedLang.mode === 'client' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedLang.mode === 'client' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {selectedLang.mode === 'client' ? 'Runs locally' : 'Runs on server'}
                    </span>
                </div>
                <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    {isRunning ? (statusMsg || 'Running') : 'Ready'}
                </span>
            </div>
        </div>
    );
}

// Extracted output panel content — shared between desktop and mobile
function OutputContent({ output, isRunning, statusMsg, terminalHistory, terminalInput, setTerminalInput, handleTerminalKeyDown, terminalEndRef, terminalInputRef, selectedLang, setTerminalHistory, showTerminal }) {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Output area */}
            <div className="flex-1 p-4 overflow-auto font-mono text-[13px] leading-relaxed min-h-0">
                {isRunning ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                        <span className="text-xs">{statusMsg || 'Running...'}</span>
                    </div>
                ) : output ? (
                    <pre className={`whitespace-pre-wrap break-words ${output.includes('❌') ? 'text-rose-300' : 'text-gray-200'}`}>
                        {output}
                    </pre>
                ) : !showTerminal ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                        <Terminal className="w-8 h-8 opacity-20" />
                        <span className="text-xs">Click Run to see output</span>
                    </div>
                ) : null}

                {/* Interactive Terminal */}
                {showTerminal && !isRunning && (
                    <div className="mt-2">
                        {/* Terminal history */}
                        {terminalHistory.map((entry, i) => (
                            <div key={i} className={`text-[13px] leading-relaxed ${entry.type === 'input' ? 'text-blue-400' :
                                entry.type === 'error' ? 'text-rose-300' : 'text-gray-200'
                                }`}>
                                <pre className="whitespace-pre-wrap break-words">{entry.text}</pre>
                            </div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                )}
            </div>

            {/* Interactive input line */}
            {showTerminal && !isRunning && (
                <div className="border-t border-white/[0.06] bg-[#0a0a18] px-3 py-2 flex items-center gap-2 shrink-0">
                    <span className="text-emerald-400 text-xs font-mono font-bold">
                        {selectedLang?.id === 'python' ? '>>>' : '>'}
                    </span>
                    <input
                        ref={terminalInputRef}
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={handleTerminalKeyDown}
                        placeholder={`Type ${selectedLang?.name || ''} expression...`}
                        className="flex-1 bg-transparent text-gray-200 text-[13px] font-mono outline-none placeholder-gray-600 caret-emerald-400"
                        spellCheck={false}
                        autoComplete="off"
                    />
                    <button
                        onClick={() => setTerminalHistory([])}
                        className="p-1 text-gray-600 hover:text-gray-300 transition-colors"
                        title="Clear terminal (Ctrl+L)"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

// Language dropdown item
function LangOption({ lang, selected, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.06] transition-colors ${selected ? 'bg-white/[0.04]' : ''}`}
        >
            <span className="text-lg leading-none">{lang.icon}</span>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-200">{lang.name}</div>
                <div className="text-[10px] text-gray-500">{lang.version}</div>
            </div>
            {selected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        </button>
    );
}
