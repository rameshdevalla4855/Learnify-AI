const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function chatWithGemini(prompt, history = [], config = {}) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key') {
        throw new Error("Gemini API Key is missing. Please check your .env file.");
    }

    // Format history for Gemini API (user/model roles)
    const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }]
    }));

    // Add current prompt
    contents.push({
        role: 'user',
        parts: [{ text: prompt }]
    });

    try {
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4000,
                    ...config
                }
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Gemini API Rate Limit Exceeded. Please wait a moment before trying again.");
            }
            const err = await response.json();
            throw new Error(err.error?.message || "Gemini API request failed");
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

export async function generateQuiz(topic, difficulty = "medium") {
    const prompt = `Generate a 5-question multiple choice quiz about "${topic}". 
    Format the output as a valid JSON object with the following structure:
    {
        "questions": [
            {
                "question": "Question text",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "A",
                "explanation": "Why it is correct"
            }
        ]
    }
    Do not include markdown formatting like \`\`\`json. Return only the JSON.`;

    const response = await chatWithGemini(prompt, [], { responseMimeType: "application/json" });

    // Improved JSON extraction
    try {
        // Find the JSON object within the text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : response;

        // Clean up any remaining markdown or whitespace
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse Quiz JSON. Raw response:", response);
        throw new Error("Failed to generate valid quiz. Please try again.");
    }
}

export async function generateSummary(text) {
    const prompt = `Provide a concise structured summary of the following content, highlighting key learning points, definitions, and takeaways:\n\n${text}`;
    return chatWithGemini(prompt);
}

export async function generateReply(title, content) {
    const prompt = `Draft a helpful, polite, and constructive reply to the following discussion post:\n\nTitle: ${title}\nContent: ${content}`;
    return chatWithGemini(prompt);
}

export async function generateRoadmap(topic) {
    const prompt = `Create a structured learning roadmap for: "${topic}".
    Format the output as a valid JSON object with the following structure:
    {
        "title": "Learning Path Title",
        "description": "Brief overview of this roadmap",
        "steps": [
            {
                "id": "step-1",
                "title": "Step Title",
                "description": "What to learn in this step",
                "searchQuery": "YouTube search query for this step"
            }
        ]
    }
    The roadmap should have 5-7 progressive steps. Return only the JSON.`;

    const response = await chatWithGemini(prompt, [], { responseMimeType: "application/json" });

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : response;
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse Roadmap JSON:", response);
        throw new Error("Failed to generate roadmap. Please try again.");
    }
}

export async function generateFlashcards(topic) {
    const prompt = `Create 5 study flashcards for the topic: "${topic}".
    Format the output as a valid JSON object with the following structure:
    {
        "cards": [
            {
                "id": "1",
                "front": "Question or concept",
                "back": "Answer or explanation",
                "difficulty": "medium"
            }
        ]
    }
    Return only the JSON.`;

    const response = await chatWithGemini(prompt, [], { responseMimeType: "application/json" });

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : response;
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse Flashcards JSON:", response);
        throw new Error("Failed to generate flashcards.");
    }
}
