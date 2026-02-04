import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface UpcomingRoom {
  id: string;
  owner_id: string;
  tmdb_movie_id: number;
  session_datetime: string;
  is_private: boolean;
  owner_username: string;
  members_count: number;
  is_user_member?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');

    // Vérifier si l'utilisateur est authentifié
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        userId = decoded.userId;
      } catch {
        // Token invalide, on continue sans utilisateur
      }
    }

    // Récupérer les prochaines séances (non passées)
    const rooms = await query<UpcomingRoom>(
      `SELECT 
        r.id,
        r.owner_id,
        r.tmdb_movie_id,
        r.session_datetime,
        r.is_private,
        u.username as owner_username,
        COUNT(DISTINCT rm.user_id) as members_count
        ${userId ? `, EXISTS(SELECT 1 FROM "RoomMember" WHERE room_id = r.id AND user_id = $2) as is_user_member` : ''}
      FROM "Room" r
      LEFT JOIN "User" u ON r.owner_id = u.id
      LEFT JOIN "RoomMember" rm ON r.id = rm.room_id
      WHERE r.session_datetime > NOW()
      GROUP BY r.id, u.username
      ORDER BY r.session_datetime ASC
      LIMIT $1`,
      userId ? [limit, userId] : [limit]
    );

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Erreur lors du chargement des séances à venir:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des séances' },
      { status: 500 }
    );
  }
}
