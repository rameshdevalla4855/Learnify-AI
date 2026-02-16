import { useState } from 'react';
import { motion } from 'framer-motion';
import { generateRoadmap } from '../services/gemini';
import { 
    Search, Map, ChevronRight, BookOpen, Loader2, ArrowRight,
    Sparkles, Clock, Target, Zap, CheckCircle, PlayCircle,
    Lightbulb, Rocket, GraduationCap, Code, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SUGGESTED_TOPICS = [
    { topic: 'Full Stack Web Development', icon: Code, color: 'from-blue-500 to-cyan-500' },
    { topic: 'Machine Learning', icon: Brain, color: 'from-purple-500 to-violet-500' },
    { topic: 'Data Science', icon: Target, color: 'from-emerald-500 to-green-500' },
    { topic: 'Mobile App Development', icon: Rocket, color: 'from-orange-500 to-amber-500' },
];

export default function Roadmap() {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState(null);
    const [completedSteps, setCompletedSteps] = useState([]);
    const navigate = useNavigate();

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        try {
            const data = await generateRoadmap(topic);
            setRoadmap(data);
            setCompletedSteps([]);
        } catch (error) {
            console.error("Failed to generate roadmap:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartStep = (searchQuery, stepId) => {
        if (!completedSteps.includes(stepId)) {
            setCompletedSteps(prev => [...prev, stepId]);
        }
        navigate(`/add-course?q=${encodeURIComponent(searchQuery)}`);
    };

    const handleSuggestedTopic = (suggestedTopic) => {
        setTopic(suggestedTopic);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 dark:text-orange-400 text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Learning Paths
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                    Learning Roadmap
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Enter any skill you want to master, and our AI will create a personalized step-by-step learning path
                </p>
            </div>

            {/* Input Section */}
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleGenerate}>
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-2 border border-gray-200 dark:border-gray-700/50 shadow-lg shadow-gray-500/5">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 ml-2">
                                <Map className="w-5 h-5 text-white" />
                            </div>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Full Stack Web Development, Machine Learning..."
                                className="flex-1 bg-transparent border-0 px-4 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 focus:outline-none text-base"
                            />
                            <button
                                type="submit"
                                disabled={loading || !topic.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="hidden sm:inline">Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span className="hidden sm:inline">Generate</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Suggested Topics */}
            {!roadmap && (
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-4">
                        <span className="text-sm text-gray-500">Quick start suggestions</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SUGGESTED_TOPICS.map((s, idx) => (
                            <motion.button
                                key={s.topic}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleSuggestedTopic(s.topic)}
                                className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all text-left"
                            >
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <s.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                    {s.topic}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Roadmap Display */}
            {roadmap && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Progress Bar */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                            <span className="text-sm text-orange-500 font-semibold">
                                {completedSteps.length} / {roadmap.steps?.length || 0} steps
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(completedSteps.length / (roadmap.steps?.length || 1)) * 100}%` }}
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Roadmap Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{roadmap.title}</h2>
                            <p className="text-white/80">{roadmap.description}</p>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="flex items-center gap-2 text-sm text-white/80">
                                    <Clock className="w-4 h-4" />
                                    {roadmap.steps?.length || 0} steps
                                </span>
                                <span className="flex items-center gap-2 text-sm text-white/80">
                                    <GraduationCap className="w-4 h-4" />
                                    Beginner to Advanced
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

                        <div className="space-y-6">
                            {roadmap.steps?.map((step, index) => {
                                const isCompleted = completedSteps.includes(step.id);
                                return (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative flex gap-4 sm:gap-6 group"
                                    >
                                        {/* Number Circle */}
                                        <div className={`hidden sm:flex shrink-0 w-12 h-12 rounded-full items-center justify-center z-10 transition-all ${
                                            isCompleted 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 group-hover:border-orange-500'
                                        }`}>
                                            {isCompleted ? (
                                                <CheckCircle className="w-6 h-6" />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>
                                            )}
                                        </div>

                                        {/* Content Card */}
                                        <div className={`flex-1 bg-white dark:bg-gray-800/50 rounded-2xl p-5 border transition-all ${
                                            isCompleted 
                                                ? 'border-emerald-200 dark:border-emerald-500/30' 
                                                : 'border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30'
                                        } hover:shadow-lg transition-all`}>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="sm:hidden text-xs font-semibold text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full">
                                                            Step {index + 1}
                                                        </span>
                                                        {isCompleted && (
                                                            <span className="text-xs font-semibold text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleStartStep(step.searchQuery || step.title, step.id)}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                                                        isCompleted
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                                            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20'
                                                    }`}
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    {isCompleted ? 'Continue' : 'Start Learning'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl p-6 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="relative z-10">
                            <Lightbulb className="w-10 h-10 mx-auto mb-4 opacity-80" />
                            <h3 className="text-xl font-bold mb-2">Want a Different Path?</h3>
                            <p className="text-white/80 mb-4">Generate another roadmap for a different skill or topic</p>
                            <button
                                onClick={() => { setRoadmap(null); setTopic(''); }}
                                className="px-6 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-colors"
                            >
                                Create New Roadmap
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
