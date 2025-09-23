import { cookies } from 'next/headers';

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('github-agent-auth');
    return authCookie?.value === 'authenticated';
  } catch {
    return false;
  }
}

export async function clearAuthentication(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('github-agent-auth');
  } catch {
    // Ignore errors
  }
}
