import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../utils/role';

interface AuthAccessProps {
  allow?: Array<string | null>;
  children: ReactNode;
}

export function AuthAccess({ allow = [], children }: AuthAccessProps) {
  const { user, loading } = useAuth();
  const role = getUserRole(user);

  if (loading) return null;

  return allow.includes(role) ? children : null;
}
