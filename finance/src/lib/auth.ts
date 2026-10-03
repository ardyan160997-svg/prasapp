import { cookies } from 'next/headers';

const HOUSEHOLD_PASSWORD = process.env.HOUSEHOLD_PASSWORD || 'keluarga123';

export async function loginAction(password: string): Promise<{ success: boolean; error?: string }> {
  if (password === HOUSEHOLD_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('household_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'Password salah' };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('household_auth');
}

export async function verifyHouseholdAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('household_auth');
  return authCookie?.value === 'true';
}