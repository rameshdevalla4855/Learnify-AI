const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function fetchPlaylistDetails(playlistId) {
    if (!API_KEY || API_KEY === 'your_youtube_api_key') {
        throw new Error("YouTube API Key is missing. Please check your .env file.");
    }

    const response = await fetch(
        `${BASE_URL}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch playlist details');
    }

    const data = await response.json();
    if (data.items.length === 0) {
        throw new Error('Playlist not found');
    }

    return data.items[0];
}

export async function fetchPlaylistItems(playlistId, pageToken = '') {
    if (!API_KEY || API_KEY === 'your_youtube_api_key') {
        throw new Error("YouTube API Key is missing.");
    }

    const response = await fetch(
        `${BASE_URL}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${pageToken}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch playlist items');
    }

    return await response.json();
}

export async function searchPlaylists(query) {
    if (!API_KEY || API_KEY === 'your_youtube_api_key') {
        throw new Error("YouTube API Key is missing.");
    }

    const response = await fetch(
        `${BASE_URL}/search?part=snippet&type=playlist&q=${encodeURIComponent(query)}&maxResults=10&key=${API_KEY}`
    );

    if (!response.ok) {
        throw new Error('Failed to search playlists');
    }

    const data = await response.json();
    return data.items;
}

// Extract Playlist ID from URL
export function getPlaylistIdFromUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get("list");
    } catch (e) {
        return null;
    }
}
