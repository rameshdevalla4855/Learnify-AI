const PISTON_API_URL = "https://emkc.org/api/v2/piston";

export const LANGUAGE_CONFIG = {
    javascript: { language: 'javascript', version: '18.15.0', extension: 'js', displayName: 'JavaScript' },
    typescript: { language: 'typescript', version: '5.0.3', extension: 'ts', displayName: 'TypeScript' },
    python: { language: 'python', version: '3.10.0', extension: 'py', displayName: 'Python' },
    java: { language: 'java', version: '15.0.2', extension: 'java', displayName: 'Java' },
    c: { language: 'c', version: '10.2.0', extension: 'c', displayName: 'C' },
    cpp: { language: 'c++', version: '10.2.0', extension: 'cpp', displayName: 'C++' },
    go: { language: 'go', version: '1.16.2', extension: 'go', displayName: 'Go' },
    rust: { language: 'rust', version: '1.68.2', extension: 'rs', displayName: 'Rust' },
    csharp: { language: 'c#', version: '6.12.0', extension: 'cs', displayName: 'C#' },
    ruby: { language: 'ruby', version: '3.0.1', extension: 'rb', displayName: 'Ruby' },
    php: { language: 'php', version: '8.0.12', extension: 'php', displayName: 'PHP' },
    swift: { language: 'swift', version: '5.4.3', extension: 'swift', displayName: 'Swift' },
    kotlin: { language: 'kotlin', version: '1.8.20', extension: 'kt', displayName: 'Kotlin' },
};

export const executeCode = async (language, sourceCode, timeout = 10000) => {
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
        throw new Error(`Language '${language}' is not supported. Supported languages: ${Object.keys(LANGUAGE_CONFIG).join(', ')}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${PISTON_API_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: config.language,
                version: config.version,
                files: [{ content: sourceCode }],
                compile_timeout: 10000,
                run_timeout: timeout,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Piston API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        return {
            success: true,
            language: config.displayName,
            version: config.version,
            stdout: data.run?.stdout || '',
            stderr: data.run?.stderr || '',
            output: (data.run?.stdout || '') + (data.run?.stderr ? '\n' + data.run?.stderr : ''),
            exitCode: data.run?.code ?? 0,
            signal: data.run?.signal,
            compileOutput: data.compile?.output || '',
            compileCode: data.compile?.code,
            raw: data,
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Execution timed out',
                timedOut: true,
            };
        }
        
        console.error("Piston Execution Error:", error);
        return {
            success: false,
            error: error.message || 'Failed to execute code',
        };
    }
};

export const getRuntimes = async () => {
    try {
        const response = await fetch(`${PISTON_API_URL}/runtimes`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch runtimes:", error);
        return [];
    }
};

export const isLanguageSupported = (language) => {
    return language in LANGUAGE_CONFIG;
};

export const getSupportedLanguages = () => {
    return Object.entries(LANGUAGE_CONFIG).map(([id, config]) => ({
        id,
        ...config
    }));
};
