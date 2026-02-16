import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle, XCircle, Loader2, Mail, AlertTriangle, 
    Sparkles, Lock, User, Eye, EyeOff, ArrowRight
} from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [usernameError, setUsernameError] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showVerificationSent, setShowVerificationSent] = useState(false);

    const { signup, checkUsernameAvailability, currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser && !showVerificationSent) {
            navigate('/');
        }
    }, [currentUser, navigate, showVerificationSent]);

    useEffect(() => {
        const checkUsername = async () => {
            if (username.length < 3) {
                setUsernameAvailable(null);
                setUsernameError('');
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                setUsernameAvailable(false);
                setUsernameError('Only letters, numbers, and underscores allowed.');
                return;
            }

            setIsCheckingUsername(true);
            setUsernameError('');

            try {
                const available = await checkUsernameAvailability(username);
                setUsernameAvailable(available);
                if (!available) setUsernameError('Username is already taken.');
            } catch (err) {
                console.error(err);
                setUsernameAvailable(null);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [username, checkUsernameAvailability]);

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        if (!usernameAvailable) {
            return setError('Please choose a valid and available username.');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password, username);
            setShowVerificationSent(true);
        } catch (err) {
            setError('Failed to create account: ' + err.message);
            setLoading(false);
        }
    }

    if (showVerificationSent) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8 md:p-10 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-10 h-10 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Verify your email</h2>
                        <p className="text-gray-400 mb-8">
                            We've sent a verification link to{' '}
                            <span className="text-white font-medium">{email}</span>. 
                            <br className="hidden sm:block" />
                            Please check your inbox and verify your account to continue.
                        </p>
                        <Link 
                            to="/login" 
                            className="w-full flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                        >
                            Back to Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-orange-500/30 rounded-full blur-[150px] animate-pulse delay-1000" />
                </div>
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">Learnify</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                            Start your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                                learning journey
                            </span>
                        </h1>

                        <p className="text-lg text-gray-400 mb-8 max-w-md">
                            Join thousands of learners who are mastering new skills with AI-powered courses and personalized tutoring.
                        </p>

                        {/* Features List */}
                        <div className="space-y-4">
                            {[
                                'Transform YouTube playlists into courses',
                                'Get AI-generated quizzes and notes',
                                'Track progress with gamification'
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                                    </div>
                                    <span className="text-gray-300">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                {/* Mobile Logo */}
                <div className="lg:hidden absolute top-8 left-8">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Learnify</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8 md:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                Create your account
                            </h2>
                            <p className="text-gray-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                                            usernameAvailable === false 
                                                ? 'border-red-500/50 focus:ring-red-500/20' 
                                                : usernameAvailable === true 
                                                    ? 'border-green-500/50 focus:ring-green-500/20' 
                                                    : 'border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20'
                                        }`}
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {isCheckingUsername && <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />}
                                        {!isCheckingUsername && usernameAvailable === true && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        {!isCheckingUsername && usernameAvailable === false && <XCircle className="w-5 h-5 text-red-500" />}
                                    </div>
                                </div>
                                {usernameError && <p className="mt-2 text-xs text-red-400">{usernameError}</p>}
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Confirm
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <p className="text-xs text-gray-500">
                                By signing up, you agree to our{' '}
                                <a href="#" className="text-orange-400 hover:text-orange-300">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-orange-400 hover:text-orange-300">Privacy Policy</a>.
                            </p>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !usernameAvailable}
                                className="w-full flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-[#0a0a0f] px-4 text-sm text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-3 h-12 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
