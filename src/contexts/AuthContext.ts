import { createContext, useContext } from 'react';
import type { User, UserCredential } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  nickname?: string | null;
  createdAt?: Timestamp | Date | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, nickname?: string, photoURL?: string) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
  avatarUrl: string;
  nicknameUrl: string;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 <AuthProvider> 안에서 사용해야 합니다.');
  }

  return context;
}
