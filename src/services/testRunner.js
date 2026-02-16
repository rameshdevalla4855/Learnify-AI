import { executeCode, LANGUAGE_CONFIG } from './piston';

const deepEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }
    
    if (typeof a === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => deepEqual(a[key], b[key]));
    }
    
    return false;
};

function parseInputString(inputStr) {
    if (!inputStr) return [];
    
    const inputs = [];
    
    const varPattern = /(\w+)\s*=\s*(.+?)(?=\s*\w+\s*=|$)/gs;
    const matches = [...inputStr.matchAll(varPattern)];
    
    if (matches.length > 0) {
        for (const match of matches) {
            const value = parseValue(match[2].trim());
            inputs.push(value);
        }
    } else {
        const parts = inputStr.split(/,\s*(?=[^\]]*(?:\[|$))/);
        for (const part of parts) {
            if (part.trim()) {
                inputs.push(parseValue(part.trim()));
            }
        }
    }
    
    return inputs;
}

function parseValue(str) {
    str = str.trim();
    
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (str === 'null') return null;
    
    if (!isNaN(Number(str)) && str !== '') {
        return Number(str);
    }
    
    if (str.startsWith('[') || str.startsWith('{')) {
        try {
            return JSON.parse(str);
        } catch {
            return str;
        }
    }
    
    if (str.startsWith('"') || str.startsWith("'")) {
        return str.slice(1, -1);
    }
    
    return str;
}

function parseOutputValue(outputStr) {
    if (!outputStr) return null;
    return parseValue(outputStr.trim());
}

function extractFunctionName(code, language) {
    switch (language) {
        case 'javascript':
        case 'typescript': {
            const funcMatch = code.match(/(?:var|let|const|function)\s+(\w+)\s*[=\(]/);
            return funcMatch ? funcMatch[1] : 'solution';
        }
        case 'python': {
            const funcMatch = code.match(/def\s+(\w+)\s*\(/);
            return funcMatch ? funcMatch[1] : 'solution';
        }
        case 'java': {
            const methodMatch = code.match(/public\s+\w+(?:\[\])?\s+(\w+)\s*\(/);
            return methodMatch ? methodMatch[1] : 'solution';
        }
        case 'cpp': {
            const funcMatch = code.match(/(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/);
            return funcMatch ? funcMatch[1] : 'solution';
        }
        default:
            return 'solution';
    }
}

const generateTestCode = (language, userCode, functionName, testCases, setupCode = '') => {
    switch (language) {
        case 'javascript': {
            return `${setupCode}
${userCode}

const testCases = ${JSON.stringify(testCases)};

const results = [];
for (let i = 0; i < testCases.length; i++) {
    try {
        const tc = testCases[i];
        const input = tc.input;
        const expected = tc.expected;
        const startTime = performance.now();
        
        let actual;
        if (Array.isArray(input)) {
            actual = ${functionName}(...input);
        } else {
            actual = ${functionName}(input);
        }
        
        const runtime = performance.now() - startTime;
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        results.push({
            passed,
            input: JSON.stringify(input),
            expected: JSON.stringify(expected),
            actual: JSON.stringify(actual),
            runtime: runtime.toFixed(2)
        });
    } catch (e) {
        results.push({
            passed: false,
            input: JSON.stringify(testCases[i].input),
            expected: JSON.stringify(testCases[i].expected),
            actual: null,
            error: e.message
        });
    }
}
console.log(JSON.stringify(results));`;
        }
        
        case 'python': {
            return `import json
import time
import traceback

${setupCode}
${userCode}

test_cases = ${JSON.stringify(testCases)}
results = []

for i, tc in enumerate(test_cases):
    inp = tc.get('input')
    expected = tc.get('expected')
    try:
        start = time.perf_counter()
        if isinstance(inp, list):
            actual = ${functionName}(*inp)
        else:
            actual = ${functionName}(inp)
        runtime = (time.perf_counter() - start) * 1000
        
        actual_json = json.dumps(actual, default=str)
        expected_json = json.dumps(expected, default=str)
        passed = actual_json == expected_json
        
        results.append({
            'passed': passed,
            'input': json.dumps(inp),
            'expected': expected_json,
            'actual': actual_json,
            'runtime': f'{runtime:.2f}'
        })
    except Exception as e:
        results.append({
            'passed': False,
            'input': json.dumps(inp),
            'expected': json.dumps(expected),
            'actual': None,
            'error': str(e)
        })

print(json.dumps(results))`;
        }
        
        case 'java': {
            return `import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        
        List<Map<String, Object>> testCases = ${JSON.stringify(testCases)};
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (int i = 0; i < testCases.size(); i++) {
            Map<String, Object> tc = testCases.get(i);
            Map<String, Object> result = new HashMap<>();
            result.put("input", tc.get("input").toString());
            result.put("expected", tc.get("expected").toString());
            
            try {
                long start = System.nanoTime();
                Object actual = null;
                result.put("actual", actual != null ? actual.toString() : "null");
                result.put("passed", false);
                result.put("runtime", String.valueOf((System.nanoTime() - start) / 1_000_000));
            } catch (Exception e) {
                result.put("passed", false);
                result.put("actual", null);
                result.put("error", e.getMessage());
            }
            results.add(result);
        }
        
        System.out.println(new com.google.gson.Gson().toJson(results));
    }
}`;
        }
        
        case 'cpp': {
            return `#include <iostream>
#include <vector>
#include <string>

${setupCode}
${userCode}

int main() {
    std::cout << "[{\\"passed\\": false, \\"error\\": \\"C++ test runner requires manual implementation\\"}]" << std::endl;
    return 0;
}`;
        }
        
        default:
            return userCode;
    }
};

export const runTests = async (language, userCode, functionName, testCases, setupCode = '') => {
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
    
    if (!supportedLanguages.includes(language)) {
        return {
            success: false,
            error: `Test runner not available for ${language}. Supported: ${supportedLanguages.join(', ')}`,
            results: []
        };
    }

    if (!testCases || testCases.length === 0) {
        return {
            success: false,
            error: 'No test cases provided',
            results: []
        };
    }
    
    const actualFunctionName = functionName || extractFunctionName(userCode, language);
    const testCode = generateTestCode(language, userCode, actualFunctionName, testCases, setupCode);
    
    try {
        const result = await executeCode(language, testCode, 30000);
        
        if (!result.success) {
            return {
                success: false,
                error: result.error,
                results: []
            };
        }
        
        if (result.stderr && !result.stdout) {
            return {
                success: false,
                error: result.stderr,
                results: []
            };
        }
        
        try {
            const results = JSON.parse(result.stdout);
            return {
                success: true,
                results: results.map(r => ({
                    passed: r.passed,
                    input: r.input,
                    expected: r.expected,
                    actual: r.actual,
                    runtime: r.runtime,
                    error: r.error || null
                })),
                rawOutput: result.stdout
            };
        } catch (parseError) {
            return {
                success: false,
                error: 'Failed to parse test results: ' + parseError.message,
                rawOutput: result.stdout,
                results: []
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            results: []
        };
    }
};

export const generateTestCasesFromExamples = (examples, exampleTestcases = null) => {
    if (exampleTestcases && exampleTestcases.length > 0) {
        return exampleTestcases;
    }

    if (!examples || !Array.isArray(examples)) return [];

    return examples.map((ex, index) => {
        let input = ex.input;
        let expected = ex.output;

        if (typeof input === 'string') {
            input = parseInputString(input);
        }

        if (typeof expected === 'string') {
            expected = parseOutputValue(expected);
        }

        return {
            input: Array.isArray(input) ? input : [input],
            expected,
            description: `Test case ${index + 1}`
        };
    });
};

export const runSimpleExecution = async (language, code, input = null) => {
    try {
        let fullCode = code;
        
        if (input !== null) {
            const inputJson = JSON.stringify(input);
            fullCode = `${code}

// Test input
const __testInput__ = ${inputJson};
console.log("Input:", JSON.stringify(__testInput__));
`;
        }
        
        const result = await executeCode(language, fullCode);
        
        return {
            success: result.success,
            output: result.output,
            stdout: result.stdout,
            stderr: result.stderr,
            error: result.error,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            output: '',
            stdout: '',
            stderr: error.message,
        };
    }
};

export { deepEqual, extractFunctionName, parseInputString, parseOutputValue };
