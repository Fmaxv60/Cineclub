import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface UnratedMovie {
  tmdb_movie_id: number;
  session_datetime: string;
  room_id: string;
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }
    
    const userId = decoded.userId;

    // Récupérer les films des séances passées non notées
    const unratedMovies = await query<UnratedMovie>(
      `SELECT DISTINCT
        r.tmdb_movie_id,
        r.session_datetime,
        r.id as room_id
      FROM "Room" r
      JOIN "RoomMember" rm ON r.id = rm.room_id
      WHERE rm.user_id = $1
        AND r.session_datetime < NOW()
        AND NOT EXISTS (
          SELECT 1 FROM "Rating" rat
          WHERE rat.user_id = $1
            AND rat.tmdb_movie_id = r.tmdb_movie_id
        )
      ORDER BY r.session_datetime DESC
      LIMIT 5`,
      [userId]
    );

    return NextResponse.json(unratedMovies);
  } catch (error) {
    console.error('Erreur lors du chargement des films non notés:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement' },
      { status: 500 }
    );
  }
}
