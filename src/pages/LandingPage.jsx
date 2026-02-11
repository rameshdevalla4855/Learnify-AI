import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BookOpen, Users, Zap, CheckCircle, Play } from 'lucide-react';

export default function LandingPage() {
    const { loginWithGoogle } = useAuth();
    console.log("LandingPage rendering");

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
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
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-primary-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30">
                            L
                        </div>
                        <span className="text-xl font-bold tracking-tight">Learnify AI</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            Sign In
                        </Link>
                        <Link to="/login" className="btn-primary px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-8 border border-primary-100 dark:border-primary-800">
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                            AI-Powered Learning Platform
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
                            Master any skill with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                                Intelligent AI Tutors
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Turn scattered resources into structured courses. Interactive quizzes, smart notes, and a community of learners—all powered by advanced AI.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/login" className="btn-primary h-14 px-8 rounded-full text-lg font-bold flex items-center gap-2 shadow-xl shadow-primary-500/20 hover:scale-105 transition-transform">
                                Start Learning Now <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="h-14 px-8 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-lg font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <Play className="w-5 h-5 fill-current" /> Watch Demo
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Why learn with Learnify?</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            We combine the best of structured education with the flexibility of self-paced learning, enhanced by cutting-edge AI.
                        </p>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                icon: BookOpen,
                                title: "Structured Courses",
                                desc: "Convert YouTube playlists into organized courses with progress tracking and milestones."
                            },
                            {
                                icon: Zap,
                                title: "AI-Generated Quizzes",
                                desc: "Test your knowledge instantly. Our AI analyzes video content to create relevant practice questions."
                            },
                            {
                                icon: Users,
                                title: "Social Learning",
                                desc: "Connect with others learning the same topic. Share notes, ask questions, and grow together."
                            }
                        ].map((feature, idx) => (
                            <motion.div key={idx} variants={itemVariants} className="bg-white dark:bg-black p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10"></div>

                        <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to accelerate your learning?</h2>
                        <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-10 relative z-10">
                            Join thousands of learners who are already mastering new skills faster with Learnify AI.
                        </p>
                        <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-colors shadow-xl relative z-10">
                            Get Started for Free <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 dark:border-gray-800 text-center text-gray-500 text-sm">
                <p>© 2024 Learnify AI. All rights reserved.</p>
            </footer>
        </div>
    );
}
