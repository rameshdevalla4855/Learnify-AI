const API_KEY = 'AIzaSyCzsxiDD6G8WQZXzqhcypTpnzGd2rq-LQg';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        const response = await fetch(url);
        const json = await response.json();

        if (json.models) {
            console.log("--- START MODELS ---");
            json.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(m.name);
                }
            });
            console.log("--- END MODELS ---");
        } else {
            console.log("Error:", JSON.stringify(json, null, 2));
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

listModels();
