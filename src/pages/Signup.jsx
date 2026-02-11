import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, AlertTriangle } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Username check states
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false
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

    // Debounce username check
    useEffect(() => {
        const checkUsername = async () => {
            if (username.length < 3) {
                setUsernameAvailable(null);
                setUsernameError('');
                return;
            }

            // Simple regex for valid username (alphanumeric + underscores)
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
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center"
                >
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verify your email</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        We've sent a verification link to <span className="font-semibold text-gray-900 dark:text-white">{email}</span>. Please check your inbox and verify your account to continue.
                    </p>
                    <Link to="/login" className="btn-primary w-full py-3 rounded-lg block font-semibold">
                        Back to Login
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8"
            >
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Username
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600
                                        ${usernameAvailable === false ? 'ring-red-300 focus:ring-red-500' :
                                            usernameAvailable === true ? 'ring-green-300 focus:ring-green-500' : 'ring-gray-300 focus:ring-primary-600'}
                                    `}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    {isCheckingUsername && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                                    {!isCheckingUsername && usernameAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {!isCheckingUsername && usernameAvailable === false && <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                            </div>
                            {usernameError && <p className="mt-1 text-xs text-red-500">{usernameError}</p>}
                            <p className="mt-1 text-xs text-gray-500">Unique handle for your profile url.</p>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirm
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || !usernameAvailable}
                                className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
