import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Code as CodeIcon, Eye, Terminal, Loader2, ChevronDown, PanelRightClose, PanelRightOpen, X, Zap } from 'lucide-react';
import { executeCode, LANGUAGE_CONFIG, getSupportedLanguages } from '../services/piston';

const LANGUAGES = [
    { id: 'javascript', name: 'JavaScript', mode: 'compiler' },
    { id: 'typescript', name: 'TypeScript', mode: 'compiler' },
    { id: 'python', name: 'Python', mode: 'compiler' },
    { id: 'java', name: 'Java', mode: 'compiler' },
    { id: 'c', name: 'C', mode: 'compiler' },
    { id: 'cpp', name: 'C++', mode: 'compiler' },
    { id: 'go', name: 'Go', mode: 'compiler' },
    { id: 'rust', name: 'Rust', mode: 'compiler' },
    { id: 'csharp', name: 'C#', mode: 'compiler' },
    { id: 'ruby', name: 'Ruby', mode: 'compiler' },
];

const BOILERPLATE = {
    javascript: `// JavaScript Playground
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`,
    typescript: `// TypeScript Playground
function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`,
    python: `# Python Playground
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
`,
    java: `// Java Playground
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    c: `// C Playground
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    cpp: `// C++ Playground
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
    go: `// Go Playground
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
    rust: `// Rust Playground
fn main() {
    println!("Hello, World!");
}`,
    csharp: `// C# Playground
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
    ruby: `# Ruby Playground
puts "Hello, World!"`,
};

export default function CodePlayground({ 
    wrapped = true, 
    initialCode = '', 
    initialLanguage = 'python', 
    onCodeChange, 
    onRun,
    showSubmit = false,
    onSubmit,
    isRunning: externalIsRunning = false,
}) {
    const [activeLanguage, setActiveLanguage] = useState(initialLanguage);
    const [code, setCode] = useState(initialCode || BOILERPLATE[initialLanguage] || BOILERPLATE.python);
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [showOutput, setShowOutput] = useState(true);
    const [executionTime, setExecutionTime] = useState(null);

    useEffect(() => {
        if (initialCode) {
            setCode(initialCode);
            setActiveLanguage(initialLanguage);
        }
    }, [initialCode, initialLanguage]);

    const handleLanguageChange = (langId) => {
        setActiveLanguage(langId);
        if (!initialCode) {
            setCode(BOILERPLATE[langId] || '');
        }
        setConsoleOutput('');
        setExecutionTime(null);
    };

    const runCompiler = async () => {
        setIsRunning(true);
        setShowOutput(true);
        setConsoleOutput('Running...\n');

        const startTime = performance.now();

        try {
            if (onRun) {
                const results = await onRun(code, activeLanguage);
                if (typeof results === 'string') {
                    setConsoleOutput(results);
                } else if (Array.isArray(results)) {
                    const passedCount = results.filter(r => r.passed).length;
                    const totalCount = results.length;
                    let output = `═══════════════════════════════════════\n`;
                    output += `  Test Results: ${passedCount}/${totalCount} Passed\n`;
                    output += `═══════════════════════════════════════\n\n`;

                    results.forEach((r, i) => {
                        output += `Test ${i + 1}: ${r.passed ? '✓ PASSED' : '✗ FAILED'}\n`;
                        if (!r.passed) {
                            output += `   Input:    ${r.input}\n`;
                            output += `   Expected: ${r.expected}\n`;
                            output += `   Actual:   ${r.actual}\n`;
                            if (r.error) output += `   Error:    ${r.error}\n`;
                        }
                        output += '\n';
                    });
                    setConsoleOutput(output);
                }
            } else {
                const result = await executeCode(activeLanguage, code);
                const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
                setExecutionTime(elapsed);

                if (result.success) {
                    let output = '';
                    if (result.compileOutput) {
                        output += `━━━ Compilation ━━━\n${result.compileOutput}\n\n`;
                    }
                    output += `━━━ Output ━━━\n`;
                    if (result.stdout) output += result.stdout;
                    if (result.stderr) {
                        output += `\n━━━ Errors ━━━\n${result.stderr}`;
                    }
                    if (!result.stdout && !result.stderr) {
                        output += '(no output)';
                    }
                    setConsoleOutput(output);
                } else {
                    setConsoleOutput(`Error: ${result.error}\n\nMake sure your code is valid ${LANGUAGE_CONFIG[activeLanguage]?.displayName || activeLanguage}.`);
                }
            }
        } catch (err) {
            setConsoleOutput(`Error: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleCodeUpdate = (val) => {
        setCode(val || '');
        if (onCodeChange) onCodeChange(val || '');
    };

    const running = isRunning || externalIsRunning;

    return (
        <div className={`flex flex-col h-full bg-[#1e1e1e] overflow-hidden ${wrapped ? 'border border-white/[0.06] rounded-xl' : ''}`}>
            <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-white/[0.06] min-h-[44px]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <CodeIcon className="w-4 h-4 text-orange-400" />
                        <span className="font-semibold text-gray-200 text-xs hidden sm:block">Playground</span>
                    </div>

                    <div className="relative">
                        <select
                            value={activeLanguage}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="appearance-none bg-[#1e1e1e] text-white text-xs font-medium pl-2.5 pr-7 py-1.5 rounded-md border border-white/[0.08] hover:border-white/[0.15] focus:outline-none focus:border-orange-500/50 cursor-pointer transition-colors"
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {executionTime && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {executionTime}s
                        </span>
                    )}
                    <button
                        onClick={() => setShowOutput(!showOutput)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                        title={showOutput ? 'Hide output' : 'Show output'}
                    >
                        {showOutput ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={runCompiler}
                        disabled={running}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        Run
                    </button>
                    {showSubmit && onSubmit && (
                        <button
                            onClick={onSubmit}
                            disabled={running}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md text-xs font-bold transition-all disabled:opacity-50"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Submit
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                <div className={`${showOutput ? 'flex-1' : 'w-full'} min-h-[280px] md:min-h-0 ${showOutput ? 'border-b md:border-b-0 md:border-r border-white/[0.06]' : ''} relative`}>
                    <Editor
                        height="100%"
                        language={activeLanguage === 'csharp' ? 'csharp' : activeLanguage === 'cpp' ? 'cpp' : activeLanguage}
                        value={code}
                        theme="vs-dark"
                        onChange={handleCodeUpdate}
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
                            wordWrap: 'on',
                        }}
                    />
                </div>

                {showOutput && (
                    <div className="flex-1 bg-[#1e1e1e] border-l border-white/[0.06] relative flex flex-col min-w-[280px]">
                        <div className="flex flex-col h-full">
                            <div className="h-8 bg-[#252526] border-b border-white/[0.06] flex items-center justify-between px-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <Terminal className="w-3.5 h-3.5" /> OUTPUT
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setConsoleOutput(''); setExecutionTime(null); }}
                                        className="text-[10px] text-gray-500 hover:text-white transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button onClick={() => setShowOutput(false)} className="p-0.5 text-gray-500 hover:text-white transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 p-3 font-mono text-xs overflow-auto">
                                {consoleOutput ? (
                                    <pre className={`whitespace-pre-wrap ${consoleOutput.includes('Error') || consoleOutput.includes('FAILED') ? 'text-rose-400' : consoleOutput.includes('PASSED') ? 'text-emerald-400' : 'text-gray-300'}`}>
                                        {consoleOutput}
                                    </pre>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                                        <Terminal className="w-8 h-8" />
                                        <p className="text-xs">Run code to see output</p>
                                        <p className="text-[10px] text-gray-700">Powered by Piston API</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
