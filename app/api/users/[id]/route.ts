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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !['active', 'pending'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    );
  }

  try {
    const updated = await query<User>(
      'UPDATE "User" SET status = $1 WHERE id = $2 RETURNING id, username, email, role, status, created_at',
      [status, id]
    );

    if (!updated[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Ne pas permettre la suppression d'un admin
  try {
    const user = await query<User>(
      'SELECT role FROM "User" WHERE id = $1',
      [id]
    );

    if (user[0]?.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    await query('DELETE FROM "User" WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
