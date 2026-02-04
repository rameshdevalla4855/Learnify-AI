import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';
import { Search, Youtube, Users, MessageSquare, BookOpen, Clock, ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <div className="space-y-16 pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="relative -mt-8 pt-20 pb-32 px-4 text-center">
                {/* Background Decor */}
                <div className="absolute inset-0 z-0 bg-grid-pattern opacity-[0.4] pointer-events-none"></div>
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-[100px] animate-float pointer-events-none"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-[120px] animate-float-delayed pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                            Master any subject with <br />
                            <span className="text-gradient">AI-Powered Learning</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Turn YouTube playlists into structured courses with interactive quizzes, smart notes, and an intelligent AI tutor.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link to="/add-course" className="btn-primary px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 group">
                            Start Learning Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/communities" className="btn-secondary px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2">
                            Join Community
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Stats */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4"
            >
                {[
                    { icon: Youtube, label: "Youtube Import", value: "Instant" },
                    { icon: Sparkles, label: "AI Quizzes", value: "Unlimited" },
                    { icon: Users, label: "Community", value: "Active" },
                    { icon: BookOpen, label: "Learning", value: "Structured" },
                ].map((stat, idx) => (
                    <div key={idx} className="glass-card p-6 rounded-2xl text-center space-y-2">
                        <div className="inline-flex p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-2">
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                        <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    </div>
                ))}
            </motion.section>

            {/* Recent Courses */}
            <section className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recent Courses</h2>
                        <p className="text-gray-500 mt-2">Pick up where others left off</p>
                    </div>
                    <Link to="/my-courses" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 group">
                        View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {recentCourses.map(course => (
                            <motion.div key={course.id} variants={itemVariants}>
                                <Link to={`/courses/${course.id}`} className="group block h-full">
                                    <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col hover:-translate-y-2 transition-transform duration-300">
                                        <div className="relative aspect-video overflow-hidden">
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700/50">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {course.videos?.length || 0} videos
                                                </span>
                                                <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full">
                                                    Start Learning
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </section>
        </div>
    );
}
