import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { chatWithGemini } from '../services/gemini';

export default function AIChat({ videoTitle, videoDescription, courseTitle, courseId, videoId }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false); // Auto-read responses

    const bottomRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                // Auto-submit could be an option here, but better to let user review
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Reset chat when video changes
    useEffect(() => {
        setMessages([]);
        setError('');
        setInput('');
        cancelSpeech();
    }, [videoId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setInput('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return;

        cancelSpeech();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const cancelSpeech = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const toggleVoiceMode = () => {
        const newMode = !voiceMode;
        setVoiceMode(newMode);
        if (!newMode) cancelSpeech();
    };

    async function handleSubmit(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setError('');
        setMessages(prev => [...prev, { role: 'user', message: userMessage }]);
        setLoading(true);

        try {
            let prompt = userMessage;
            if (messages.length === 0) {
                prompt = `Context: Course "${courseTitle}", Video "${videoTitle}". Description: ${videoDescription?.slice(0, 500)}...\n\nUser Question: ${userMessage}`;
            }

            const response = await chatWithGemini(prompt, messages);

            setMessages(prev => [...prev, { role: 'model', message: response }]);

            if (voiceMode) {
                speakText(response);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to get response from AI.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Tutor</h3>
                    {isSpeaking && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleVoiceMode}
                        className={`p-1.5 rounded-full transition-colors ${voiceMode ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title={voiceMode ? "Mute Voice Response" : "Enable Voice Response"}
                    >
                        {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                    <span className="text-xs text-gray-500">Powered by Gemini</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Ask anything about this video!</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
              max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm
              ${msg.role === 'user'
                                ? 'bg-primary-600 text-white rounded-tr-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'}
            `}>
                            {msg.message}
                            {msg.role === 'model' && (
                                <button
                                    onClick={() => speakText(msg.message)}
                                    className="block mt-2 opacity-50 hover:opacity-100"
                                >
                                    <Volume2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 rounded-tl-sm flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                            <span className="text-xs text-gray-500">Thinking...</span>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="text-center text-red-500 text-xs p-2">{error}</div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2 rounded-full transition-all ${isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-gray-700'
                            }`}
                        title="Speak to AI"
                    >
                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
