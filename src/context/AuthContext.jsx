import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load: check auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user ? "User logged in" : "No user");
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

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
                const userData = {
                    uid: result.user.uid,
                    email: result.user.email || null,
                    displayName: result.user.displayName || "User",
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
                    // Do not throw here, allow login to proceed even if DB write fails (but user profile might be broken)
                }
            } else {
                console.log("User doc exists. Skipping creation.");
            }
            return result.user;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    }

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    const value = {
        currentUser,
        loginWithGoogle,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
