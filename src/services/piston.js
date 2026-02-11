
const PISTON_API_URL = "https://emkc.org/api/v2/piston";

export const executeCode = async (language, sourceCode) => {
    // Map our internal language IDs to Piston's expected runtime
    const runtimeMap = {
        'python': { language: 'python', version: '3.10.0' },
        'java': { language: 'java', version: '15.0.2' },
        'c': { language: 'c', version: '10.2.0' },
        'cpp': { language: 'c++', version: '10.2.0' },
        'javascript': { language: 'javascript', version: '18.15.0' },
        'js': { language: 'javascript', version: '18.15.0' },
        'typescript': { language: 'typescript', version: '5.0.3' },
        'go': { language: 'go', version: '1.16.2' },
        'rust': { language: 'rust', version: '1.68.2' },
    };

    const config = runtimeMap[language];
    if (!config) throw new Error(`Language ${language} not supported for execution`);

    try {
        const response = await fetch(`${PISTON_API_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: config.language,
                version: config.version,
                files: [
                    {
                        content: sourceCode
                    }
                ]
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Piston Execution Error:", error);
        throw error;
    }
};
