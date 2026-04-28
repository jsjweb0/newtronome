export function getUserRole(user) {
    if (!user) return "guest";
    return user.email === "admin@email.com" ? "admin" : user.email;
}