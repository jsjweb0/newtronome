interface UserWithEmail {
  email: string | null;
}

export function getUserRole(user: UserWithEmail | null | undefined): string | null {
  if (!user) return 'guest';
  return user.email === 'admin@email.com' ? 'admin' : user.email;
}
