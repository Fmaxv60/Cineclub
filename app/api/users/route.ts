import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromToken } from '@/lib/token';
import type { User } from '@/types/db';

async function requireAdminAuth(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return null;
  }

  // Vérifier que c'est un admin
  const users = await query<User>(
    'SELECT role FROM "User" WHERE id = $1',
    [userId]
  );

  if (!users[0] || users[0].role !== 'admin') {
    return null;
  }

  return { userId };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql = 'SELECT id, username, email, role, status, created_at FROM "User" ORDER BY created_at DESC';
    const params: any[] = [];

    if (status) {
      sql = 'SELECT id, username, email, role, status, created_at FROM "User" WHERE status = $1 ORDER BY created_at DESC';
      params.push(status);
    }

    const users = await query<User>(sql, params);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
