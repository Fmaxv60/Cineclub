import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromToken } from '@/lib/token';

async function requireAuth(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return null;
  }

  return { userId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id, 10);

  try {
    const rows = await query(
      'SELECT id FROM "Favorites" WHERE user_id = $1 AND tmdb_movie_id = $2',
      [auth.userId, movieId]
    );

    return NextResponse.json({ isFavorite: rows.length > 0 });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json({ error: 'Failed to check favorite' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id, 10);

  try {
    const inserted = await query(
      `INSERT INTO "Favorites" (user_id, tmdb_movie_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM "Favorites" WHERE user_id = $1 AND tmdb_movie_id = $2
       )
       RETURNING id, user_id, tmdb_movie_id, created_at`,
      [auth.userId, movieId]
    );

    return NextResponse.json(
      { isFavorite: true, favorite: inserted[0] ?? null },
      { status: inserted[0] ? 201 : 200 }
    );
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id, 10);

  try {
    await query('DELETE FROM "Favorites" WHERE user_id = $1 AND tmdb_movie_id = $2', [auth.userId, movieId]);
    return NextResponse.json({ isFavorite: false });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
