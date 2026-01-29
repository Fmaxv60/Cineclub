import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromToken } from '@/lib/token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: movieId } = await params;

  try {
    const ratings = await query(`
      SELECT 
        r.id,
        r.user_id,
        r.score,
        r.comment,
        r.created_at,
        u.username
      FROM "Rating" r
      JOIN "User" u ON r.user_id = u.id
      WHERE r.tmdb_movie_id = $1
      ORDER BY r.created_at DESC
    `, [parseInt(movieId)]);

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: movieId } = await params;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { score, comment } = body;

    if (!score || score < 0 || score > 10) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 10' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO "Rating" (user_id, tmdb_movie_id, score, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, tmdb_movie_id)
      DO UPDATE SET score = $3, comment = $4
      RETURNING id, user_id, score, comment, created_at
    `, [userId, parseInt(movieId), score, comment || null]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    return NextResponse.json(
      { error: 'Failed to create/update rating' },
      { status: 500 }
    );
  }
}
