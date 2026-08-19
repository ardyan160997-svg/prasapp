import { cookies } from 'next/headers';

const EDITOR_PASSWORD = process.env.EDITOR_PASSWORD || 'novia1234';

export async function loginAction(password: string): Promise<{ success: boolean; error?: string }> {
  if (password === EDITOR_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('editor_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'Password salah' };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('editor_auth');
}

export async function verifyEditorAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('editor_auth');
  return authCookie?.value === 'true';
}