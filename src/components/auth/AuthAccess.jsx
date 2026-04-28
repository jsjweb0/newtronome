import { useAuth } from "../../contexts/useAuth.js";
import { getUserRole } from "../../utils/role.js";

export function AuthAccess({ allow = [], children }) {
    const { user, loading } = useAuth();
    const role = getUserRole(user);

    if (loading) return null;

    return allow.includes(role) ? children : null;
}
