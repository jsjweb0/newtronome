import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole, type UserRole, } from '../../utils/role';

interface AuthAccessProps {
  allow?: UserRole[];
  ownerUid?: string | null;
  children: ReactNode;
}

export function AuthAccess({
  allow = [],
  ownerUid,
  children
}: AuthAccessProps) {
  const { user, loading } = useAuth();

  // UI 노출만 제어하며 실제 쓰기 권한은 Firestore Security Rules가 판단한다.
  const role = getUserRole(user);

  if (loading) return null;

  const hasAllowedRole = allow.includes(role);
  const isOwner = Boolean(
    user && ownerUid && user.uid === ownerUid
  );

  return hasAllowedRole || isOwner ? children : null;
}
