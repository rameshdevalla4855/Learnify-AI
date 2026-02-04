const fs = require('fs');
const API_KEY = 'AIzaSyCzsxiDD6G8WQZXzqhcypTpnzGd2rq-LQg';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        const response = await fetch(url);
        const json = await response.json();

        if (json.models) {
            const names = json.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name)
                .join('\n');
            fs.writeFileSync('models_list.txt', names);
            console.log("Saved to models_list.txt");
        } else {
            fs.writeFileSync('models_list.txt', JSON.stringify(json));
        }
    } catch (error) {
        fs.writeFileSync('models_list.txt', error.toString());
    }
}

listModels();
