import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
    doc,
    getDoc,
    onSnapshot,
} from 'firebase/firestore';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    getIdTokenResult,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
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
    const authRequestIdRef = useRef(0);
    const signup: AuthContextValue['signup'] = async (email, password) => {
        const { user } = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );

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
            const requestId = ++authRequestIdRef.current;

            if (!isMounted) return;

            if (!authUser) {
                setUser(null);
            } else {
                const creationTime = authUser.metadata.creationTime;
                const parsedCreationDate = creationTime
                    ? new Date(creationTime)
                    : null;

                const accountCreatedAt =
                    parsedCreationDate && !Number.isNaN(parsedCreationDate.getTime())
                        ? parsedCreationDate
                        : null;

                try {
                    // Firestore 프로필과 Firebase Auth Claim을 함께 읽기
                    const [snap, tokenResult] = await Promise.all([
                        getDoc(doc(db, 'users', authUser.uid)),
                        getIdTokenResult(authUser),
                    ]);

                    if (
                        !isMounted ||
                        requestId !== authRequestIdRef.current
                    ) {
                        return;
                    }

                    const profile = snap.exists()
                        ? normalizeUserProfile(snap.data())
                        : {};

                    setUser({
                        uid: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName,
                        photoURL: profile.photoURL ?? authUser.photoURL,
                        isAdmin: tokenResult.claims.admin === true,
                        nickname: profile.nickname,
                        createdAt: profile.createdAt ?? accountCreatedAt,
                    });
                } catch (error) {
                    if (
                        !isMounted ||
                        requestId !== authRequestIdRef.current
                    ) {
                        return;
                    }

                    console.error('Failed to fetch user profile:', error);

                    setUser({
                        uid: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName,
                        photoURL: authUser.photoURL,
                        isAdmin: false,
                        createdAt: accountCreatedAt,
                    });
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
        const subscribedUserId = user?.uid;

        if (!subscribedUserId) return;

        const userRef = doc(db, 'users', subscribedUserId);

        const unsubscribeProfile = onSnapshot(
            userRef,
            snap => {
                if (snap.exists()) {
                    setUser((previousUser) => {
                        if (
                            !previousUser ||
                            previousUser.uid !== subscribedUserId
                        ) {
                            return previousUser;
                        }

                        const profile = normalizeUserProfile(snap.data());

                        return {
                            ...previousUser,
                            ...profile,
                            displayName: profile.nickname ?? previousUser.displayName,
                            createdAt: profile.createdAt ?? previousUser.createdAt,
                            photoURL: profile.photoURL ?? previousUser.photoURL,
                        };
                    });
                }
            },
            error => {
                console.error('Profile onSnapshot error:', error);
                showToast({
                    message: '프로필 자동 동기화가 중단됐습니다. 새로고침해주세요.',
                    type: 'error',
                });
            }
        );
        return unsubscribeProfile;
    }, [user?.uid, showToast]);

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
