// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDZ93t9mjOH2pKSp4l2beSM1twYgndIjhA",
    authDomain: "free-board-15f7f.firebaseapp.com",
    projectId: "free-board-15f7f",
    storageBucket: "free-board-15f7f.firebasestorage.app",
    messagingSenderId: "644268129480",
    appId: "1:644268129480:web:e02a42f31c77c081fbf9fd",
    measurementId: "G-CD6XQGJ3ME"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);