import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load: check auth state
    useEffect(() => {
        let profileUnsubscribe;

        const authUnsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user ? "User logged in" : "No user");
            setCurrentUser(user);

            if (user) {
                // Listen to user profile in real-time
                const userRef = doc(db, "users", user.uid);
                profileUnsubscribe = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserProfile(doc.data());
                    } else {
                        console.log("No user profile found");
                        setUserProfile(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    setLoading(false);
                });
            } else {
                setUserProfile(null);
                if (profileUnsubscribe) profileUnsubscribe();
                setLoading(false);
            }
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    async function checkUsernameAvailability(username) {
        if (!username || username.length < 3) return false;
        const normalizedUsername = username.toLowerCase();
        const usernameRef = doc(db, "usernames", normalizedUsername);
        const usernameSnap = await getDoc(usernameRef);
        return !usernameSnap.exists();
    }

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            console.log("Initiating Google Popup...");
            const result = await signInWithPopup(auth, provider);
            console.log("Google Sign In Success. User UID:", result.user.uid);

            // Check if user exists in Firestore, if not create basic profile
            const userRef = doc(db, "users", result.user.uid);
            console.log("Checking Firestore for user doc...");
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.log("User doc does not exist. Creating new...");

                // For Google Auth, we might need a flow to set username later if we want strict uniqueness everywhere
                // For now, we'll generate a base one based on email/name, but we won't strictly reserve it in 'usernames' collection
                // to avoid collision handling complexity in this auto-flow.
                // Alternatively, we could prompt for username after login. 
                // For this implementation, we'll just skip 'usernames' reservation for Google Auth for simplicity, 
                // or use a timestamp to ensure uniqueness if critical.

                const userData = {
                    uid: result.user.uid,
                    email: result.user.email || null,
                    displayName: result.user.displayName || "User",
                    username: (result.user.email?.split('@')[0] || "user") + Math.floor(Math.random() * 10000), // Fallback unique-ish handle
                    photoURL: result.user.photoURL || null,
                    createdAt: serverTimestamp(),
                    enrolledCourses: [],
                    progress: {},
                    learningStats: {
                        videosWatched: 0,
                        quizzesTaken: 0,
                        xp: 0
                    }
                };

                try {
                    await setDoc(userRef, userData);
                    console.log("User document created successfully in Firestore.");
                } catch (dbError) {
                    console.error("FATAL: Failed to write user data to Firestore!", dbError);
                }
            }
            return result.user;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    }

    async function signup(email, password, username) {
        // 1. Check username availability first (double check)
        const normalizedUsername = username.toLowerCase();
        const isAvailable = await checkUsernameAvailability(normalizedUsername);
        if (!isAvailable) {
            throw new Error("Username is already taken.");
        }

        // 2. Create Auth User
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        try {
            // 3. Reserve Username
            await setDoc(doc(db, "usernames", normalizedUsername), {
                uid: user.uid
            });

            // 4. Create User Profile
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: username, // Initially set display name to username
                username: normalizedUsername,
                photoURL: null,
                createdAt: serverTimestamp(),
                enrolledCourses: [],
                progress: {},
                learningStats: {
                    videosWatched: 0,
                    quizzesTaken: 0,
                    xp: 0
                }
            });

            // 5. Send Verification Email
            await sendEmailVerification(user);
            console.log("Verification email sent");

        } catch (error) {
            console.error("Error setting up user profile:", error);
            // Optional: delete auth user if profile creation fails to prevent zombie accounts
            throw error;
        }

        return user;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    const value = {
        currentUser,
        userProfile,
        loginWithGoogle,
        signup,
        login,
        logout,
        checkUsernameAvailability
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
