import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User, BookOpen, Award, BarChart2, Edit2, Save } from 'lucide-react';

export default function Profile() {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            if (!currentUser) return;
            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile(data);
                    setBio(data.bio || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [currentUser]);

    async function handleSave() {
        setEditing(false);
        if (!currentUser) return;
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                bio: bio
            }, { merge: true });
            setProfile(prev => ({ ...prev, bio }));
            alert("Bio saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save bio. Please check your connection.");
        }
    }

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                    {currentUser.photoURL ?
                        <img src={currentUser.photoURL} alt="Profile" className="h-full w-full object-cover" /> :
                        <User className="h-10 w-10 text-gray-500" />
                    }
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser.displayName || "Student"}</h1>
                    <p className="text-gray-500">{currentUser.email}</p>
                    {editing ? (
                        <div className="mt-2">
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                                placeholder="Tell us about yourself..."
                                rows={2}
                            />
                            <button onClick={handleSave} className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    ) : (
                        <div className="mt-2">
                            <p className="text-gray-600 dark:text-gray-300 text-sm">{profile?.bio || "No bio yet."}</p>
                            <button onClick={() => setEditing(true)} className="mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> Edit Bio
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.learningStats?.videosWatched || 0}</h3>
                            <p className="text-sm text-gray-500">Videos Watched</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.learningStats?.quizzesTaken || 0}</h3>
                            <p className="text-sm text-gray-500">Quizzes Taken</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.learningStats?.xp || 0} XP</h3>
                            <p className="text-sm text-gray-500">Experience Points</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enrolled Courses (Placeholder logic for MVP) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Learning Journey</h2>
                <p className="text-gray-500 text-sm">Track your progress across courses here.</p>
                {/* List of courses would go here */}
            </div>
        </div>
    );
}
