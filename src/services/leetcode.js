const BASE_URL = 'https://alfa-leetcode-api.onrender.com';

export const leetcodeService = {
    // Fetch list of problems
    getProblems: async (limit = 20, skip = 0) => {
        try {
            const response = await fetch(`${BASE_URL}/problems?limit=${limit}&skip=${skip}`);
            if (!response.ok) throw new Error('Failed to fetch problems');
            const data = await response.json();
            return data.problemsetQuestionList;
        } catch (error) {
            console.error('Error fetching problems:', error);
            return [];
        }
    },

    // Fetch problems by topic
    getProblemsByTopic: async (topicSlug, limit = 20, skip = 0) => {
        try {
            // API endpoint might be different for topic filtering
            // Commonly it is /topic/:topicSlug
            // But let's check if we can filter via query params on /problems
            // If not available, we might have to use a specific endpoint if known
            // Based on similar APIs, trying /problems?tags=topicSlug
            // OR /topicTag/:topicSlug
            const response = await fetch(`${BASE_URL}/topicTag/${topicSlug}?limit=${limit}&skip=${skip}`);
            // Fallback strategy if failing: just fetch standard list and client-side filter (limitations apply)
            if (!response.ok) {
                // Try alternative route or fallback
                console.warn(`Failed to fetch by topic ${topicSlug}, falling back to general list`);
                return [];
            }
            const data = await response.json();
            // Normalized return format
            return data.data?.topicTag?.questions || data.questions || [];
        } catch (error) {
            console.error(`Error fetching problems for topic ${topicSlug}:`, error);
            return [];
        }
    },

    // Fetch specific problem details
    getProblemDetails: async (titleSlug) => {
        try {
            // Note: The API might have different endpoints for different data
            // We'll try to fetch description and hopefully snippets if available
            // standard select endpoint for this API seems to be /select
            const response = await fetch(`${BASE_URL}/select?titleSlug=${titleSlug}`);
            if (!response.ok) throw new Error('Failed to fetch problem details');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching problem details:', error);
            return null;
        }
    },

    // Helper to normalize difficulty color
    getDifficultyColor: (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'text-green-400 bg-green-400/10';
            case 'medium': return 'text-yellow-400 bg-yellow-400/10';
            case 'hard': return 'text-red-400 bg-red-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    }
};
