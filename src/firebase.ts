// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
// Analytics는 지원되는 브라우저에서만 켬 (테스트·SSR·쿠키 차단 환경에서 import만으로 에러가 나지 않게)
export const analytics: Promise<Analytics | null> = isSupported()
    .then((supported) => (supported ? getAnalytics(app) : null))
    .catch(() => null);
export const auth = getAuth(app);
export const db = getFirestore(app);
