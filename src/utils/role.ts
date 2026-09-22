export type UserRole = 'guest' | 'user' | 'admin';

interface UserWithRole {
  isAdmin: boolean;
}

export function getUserRole(
  user: UserWithRole | null | undefined
): UserRole {
  if (!user) return 'guest';
  return user.isAdmin ? 'admin' : 'user';
}
