import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Code as CodeIcon, Eye, Terminal, Loader2 } from 'lucide-react';
import { executeCode } from '../services/piston';

export default function CodePlayground() {
    const [mode, setMode] = useState('web'); // 'web' or 'compiler'
    const [activeTab, setActiveTab] = useState('html'); // html, css, js (for web) OR python, java, c (for compiler)

    // Web State
    const [html, setHtml] = useState('<h1>Hello World</h1>\n<p>Start coding!</p>');
    const [css, setCss] = useState('body {\n  font-family: sans-serif;\n  padding: 20px;\n}\nh1 {\n  color: #3b82f6;\n}');
    const [js, setJs] = useState('console.log("Hello from JS!");');
    const [webOutput, setWebOutput] = useState('');

    // Compiler State
    const [code, setCode] = useState('');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // Initial Defaults
    const defaults = {
        python: 'print("Hello from Python!")\n\ndef greet(name):\n    return f"Nice to meet you, {name}"\n\nprint(greet("Student"))',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}',
        c: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}'
    };

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

    const handleModeSwitch = (newLang) => {
        if (['html', 'css', 'js'].includes(newLang)) {
            setMode('web');
            setActiveTab(newLang);
        } else {
            setMode('compiler');
            setActiveTab(newLang);
            if (!code || (activeTab !== newLang)) { // Load default only if switching language
                setCode(defaults[newLang]);
            }
        }
    };

    const runCompiler = async () => {
        if (mode === 'web') return;

        setIsRunning(true);
        setConsoleOutput('Running...');
        try {
            const result = await executeCode(activeTab, code);
            if (result.run) {
                setConsoleOutput(result.run.stdout + (result.run.stderr ? '\nError:\n' + result.run.stderr : ''));
            } else {
                setConsoleOutput('Execution failed. Service might be unavailable.');
            }
        } catch (err) {
            setConsoleOutput('Error: ' + err.message);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <CodeIcon className="w-5 h-5 text-primary-400" />
                    <span className="font-bold text-gray-200 text-sm">Playground</span>
                </div>

                <div className="flex gap-2 bg-gray-900 p-1 rounded-lg overflow-x-auto">
                    {/* Web Group */}
                    <div className="flex bg-gray-800 rounded p-0.5">
                        {['html', 'css', 'js'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => handleModeSwitch(lang)}
                                className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${activeTab === lang
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-gray-700 mx-1"></div>

                    {/* Compiler Group */}
                    <div className="flex bg-gray-800 rounded p-0.5">
                        {['python', 'java', 'c'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => handleModeSwitch(lang)}
                                className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${activeTab === lang
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    {mode === 'compiler' && (
                        <button
                            onClick={runCompiler}
                            disabled={isRunning}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                        >
                            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            RUN
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Editor Section */}
                <div className={`flex-1 min-h-[300px] md:min-h-0 border-b md:border-b-0 md:border-r border-gray-700 relative`}>
                    <Editor
                        height="100%"
                        language={activeTab === 'js' ? 'javascript' : activeTab}
                        value={mode === 'web' ? (activeTab === 'html' ? html : activeTab === 'css' ? css : js) : code}
                        theme="vs-dark"
                        onChange={(val) => {
                            if (mode === 'web') {
                                if (activeTab === 'html') setHtml(val);
                                else if (activeTab === 'css') setCss(val);
                                else setJs(val);
                            } else {
                                setCode(val);
                            }
                        }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            padding: { top: 16, bottom: 16 },
                        }}
                    />
                </div>

                {/* Output Section */}
                <div className="flex-1 bg-white dark:bg-black relative flex flex-col">
                    {mode === 'web' ? (
                        <>
                            <div className="absolute top-0 right-0 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-bl-lg border-l border-b border-gray-200 dark:border-gray-700 z-10 flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Eye className="w-3 h-3" /> PREVIEW
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
                        <div className="flex-1 bg-[#1e1e1e] text-white p-4 font-mono text-sm overflow-auto">
                            <div className="flex items-center gap-2 text-gray-400 mb-2 border-b border-gray-700 pb-2">
                                <Terminal className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Console Output</span>
                            </div>
                            <pre className="whitespace-pre-wrap">{consoleOutput || 'Click "RUN" to see output...'}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
