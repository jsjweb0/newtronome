import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../utils/role';

export function AuthAccess({ allow = [], children }) {
  const { user, loading } = useAuth();
  const role = getUserRole(user);

  if (loading) return null;

  return allow.includes(role) ? children : null;
}
