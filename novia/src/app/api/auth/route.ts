import { NextRequest, NextResponse } from 'next/server';
import { loginAction, logoutAction, verifyEditorAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password } = body;

    if (action === 'login') {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400 });
      }
      const result = await loginAction(password);
      if (result.success) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    if (action === 'logout') {
      await logoutAction();
      return NextResponse.json({ success: true });
    }

    if (action === 'verify') {
      const isAuthed = await verifyEditorAuth();
      return NextResponse.json({ authenticated: isAuthed });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/auth error:', error);
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }
}