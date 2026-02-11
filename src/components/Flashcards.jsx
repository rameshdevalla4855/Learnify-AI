import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFlashcards } from '../services/gemini';
import { Loader2, RotateCw, Check, X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export default function Flashcards({ videoId, videoTitle, videoDescription }) {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await generateFlashcards(videoTitle, videoDescription);
            setCards(data.cards);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (err) {
            setError('Failed to generate flashcards. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 200);
        }
    };

    const handleFlip = () => setIsFlipped(!isFlipped);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Generating study cards for you...</p>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6">
                    <RotateCw className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Study Time!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
                    Generate instant flashcards from this video to test your knowledge and improve retention.
                </p>
                <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 px-8 py-3 text-lg rounded-full">
                    <Loader2 className="w-5 h-5" />
                    Generate Flashcards
                </button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[500px] h-full max-w-3xl mx-auto p-4 justify-center">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-600 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Card Container */}
            <div className="w-full h-[450px] relative perspective-1000 my-8">
                <div
                    onClick={handleFlip}
                    className="relative w-full h-full cursor-pointer transition-all duration-700"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                    }}
                >
                    {/* Front */}
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-colors shadow-2xl bg-white dark:bg-gray-800"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                        <span className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-6">Question</span>
                        <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar">
                            <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white leading-snug">
                                {cards[currentIndex].front}
                            </h3>
                        </div>
                        <p className="mt-6 text-sm text-gray-400">Click to flip</p>
                    </div>

                    {/* Back */}
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-primary-50 dark:bg-gray-900 border-2 border-primary-100 dark:border-primary-900 shadow-2xl"
                        style={{
                            transform: "rotateY(180deg)",
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden'
                        }}
                    >
                        <span className="text-sm font-bold text-green-600 uppercase tracking-widest mb-6">Answer</span>
                        <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar">
                            <p className="text-xl md:text-2xl text-center text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                                {cards[currentIndex].back}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-8">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="flex gap-4">
                    <button
                        onClick={handleNext}
                        className="btn-secondary rounded-full px-6 py-2"
                    >
                        Review Later
                    </button>
                    <button
                        onClick={handleNext}
                        className="btn-primary rounded-full px-6 py-2"
                    >
                        Got it!
                    </button>
                </div>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
