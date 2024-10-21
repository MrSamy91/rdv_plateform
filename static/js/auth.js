// Import necessary functions from Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google Sign-In button event listener
document.getElementById('login-google').addEventListener('click', async () => {
    try {
        // Sign in with a popup
        const result = await signInWithPopup(auth, provider);
        
        // The signed-in user info
        const user = result.user;
        console.log("User signed in:", user);
        
        // Redirect or update the interface as needed
        alert("Successfully signed in as: " + user.displayName);
        
        // Example redirect after sign-in (change '/some-path' to your desired path)
        // window.location.href = '/some-path';
    } catch (error) {
        // Handle errors
        console.error("Sign-in error:", error);
        alert("Error during sign-in.");
    }
});
