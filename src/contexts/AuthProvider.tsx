import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';

import { AuthContext } from './AuthContext';
import type {
    AuthContextValue,
    AuthUser,
} from './AuthContext';
import { useToast } from './ToastContext';
import { useNavigate } from 'react-router-dom';

interface AuthProviderProps {
    children: ReactNode;
}

interface UserProfile {
    nickname?: string | null;
    photoURL?: string | null;
    createdAt?: Timestamp | Date | null;
}

function normalizeUserProfile(data: DocumentData): UserProfile {
    return {
        nickname:
            typeof data.nickname === 'string' ? data.nickname : null,
        photoURL:
            typeof data.photoURL === 'string' ? data.photoURL : null,
        createdAt:
            data.createdAt instanceof Date ||
                typeof data.createdAt?.toDate === 'function'
                ? data.createdAt
                : null,
    };
}

export function AuthProvider({ children }: AuthProviderProps) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const signup: AuthContextValue['signup'] = async (email, password) => {
        // 1) 이메일/비밀번호 가입
        const { user } = await createUserWithEmailAndPassword(auth, email, password);

        // 2) Firestore users/{uid} 문서 생성 (기본 정보)
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            createdAt: serverTimestamp()
        });

        return user;
    };

    const login: AuthContextValue['login'] = (email, password) =>
        signInWithEmailAndPassword(auth, email, password);

    const logout: AuthContextValue['logout'] = async () => {
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
                    const profile = snap.exists() ? normalizeUserProfile(snap.data()) : {};
                    // Auth + Firestore 프로필 병합
                    setUser({
                        uid: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName,
                        photoURL: profile.photoURL ?? authUser.photoURL,
                        nickname: profile.nickname,
                        createdAt: profile.createdAt,
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
    }, []);

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
                    setUser((previousUser) => {
                        if (!previousUser) return null;

                        const profile = normalizeUserProfile(snap.data());

                        return {
                            ...previousUser,
                            ...profile,
                            photoURL: profile.photoURL ?? previousUser.photoURL,
                        };
                    });
                }
            },
            error => {
                console.error("Profile onSnapshot error:", error);
            }
        );
        return unsubscribeProfile;
    }, [user?.uid]);

    const contextValue: AuthContextValue = {
        user,
        login,
        signup,
        logout,
        loading,
        avatarUrl,
        nicknameUrl,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}
