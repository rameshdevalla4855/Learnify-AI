import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Code as CodeIcon, Eye, Terminal, Loader2, ChevronDown, Check, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { executeCode } from '../services/piston';

const LANGUAGES = [
    { id: 'html', name: 'HTML', mode: 'web' },
    { id: 'css', name: 'CSS', mode: 'web' },
    { id: 'js', name: 'JavaScript', mode: 'web' },
    { id: 'python', name: 'Python', mode: 'compiler' },
    { id: 'java', name: 'Java', mode: 'compiler' },
    { id: 'c', name: 'C', mode: 'compiler' },
    { id: 'cpp', name: 'C++', mode: 'compiler' },
];

export default function CodePlayground({ wrapped = true, initialCode = '', initialLanguage = 'python', onCodeChange, testRunner, onRun }) {
    const [mode, setMode] = useState('web'); // 'web' or 'compiler'
    const [activeTab, setActiveTab] = useState(initialLanguage); // html, css, js, python, java, c, cpp

    // Web State
    const [html, setHtml] = useState('<h1>Hello World</h1>\n<p>Start coding!</p>');
    const [css, setCss] = useState('body {\n  font-family: sans-serif;\n  padding: 20px;\n}\nh1 {\n  color: #3b82f6;\n}');
    const [js, setJs] = useState('console.log("Hello from JS!");');
    const [webOutput, setWebOutput] = useState('');

    // Compiler State
    const [code, setCode] = useState(initialCode);
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [showOutput, setShowOutput] = useState(true);

    // Initial Defaults (Boilerplates)
    const defaults = {
        python: 'print("Hello from Python!")\n\ndef greet(name):\n    return f"Nice to meet you, {name}"\n\nprint(greet("Student"))',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}',
        c: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}',
        cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}'
    };

    // Update code when initialCode prop changes (for Problem selection)
    useEffect(() => {
        if (initialCode) {
            setCode(initialCode);
            setActiveTab(initialLanguage);
            const langMode = LANGUAGES.find(l => l.id === initialLanguage)?.mode || 'compiler';
            setMode(langMode);
        }
    }, [initialCode, initialLanguage]);

    // Update local setCode if initialCode updates while typing? No, that would overwrite user.
    // We only update if `initialCode` specifically changes identity (new problem loaded).

    // Auto-run Web Code
    useEffect(() => {
        if (mode !== 'web') return;

        const timeout = setTimeout(() => {
            const srcDoc = `
                <html>
                    <head>
                        <style>${css}</style>
                    </head>
                    <body>
                        ${html}
                        <script>
                            try {
                                ${js}
                            } catch (err) {
                                console.error(err);
                            }
                        </script>
                    </body>
                </html>
            `;
            setWebOutput(srcDoc);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [html, css, js, mode]);

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        const newMode = LANGUAGES.find(l => l.id === newLang)?.mode || 'compiler';

        setActiveTab(newLang);
        setMode(newMode);

        // Load boilerplate if code is empty or we are switching compiler languages
        if (newMode === 'compiler') {
            if (!code || (activeTab !== newLang && !initialCode)) {
                setCode(defaults[newLang] || '');
            }
        }
    };

    const runCompiler = async () => {
        setIsRunning(true);
        setShowOutput(true);
        setConsoleOutput('Running...\n');

        try {
            // Priority 1: If parent provided onRun (e.g., ProblemSolver with testRunner)
            if (onRun) {
                const results = await onRun(code, activeTab);
                // ProblemSolver will return formatted string or we handle it here
                if (typeof results === 'string') {
                    setConsoleOutput(results);
                } else if (Array.isArray(results)) {
                    // Format test results
                    const passedCount = results.filter(r => r.passed).length;
                    const totalCount = results.length;
                    let output = `To Test Cases: ${passedCount}/${totalCount} Passed\n\n`;

                    results.forEach((r, i) => {
                        output += `Test Case ${i + 1}: ${r.passed ? 'PASSED ✅' : 'FAILED ❌'}\n`;
                        if (!r.passed) {
                            output += `   Input: ${r.input}\n`;
                            output += `   Expected: ${r.expected}\n`;
                            output += `   Actual: ${r.actual}\n`;
                            if (r.error) output += `   Error: ${r.error}\n`;
                        }
                        output += '\n';
                    });
                    setConsoleOutput(output);
                }
            }
            // Priority 2: Standard Piston Execution
            else if (mode === 'compiler') {
                const result = await executeCode(activeTab, code);
                if (result.run) {
                    setConsoleOutput(result.run.stdout + (result.run.stderr ? '\nError:\n' + result.run.stderr : ''));
                } else {
                    setConsoleOutput('Execution failed. Service might be unavailable.');
                }
            }
        } catch (err) {
            setConsoleOutput('Error: ' + err.message);
        } finally {
            setIsRunning(false);
        }
    };

    const handleCodeUpdate = (val) => {
        if (mode === 'web') {
            if (activeTab === 'html') setHtml(val);
            else if (activeTab === 'css') setCss(val);
            else setJs(val);
        } else {
            setCode(val);
            if (onCodeChange) onCodeChange(val);
        }
    };

    return (
        <div className={`flex flex-col h-full bg-gray-900 overflow-hidden ${wrapped ? 'border border-gray-800 rounded-xl shadow-2xl' : ''}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 min-h-[50px]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <CodeIcon className="w-5 h-5 text-primary-400" />
                        <span className="font-bold text-gray-200 text-sm hidden sm:block">Playground</span>
                    </div>

                    {/* Language Dropdown */}
                    <div className="relative group">
                        <select
                            value={activeTab}
                            onChange={handleLanguageChange}
                            className="appearance-none bg-gray-900 text-white text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer transition-colors"
                        >
                            <optgroup label="Web Development">
                                {LANGUAGES.filter(l => l.mode === 'web').map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Programming">
                                {LANGUAGES.filter(l => l.mode === 'compiler').map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </optgroup>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowOutput(!showOutput)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                        title={showOutput ? 'Hide output' : 'Show output'}
                    >
                        {showOutput ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    </button>
                    {mode === 'compiler' && (
                        <button
                            onClick={runCompiler}
                            disabled={isRunning}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-md text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-900/20"
                        >
                            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            RUN
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Editor Section */}
                <div className={`${showOutput ? 'flex-1' : 'w-full'} min-h-[300px] md:min-h-0 ${showOutput ? 'border-b md:border-b-0 md:border-r border-gray-700' : ''} relative`}>
                    <Editor
                        height="100%"
                        language={activeTab === 'js' ? 'javascript' : activeTab === 'c' ? 'c' : activeTab}
                        value={mode === 'web' ? (activeTab === 'html' ? html : activeTab === 'css' ? css : js) : code}
                        theme="vs-dark"
                        onChange={handleCodeUpdate}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            padding: { top: 16, bottom: 16 },
                            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                            fontLigatures: true,
                        }}
                    />
                </div>

                {/* Output Section — toggleable */}
                {showOutput && (
                    <div className="flex-1 bg-[#1e1e1e] border-l border-gray-700 relative flex flex-col min-w-[30%]">
                        {mode === 'web' ? (
                            <>
                                <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        <Eye className="w-3.5 h-3.5" /> PREVIEW
                                    </div>
                                    <button onClick={() => setShowOutput(false)} className="p-0.5 text-gray-500 hover:text-white transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <iframe
                                    srcDoc={webOutput}
                                    title="output"
                                    sandbox="allow-scripts"
                                    frameBorder="0"
                                    width="100%"
                                    height="100%"
                                    className="flex-1 bg-white"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        <Terminal className="w-3.5 h-3.5" /> CONSOLE
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setConsoleOutput('')}
                                            className="text-[10px] text-gray-500 hover:text-white transition-colors"
                                        >
                                            Clear
                                        </button>
                                        <button onClick={() => setShowOutput(false)} className="p-0.5 text-gray-500 hover:text-white transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 font-mono text-sm overflow-auto custom-scrollbar">
                                    {consoleOutput ? (
                                        <pre className={`whitespace-pre-wrap ${consoleOutput.includes('Examples') ? 'text-blue-300' : consoleOutput.includes('Error') || consoleOutput.includes('FAILED') ? 'text-red-400' : 'text-gray-300'}`}>
                                            {consoleOutput}
                                        </pre>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                                            <CodeIcon className="w-8 h-8" />
                                            <p className="text-xs">Run code to see output</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
