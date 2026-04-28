import { useAuth } from "../../contexts/AuthContext.jsx";
import { getUserRole } from "../../utils/role.js";

export function AuthAccess({ allow = [], children }) {
    const { user, loading } = useAuth();
    const role = getUserRole(user);

    if (loading) return null;

    return allow.includes(role) ? children : null;
}
