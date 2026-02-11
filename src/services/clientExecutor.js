/**
 * Client-Side Code Execution Engine
 * 
 * Runs JavaScript and Python code entirely in the browser.
 * - JavaScript: sandboxed eval with console output capture
 * - Python: Pyodide (CPython compiled to WebAssembly)
 * - Other languages: falls back to Piston API
 */

let pyodideInstance = null;
let pyodideLoading = false;
let pyodideLoadPromise = null;

// ─── JavaScript Execution (Client-Side) ──────────────────────────────
export const executeJavaScript = (code) => {
    const logs = [];
    const startTime = performance.now();

    const captureConsole = {
        log: (...args) => logs.push(formatArgs(args)),
        error: (...args) => logs.push('❌ ' + formatArgs(args)),
        warn: (...args) => logs.push('⚠️ ' + formatArgs(args)),
        info: (...args) => logs.push('ℹ️ ' + formatArgs(args)),
        table: (data) => logs.push(formatTable(data)),
        clear: () => { logs.length = 0; },
    };

    try {
        // Use Function constructor for safer execution (no access to outer scope)
        const fn = new Function('console', code);
        const result = fn(captureConsole);

        // If the code returns a value and didn't console.log anything
        if (result !== undefined && logs.length === 0) {
            logs.push(String(result));
        }

        const elapsed = (performance.now() - startTime).toFixed(1);
        return {
            success: true,
            output: logs.join('\n'),
            executionTime: `${elapsed}ms`,
        };
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(1);
        return {
            success: false,
            output: logs.length > 0 ? logs.join('\n') + '\n\n' : '',
            error: `${error.name}: ${error.message}`,
            executionTime: `${elapsed}ms`,
        };
    }
};

// ─── TypeScript Execution (Client-Side — strip types, then run as JS) ─
export const executeTypeScript = (code) => {
    // Simple type-stripping for common TS patterns
    // This handles: type annotations, interfaces, type aliases, enums (basic)
    let jsCode = code
        .replace(/:\s*(string|number|boolean|any|void|never|unknown|object|undefined|null)(\[\])?\s*/g, ' ')
        .replace(/:\s*\w+(\[\])?\s*(?=[=,\)\{;\n])/g, ' ')
        .replace(/<[^>]+>/g, '') // Remove generic type params
        .replace(/^(interface|type|enum)\s+\w+\s*\{[^}]*\}\s*;?\s*$/gm, '') // Remove interface/type/enum declarations
        .replace(/\bas\s+\w+/g, '') // Remove type assertions like `as string`
        .replace(/^\s*export\s+/gm, '') // Remove export keyword
        .replace(/^\s*import\s+type\s+.*$/gm, ''); // Remove type-only imports

    return executeJavaScript(jsCode);
};

// ─── Python Execution (Client-Side via Pyodide WASM) ─────────────────
export const loadPyodide = async (onProgress) => {
    if (pyodideInstance) return pyodideInstance;
    if (pyodideLoading) return pyodideLoadPromise;

    pyodideLoading = true;

    pyodideLoadPromise = new Promise(async (resolve, reject) => {
        try {
            if (onProgress) onProgress('Loading Python runtime...');

            // Load Pyodide script from CDN
            if (!window.loadPyodide) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                document.head.appendChild(script);
                await new Promise((res, rej) => {
                    script.onload = res;
                    script.onerror = () => rej(new Error('Failed to load Pyodide'));
                });
            }

            if (onProgress) onProgress('Initializing Python interpreter...');

            pyodideInstance = await window.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            });

            pyodideLoading = false;
            resolve(pyodideInstance);
        } catch (err) {
            pyodideLoading = false;
            reject(err);
        }
    });

    return pyodideLoadPromise;
};

export const executePython = async (code, onProgress) => {
    const startTime = performance.now();

    try {
        const pyodide = await loadPyodide(onProgress);

        if (onProgress) onProgress('Running code...');

        // Redirect stdout/stderr
        pyodide.runPython(`
import sys
from io import StringIO
_stdout_capture = StringIO()
_stderr_capture = StringIO()
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
`);

        // Run user code
        pyodide.runPython(code);

        // Capture output
        const stdout = pyodide.runPython('_stdout_capture.getvalue()');
        const stderr = pyodide.runPython('_stderr_capture.getvalue()');

        // Reset stdout/stderr
        pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        const elapsed = (performance.now() - startTime).toFixed(1);

        if (stderr) {
            return {
                success: false,
                output: stdout || '',
                error: stderr,
                executionTime: `${elapsed}ms`,
            };
        }

        return {
            success: true,
            output: stdout || '(No output)',
            executionTime: `${elapsed}ms`,
        };
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(1);

        // Extract the useful part of Python errors
        let errorMsg = error.message || String(error);
        const pyError = errorMsg.match(/(?:PythonError: )?(.*)/s);
        if (pyError) errorMsg = pyError[1];

        return {
            success: false,
            output: '',
            error: errorMsg,
            executionTime: `${elapsed}ms`,
        };
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────
function formatArgs(args) {
    return args.map(arg => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2);
            } catch {
                return String(arg);
            }
        }
        return String(arg);
    }).join(' ');
}

function formatTable(data) {
    if (Array.isArray(data)) {
        if (data.length === 0) return '(empty array)';
        // Simple table formatting
        const keys = Object.keys(data[0] || {});
        if (keys.length === 0) return JSON.stringify(data, null, 2);

        let table = keys.join('\t') + '\n';
        table += keys.map(() => '---').join('\t') + '\n';
        data.forEach(row => {
            table += keys.map(k => String(row[k] ?? '')).join('\t') + '\n';
        });
        return table;
    }
    return JSON.stringify(data, null, 2);
}
