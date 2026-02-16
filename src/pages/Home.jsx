import { useState, useEffect, lazy, Suspense } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';
import { 
    Search, Youtube, Users, MessageSquare, BookOpen, Clock, ArrowRight, 
    PlayCircle, Sparkles, Zap, Trophy, Code, Brain, Target, Star,
    ChevronRight, TrendingUp, Award, Globe, Rocket, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

const CourseCard = ({ course }) => (
    <Link to={`/course/${course.id}`} className="group block h-full">
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl overflow-hidden h-full flex flex-col border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-lg text-[10px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Youtube className="w-3 h-3 text-red-500" />
                        {course.videos?.length || 0} videos
                    </span>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                        <PlayCircle className="w-7 h-7 text-orange-500" />
                    </div>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-orange-500 transition-colors text-sm">
                    {course.title}
                </h3>
                <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700/50">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently added'}
                    </span>
                    <span className="text-orange-500 font-medium flex items-center gap-1">
                        Start <ChevronRight className="w-3 h-3" />
                    </span>
                </div>
            </div>
        </div>
    </Link>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all group">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
    </div>
);

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all group">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

export default function Home() {
    const [recentCourses, setRecentCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecent() {
            try {
                const q = query(collection(db, "courses"), orderBy("createdAt", "desc"), limit(4));
                const snapshot = await getDocs(q);
                setRecentCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching recent courses:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRecent();
    }, []);

    return (
        <div className="space-y-12 pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="relative -mt-8 pt-8 pb-16 md:pt-16 md:pb-24 px-4">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/5 to-purple-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 dark:text-orange-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            AI-Powered Learning Platform
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                            Learn Smarter with
                            <span className="block mt-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                                AI-Powered Courses
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Transform YouTube playlists into structured courses with interactive quizzes, 
                            smart notes, and personalized AI tutoring.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link 
                                to="/add-course" 
                                className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-semibold text-lg shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-5 h-5" />
                                Start Learning
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link 
                                to="/playground" 
                                className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500/50 text-gray-900 dark:text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Code className="w-5 h-5 text-orange-500" />
                                Code Playground
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto px-4"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Youtube} label="YouTube Import" value="Instant" color="from-red-500 to-rose-500" />
                    <StatCard icon={Brain} label="AI Quizzes" value="Unlimited" color="from-purple-500 to-violet-500" />
                    <StatCard icon={Users} label="Community" value="Active" color="from-blue-500 to-cyan-500" />
                    <StatCard icon={Trophy} label="Coding" value="Contests" color="from-amber-500 to-orange-500" />
                </div>
            </motion.section>

            {/* Features Section */}
            <section className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Powerful Features</h2>
                    <p className="text-gray-500 dark:text-gray-400">Everything you need to accelerate your learning</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    <FeatureCard 
                        icon={Sparkles} 
                        title="AI-Generated Quizzes" 
                        desc="Automatically create interactive quizzes from video content to test your understanding."
                        color="from-orange-500 to-amber-500"
                    />
                    <FeatureCard 
                        icon={BookOpen} 
                        title="Smart Notes" 
                        desc="AI extracts key concepts and generates comprehensive notes from lectures."
                        color="from-blue-500 to-cyan-500"
                    />
                    <FeatureCard 
                        icon={Code} 
                        title="Code Playground" 
                        desc="Practice coding with 12+ languages, instant execution, and LeetCode problems."
                        color="from-purple-500 to-violet-500"
                    />
                </div>
            </section>

            {/* Recent Courses */}
            <section className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-between items-end mb-8"
                >
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recent Courses</h2>
                        <p className="text-gray-500 mt-2">Start learning from the latest additions</p>
                    </div>
                    <Link to="/my-courses" className="text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1 group">
                        View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recentCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                        <p className="text-gray-500 mb-6">Create your first course from a YouTube playlist</p>
                        <Link to="/add-course" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold transition-colors">
                            <Plus className="w-5 h-5" />
                            Create Course
                        </Link>
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
                        <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                            Join thousands of learners who are already using Learnify AI to accelerate their education.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/add-course" className="px-8 py-4 bg-white text-orange-500 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                                Get Started Free
                            </Link>
                            <Link to="/communities" className="px-8 py-4 bg-white/20 backdrop-blur text-white border border-white/30 rounded-xl font-semibold text-lg hover:bg-white/30 transition-colors">
                                Join Community
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
