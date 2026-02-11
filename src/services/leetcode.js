import { cacheProblems } from './problemCacheService';

const BASE_URL = 'https://alfa-leetcode-api.onrender.com';

export const leetcodeService = {
    /**
     * Raw fetch from API — returns array of problems or [].
     */
    getProblems: async (limit = 20, skip = 0) => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch(
                `${BASE_URL}/problems?limit=${limit}&skip=${skip}`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`API ${response.status}`);
            const data = await response.json();
            return data.problemsetQuestionList || [];
        } catch (error) {
            console.error('Error fetching problems:', error.message);
            return [];
        }
    },

    /**
     * Fetch problems from API and cache them in Firestore.
     * Returns { problems, fromApi: true/false }.
     */
    fetchAndCacheProblems: async (limit = 50, skip = 0) => {
        try {
            const problems = await leetcodeService.getProblems(limit, skip);
            if (problems.length > 0) {
                // Cache in background — don't block the return
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

    /**
     * Fetch specific problem details by slug.
     */
    getProblemDetails: async (titleSlug) => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(
                `${BASE_URL}/select?titleSlug=${titleSlug}`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            if (!response.ok) throw new Error('Failed to fetch problem details');
            return await response.json();
        } catch (error) {
            console.error('Error fetching problem details:', error.message);
            return null;
        }
    },

    getDifficultyColor: (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'text-green-400 bg-green-400/10';
            case 'medium': return 'text-yellow-400 bg-yellow-400/10';
            case 'hard': return 'text-red-400 bg-red-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    }
};
