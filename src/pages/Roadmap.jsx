import { useState } from 'react';
import { motion } from 'framer-motion';
import { generateRoadmap } from '../services/gemini';
import { Search, Map, ChevronRight, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Roadmap() {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState(null);
    const navigate = useNavigate();

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        try {
            const data = await generateRoadmap(topic);
            setRoadmap(data);
        } catch (error) {
            console.error("Failed to generate roadmap:", error);
            // In a real app, show toast error
        } finally {
            setLoading(false);
        }
    };

    const handleStartStep = (searchQuery) => {
        // Navigate to Add Course page with this query to find videos
        navigate(`/add-course?q=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 mb-4">
                    AI Learning Roadmap
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Enter any skill or topic you want to master, and our AI will chart a personalized step-by-step path for you.
                </p>
            </div>

            {/* Input Section */}
            <div className="max-w-2xl mx-auto mb-16">
                <form onSubmit={handleGenerate} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                    <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-xl text-lg shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                        <Map className="ml-6 w-6 h-6 text-gray-400" />
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Full Stack Web Development, Machine Learning..."
                            className="flex-1 bg-transparent border-0 px-4 py-6 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:leading-6"
                        />
                        <button
                            type="submit"
                            disabled={loading || !topic.trim()}
                            className="mr-2 btn-primary rounded-lg px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    Generate
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Roadmap Display */}
            {roadmap && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-2xl border border-primary-100 dark:border-primary-800/50 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{roadmap.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300">{roadmap.description}</p>
                    </div>

                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                        <div className="space-y-8">
                            {roadmap.steps.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative flex gap-6 group"
                                >
                                    {/* Number Circle */}
                                    <div className="hidden sm:flex shrink-0 w-16 h-16 rounded-full bg-white dark:bg-gray-900 border-4 border-primary-100 dark:border-primary-900 items-center justify-center z-10 shadow-sm group-hover:border-primary-500 transition-colors">
                                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{index + 1}</span>
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 glass-card p-6 rounded-2xl hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                    <span className="sm:hidden bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-sm">Step {index + 1}</span>
                                                    {step.title}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleStartStep(step.searchQuery)}
                                                className="btn-secondary whitespace-nowrap flex items-center gap-2 self-start md:self-center"
                                            >
                                                <Search className="w-4 h-4" />
                                                Find Courses
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
