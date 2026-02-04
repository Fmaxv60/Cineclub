import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface LatestReview {
  id: string;
  user_id: string;
  username: string;
  tmdb_movie_id: number;
  movie_title: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');

    // Récupérer les 5 dernières reviews
    const reviews = await query<LatestReview>(
      `SELECT 
        r.id,
        r.user_id,
        u.username,
        r.tmdb_movie_id,
        r.score,
        r.comment,
        r.created_at
      FROM "Rating" r
      JOIN "User" u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT $1`,
      [limit]
    );

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Erreur lors du chargement des reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des reviews' },
      { status: 500 }
    );
  }
}
