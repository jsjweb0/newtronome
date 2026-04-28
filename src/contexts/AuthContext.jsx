import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import {getFirestore, doc, setDoc, getDoc, serverTimestamp, onSnapshot} from "firebase/firestore";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "./ToastContext.jsx";

const AuthContext = createContext();

export function AuthProvider({children}) {
    const navigate = useNavigate();
    const {showToast} = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password) => {
        // 1) 이메일/비밀번호 가입
        const {user} = await createUserWithEmailAndPassword(auth, email, password);
        // 2) Firestore users/{uid} 문서 생성 (기본 정보)
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            createdAt: serverTimestamp()
        });
        return user;
    };

    const login = (email, password) =>
        signInWithEmailAndPassword(auth, email, password);

    const logout = async () => {
        try {
            await signOut(auth);

            showToast({ message: "로그아웃 되었습니다.", type: "success" });
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            showToast({ message: "로그아웃 중 오류가 발생했습니다.", type: "error" });
        }
    };

    useEffect(() => {
        let isMounted = true;
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (!isMounted) return;

            if (!authUser) {
                setUser(null);
            } else {
                try {
                    // Firestore에서 유저 프로필 읽기
                    const snap = await getDoc(doc(db, "users", authUser.uid));
                    const profile = snap.exists() ? snap.data() : {};
                    // Auth + Firestore 프로필 병합
                    setUser({
                        uid: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName,
                        photoURL: authUser.photoURL,
                        ...profile
                    });
                } catch (error) {
                    console.error("Failed to fetch user profile:", error);
                }
            }
            setLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [db]);

    const avatarUrl = useMemo(() => {
        if (!user?.email) return "";
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&size=128&length=1&background=random&color=ffffff&font-size=0.5&bold=true&uppercase=true`;
    }, [user?.email]);

    const nicknameUrl = useMemo(() => {
        // AuthContext에서 user 프로필에 nickname 필드를 병합했다면
        const name = user?.nickname || user?.displayName;
        if (!name) return "";
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&length=1&background=random&color=ffffff&font-size=0.5&bold=true`;
    }, [user?.nickname, user?.displayName]);

    useEffect(() => {
        if (!user?.uid) return;
        const userRef = doc(db, "users", user.uid);
        const unsubscribeProfile = onSnapshot(
            userRef,
            snap => {
                if (snap.exists()) {
                    setUser(prev => ({ ...prev, ...snap.data() }));
                }
            },
            error => {
                console.error("Profile onSnapshot error:", error);
            }
        );
        return unsubscribeProfile;
    }, [user?.uid]);

    return (
        <AuthContext.Provider value={{user, login, signup, logout, loading, avatarUrl, nicknameUrl}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
