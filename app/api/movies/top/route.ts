import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface TopMovie {
  tmdb_movie_id: number;
  average_rating: number;
  rating_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');

    // Récupérer les films avec la meilleure note moyenne
    const topMovies = await query<TopMovie>(
      `SELECT 
        r.tmdb_movie_id,
        AVG(r.score) as average_rating,
        COUNT(*) as rating_count
      FROM "Rating" r
      GROUP BY r.tmdb_movie_id
      HAVING COUNT(*) >= 1
      ORDER BY AVG(r.score) DESC
      LIMIT $1`,
      [limit]
    );

    return NextResponse.json(topMovies);
  } catch (error) {
    console.error('Erreur lors du chargement des films top-ratés:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des films' },
      { status: 500 }
    );
  }
}
