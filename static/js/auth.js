// Import necessary functions from Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBsuJ1ksDev_VdHW2oRIhDHDHL5QeyK3_0",
    authDomain: "portfolio-6bc7d.firebaseapp.com",
    projectId: "portfolio-6bc7d",
    storageBucket: "portfolio-6bc7d.appspot.com",
    messagingSenderId: "977727425718",
    appId: "1:977727425718:web:f87707a0c2bb20c76cea17",
    measurementId: "G-LHFTHCHT17"
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