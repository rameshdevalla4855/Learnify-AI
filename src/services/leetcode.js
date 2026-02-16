import { cacheProblems, cacheProblemDetails } from './problemCacheService';

const GRAPHQL_URL = 'https://leetcode.com/graphql';
const CORS_PROXY = 'https://corsproxy.io/?';
const FALLBACK_API = 'https://leetcode-api-pied.vercel.app';
const LEETCODE_API = 'https://leetcode.com/api/problems/all/';

const QUERIES = {
    getProblems: `query getProblems($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
            total: totalNum
            questions: data {
                acRate
                difficulty
                freqBar
                frontendQuestionId: questionFrontendId
                isFavor
                paidOnly: isPaidOnly
                status
                title
                titleSlug
                topicTags { name id slug }
            }
        }
    }`,
    
    getProblemDetail: `query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
            questionId
            questionFrontendId
            title
            titleSlug
            content
            difficulty
            likes
            dislikes
            exampleTestcases
            topicTags { name slug }
            hints
            codeSnippets { lang langSlug code }
            constraints
        }
    }`,
    
    getDailyProblem: `query questionOfToday {
        activeDailyCodingChallengeQuestion {
            date
            userStatus
            link
            question {
                questionId
                questionFrontendId
                title
                titleSlug
                difficulty
                content
                topicTags { name slug }
            }
        }
    }`,
};

const languageMap = {
    'javascript': 'javascript',
    'python': 'python',
    'python3': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c++': 'cpp',
    'c': 'c',
    'csharp': 'csharp',
    'c#': 'csharp',
    'typescript': 'typescript',
    'go': 'go',
    'golang': 'go',
    'rust': 'rust',
    'ruby': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kotlin',
};

async function graphqlRequest(query, variables = {}) {
    const body = JSON.stringify({ query, variables });
    
    const urls = [
        GRAPHQL_URL,
        `${CORS_PROXY}${encodeURIComponent(GRAPHQL_URL)}`,
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body,
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                continue;
            }

            const data = await response.json();
            
            if (data.errors) {
                console.error('GraphQL errors:', data.errors);
                continue;
            }

            return data.data;
        } catch (error) {
            console.warn(`Request failed for ${url}:`, error.message);
        }
    }

    throw new Error('All GraphQL endpoints failed');
}

async function fetchFromFallbackAPI(endpoint) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const url = `${FALLBACK_API}${endpoint}`;
        console.log(`[FallbackAPI] Fetching: ${url}`);

        const response = await fetch(url, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`[FallbackAPI] Response for ${endpoint}:`, typeof data, Array.isArray(data) ? `array[${data.length}]` : Object.keys(data || {}));
        return data;
    } catch (error) {
        console.error('Fallback API failed:', error.message);
        throw error;
    }
}

export const leetcodeService = {
    getAllProblems: async () => {
        try {
            console.log('[getAllProblems] Fetching from fallback API...');
            const data = await fetchFromFallbackAPI('/problems');
            console.log('[getAllProblems] API response:', data);
            const problems = Array.isArray(data) ? data : (data.problems || []);
            console.log(`[getAllProblems] Found ${problems.length} problems`);
            return problems;
        } catch (error) {
            console.error('Error fetching all problems:', error.message);
            return [];
        }
    },

    getProblems: async (limit = 50, skip = 0) => {
        try {
            const data = await fetchFromFallbackAPI('/problems');
            const problems = Array.isArray(data) ? data : (data.problems || []);
            return problems.slice(skip, skip + limit);
        } catch (error) {
            console.error('Error fetching problems:', error.message);
            return [];
        }
    },

    getProblemsByDifficulty: async (difficulty, limit = 50) => {
        try {
            const data = await fetchFromFallbackAPI(`/problems/filter?difficulty=${difficulty}&limit=${limit}`);
            return Array.isArray(data) ? data : (data.problems || []);
        } catch (error) {
            console.error('Error fetching problems by difficulty:', error.message);
            return [];
        }
    },

    getProblemsByTag: async (tagSlug, limit = 50) => {
        try {
            const data = await fetchFromFallbackAPI(`/problems/tag/${tagSlug}`);
            return Array.isArray(data) ? data : (data.problems || []);
        } catch (error) {
            console.error('Error fetching problems by tag:', error.message);
            return [];
        }
    },

    getTotalProblems: async () => {
        try {
            const problems = await leetcodeService.getAllProblems();
            return problems.length;
        } catch (error) {
            console.error('Error fetching total problems:', error.message);
            return 0;
        }
    },

    fetchAllAndCache: async (onProgress = null) => {
        try {
            console.log('[fetchAllAndCache] Starting...');
            if (onProgress) onProgress(0, 0);

            const problems = await leetcodeService.getAllProblems();
            console.log(`[fetchAllAndCache] Fetched ${problems?.length || 0} problems from API`);
            
            const total = problems?.length || 0;

            if (onProgress) onProgress(Math.floor(total / 2), 50);

            if (problems && problems.length > 0) {
                const formattedProblems = problems.map(p => ({
                    titleSlug: p.title_slug || p.titleSlug,
                    title: p.title,
                    difficulty: p.difficulty,
                    acRate: null,
                    isPaidOnly: p.paid_only || p.isPaidOnly || false,
                    frontendQuestionId: p.frontend_id || p.frontendQuestionId || p.id,
                    topicTags: (p.topicTags || p.tags || []).map(t => ({
                        name: t.name || t,
                        slug: t.slug || '',
                    })),
                    topicNames: (p.topicTags || p.tags || []).map(t => t.name || t),
                })).filter(p => p.titleSlug);

                console.log(`[fetchAllAndCache] Formatted ${formattedProblems.length} problems for caching`);
                await cacheProblems(formattedProblems);
            }

            if (onProgress) onProgress(total, total);

            return { problems: problems || [], total, fromApi: true };
        } catch (error) {
            console.error('fetchAllAndCache failed:', error);
            return { problems: [], total: 0, fromApi: false, error: error.message };
        }
    },

    fetchAndCacheProblems: async (limit = 50, skip = 0) => {
        try {
            const problems = await leetcodeService.getProblems(limit, skip);
            if (problems.length > 0) {
                cacheProblems(problems).catch(err =>
                    console.warn('Cache write failed (non-blocking):', err.message)
                );
                return { problems, fromApi: true };
            }
            return { problems: [], fromApi: false };
        } catch (error) {
            console.error('fetchAndCacheProblems failed:', error);
            return { problems: [], fromApi: false };
        }
    },

    getProblemDetails: async (titleSlug) => {
        try {
            console.log('[getProblemDetails] Trying GraphQL for:', titleSlug);
            const data = await graphqlRequest(QUERIES.getProblemDetail, { titleSlug });
            
            if (data && data.question) {
                console.log('[getProblemDetails] GraphQL success:', titleSlug);
                const processed = processProblemDetails(data.question);
                cacheProblemDetails(titleSlug, processed).catch(() => {});
                return processed;
            }
        } catch (error) {
            console.log('[getProblemDetails] GraphQL failed, trying fallback API...', error.message);
        }

        try {
            console.log('[getProblemDetails] Trying fallback API for:', titleSlug);
            const fallbackData = await fetchFromFallbackAPI(`/problem/${titleSlug}`);
            console.log('[getProblemDetails] Fallback API response:', fallbackData);
            if (fallbackData) {
                const processed = processProblemDetails(fallbackData);
                if (processed && Object.keys(processed.starterCode || {}).length > 0) {
                    cacheProblemDetails(titleSlug, processed).catch(() => {});
                    return processed;
                }
            }
        } catch (error) {
            console.log('[getProblemDetails] Fallback API failed:', error.message);
        }

        try {
            console.log('[getProblemDetails] Trying fallback select API for:', titleSlug);
            const selectData = await fetchFromFallbackAPI(`/select?titleSlug=${titleSlug}`);
            console.log('[getProblemDetails] Fallback select API response:', selectData);
            if (selectData && (selectData.codeSnippets || selectData.code_snippets || selectData.starterCode)) {
                const processed = processProblemDetails(selectData);
                if (processed && Object.keys(processed.starterCode || {}).length > 0) {
                    cacheProblemDetails(titleSlug, processed).catch(() => {});
                    return processed;
                }
            }
        } catch (error) {
            console.log('[getProblemDetails] Fallback select API failed:', error.message);
        }

        console.log('[getProblemDetails] All methods failed for:', titleSlug);
        return null;
    },

    getDailyProblem: async () => {
        try {
            const data = await graphqlRequest(QUERIES.getDailyProblem);
            if (data?.activeDailyCodingChallengeQuestion?.question) {
                return processProblemDetails(data.activeDailyCodingChallengeQuestion.question);
            }
            return null;
        } catch (error) {
            console.error('Error fetching daily problem:', error.message);
            return null;
        }
    },

    getDifficultyColor: (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'text-emerald-400 bg-emerald-400/10';
            case 'medium': return 'text-amber-400 bg-amber-400/10';
            case 'hard': return 'text-rose-400 bg-rose-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    },

    getDifficultyBorder: (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'border-emerald-500/30';
            case 'medium': return 'border-amber-500/30';
            case 'hard': return 'border-rose-500/30';
            default: return 'border-gray-500/30';
        }
    }
};

function processProblemDetails(data) {
    if (!data) {
        console.log('processProblemDetails: No data');
        return null;
    }

    const titleSlug = data.titleSlug || data.title_slug;
    console.log('Processing problem:', titleSlug, 'Raw data keys:', Object.keys(data));
    
    const examples = parseExamples(data.content || data.description);
    const constraints = parseConstraints(data.content || data.description);
    
    const starterCode = {};
    
    // Handle codeSnippets array format (LeetCode GraphQL)
    if (data.codeSnippets && Array.isArray(data.codeSnippets)) {
        console.log('Found codeSnippets array:', data.codeSnippets.length);
        data.codeSnippets.forEach(snippet => {
            let langKey = snippet.langSlug?.toLowerCase() || snippet.lang?.toLowerCase();
            const code = snippet.code || snippet.sourceCode;
            
            if (langKey === 'python3' || langKey === 'python') {
                langKey = 'python';
            } else if (langKey === 'c++' || langKey === 'cpp') {
                langKey = 'cpp';
            } else if (langKey === 'java') {
                langKey = 'java';
            } else if (langKey === 'javascript' || langKey === 'js') {
                langKey = 'javascript';
            } else if (langKey === 'typescript' || langKey === 'ts') {
                langKey = 'typescript';
            } else if (langKey === 'c#' || langKey === 'csharp') {
                langKey = 'csharp';
            } else if (langKey === 'go' || langKey === 'golang') {
                langKey = 'go';
            } else if (langKey === 'rust') {
                langKey = 'rust';
            }
            
            if (code && langKey) {
                starterCode[langKey] = code;
                console.log('Added starter code for:', langKey);
            }
        });
    }
    
    // Handle starterCode object format (fallback API)
    if (data.starterCode && typeof data.starterCode === 'object') {
        console.log('Found starterCode object:', Object.keys(data.starterCode));
        Object.entries(data.starterCode).forEach(([lang, code]) => {
            let langKey = lang.toLowerCase();
            if (langKey === 'python3') langKey = 'python';
            if (langKey === 'c++') langKey = 'cpp';
            if (langKey === 'c#') langKey = 'csharp';
            if (langKey === 'golang') langKey = 'go';
            if (code && !starterCode[langKey]) {
                starterCode[langKey] = code;
            }
        });
    }
    
    // Handle code_snippets snake_case format
    if (data.code_snippets && Array.isArray(data.code_snippets)) {
        console.log('Found code_snippets array:', data.code_snippets.length);
        data.code_snippets.forEach(snippet => {
            let langKey = snippet.lang_slug?.toLowerCase() || snippet.lang?.toLowerCase();
            const code = snippet.code || snippet.source_code;
            
            if (langKey === 'python3' || langKey === 'python') langKey = 'python';
            else if (langKey === 'c++' || langKey === 'cpp') langKey = 'cpp';
            else if (langKey === 'javascript' || langKey === 'js') langKey = 'javascript';
            
            if (code && langKey && !starterCode[langKey]) {
                starterCode[langKey] = code;
                console.log('Added starter code for:', langKey, 'from code_snippets');
            }
        });
    }

    console.log('Final starterCode keys:', Object.keys(starterCode));

    // Generate default starter code templates if none provided
    if (Object.keys(starterCode).length === 0) {
        console.log('No starter code found, generating default templates');
        const functionName = extractFunctionNameFromTitle(titleSlug);
        starterCode.javascript = `/**
 * @param {any} input
 * @return {any}
 */
var ${functionName} = function(input) {
    
};`;
        starterCode.python = `class Solution:
    def ${functionName}(self, input):
        `;
        starterCode.java = `class Solution {
    public Object ${functionName}(Object input) {
        
    }
}`;
        starterCode.cpp = `class Solution {
public:
    auto ${functionName}(auto input) {
        
    }
};`;
    }

    let exampleTestcases = [];
    if (data.exampleTestcases || data.example_testcases) {
        exampleTestcases = parseExampleTestcases(data.exampleTestcases || data.example_testcases, examples);
    }

    return {
        titleSlug,
        title: data.title || data.questionTitle,
        questionId: data.questionId || data.question_id,
        frontendQuestionId: data.questionFrontendId || data.frontend_question_id,
        difficulty: data.difficulty,
        description: data.content || data.description || data.question,
        examples,
        constraints,
        hints: data.hints || [],
        topicTags: (data.topicTags || data.topic_tags || data.tags || []).map(t => ({
            name: t.name || t,
            slug: t.slug || '',
        })),
        topicNames: (data.topicTags || data.topic_tags || data.tags || []).map(t => t.name || t),
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        exampleTestcases,
        starterCode,
    };
}

function parseExamples(content) {
    if (!content) return [];

    const examples = [];
    const exampleBlocks = content.split(/<strong class="example">Example \d+:<\/strong>/i);
    
    for (let i = 1; i < exampleBlocks.length; i++) {
        const block = exampleBlocks[i];
        
        const inputMatch = block.match(/<strong>Input:<\/strong>\s*([\s\S]*?)(?=<strong>Output:|<\/pre>)/i);
        const outputMatch = block.match(/<strong>Output:<\/strong>\s*([\s\S]*?)(?=<strong>Explanation:|<\/pre>|<p>|$)/i);
        const explanationMatch = block.match(/<strong>Explanation:<\/strong>\s*([\s\S]*?)(?=<\/pre>|<p>|<strong>|$)/i);
        
        if (inputMatch && outputMatch) {
            const input = cleanHtml(inputMatch[1]).trim();
            const output = cleanHtml(outputMatch[1]).trim();
            const explanation = explanationMatch ? cleanHtml(explanationMatch[1]).trim() : '';
            
            examples.push({ input, output, explanation });
        }
    }

    return examples;
}

function extractFunctionNameFromTitle(titleSlug) {
    if (!titleSlug) return 'solution';
    return titleSlug
        .split('-')
        .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

function parseConstraints(content) {
    if (!content) return [];

    const constraints = [];
    const constraintMatch = content.match(/<strong>Constraints:<\/strong>\s*<\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
    
    if (constraintMatch) {
        const liRegex = /<li>([\s\S]*?)<\/li>/gi;
        let liMatch;
        while ((liMatch = liRegex.exec(constraintMatch[1])) !== null) {
            const constraint = cleanHtml(liMatch[1]).trim();
            if (constraint) {
                constraints.push(constraint);
            }
        }
    }

    return constraints;
}

function parseExampleTestcases(testcasesStr, examples) {
    if (!testcasesStr) return [];
    
    const lines = testcasesStr.split('\n').filter(l => l.trim());
    const testCases = [];
    
    if (examples.length > 0) {
        const numParams = (examples[0].input.match(/\w+\s*=/g) || []).length || 1;
        
        for (let i = 0; i < lines.length; i += numParams) {
            const params = lines.slice(i, i + numParams);
            const expectedOutput = examples[Math.floor(i / numParams)]?.output || '';
            
            testCases.push({
                input: params.map(p => parseValue(p.trim())),
                expected: parseValue(expectedOutput.trim()),
            });
        }
    }
    
    return testCases;
}

function parseValue(str) {
    if (!str) return null;
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

function cleanHtml(html) {
    if (!html) return '';
    return html
        .replace(/<code>/gi, '')
        .replace(/<\/code>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .trim();
}

export const TOPIC_TAGS = [
    'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
    'Sorting', 'Greedy', 'Depth-First Search', 'Database', 'Binary Search',
    'Tree', 'Breadth-First Search', 'Two Pointers', 'Stack', 'Linked List',
    'Design', 'Heap (Priority Queue)', 'Graph', 'Simulation', 'Prefix Sum',
    'Backtracking', 'Counting', 'Sliding Window', 'Union Find', 'Binary Tree',
    'Bit Manipulation', 'Recursion', 'Matrix', 'Monotonic Stack', 'Ordered Set',
];
