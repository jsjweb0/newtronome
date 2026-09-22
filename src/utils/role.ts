export type UserRole = 'guest' | 'user' | 'admin';

interface UserWithEmail {
  email: string | null;
}

export function getUserRole(
  user: UserWithEmail | null | undefined
): UserRole {
  if (!user) return 'guest';
  return user.email === 'admin@email.com'
    ? 'admin'
    : 'user';
}
