import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface Room {
  id: string;
  owner_id: string;
  tmdb_movie_id: number;
  session_datetime: string;
  is_private: boolean;
  created_at: string;
  owner?: {
    id: string;
    username: string;
  };
  members?: Array<{
    user_id: string;
    username: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: movieId } = await params;

  try {
    const roomsData = await query<{
      id: string;
      owner_id: string;
      tmdb_movie_id: number;
      session_datetime: string;
      is_private: boolean;
      created_at: string;
    }>(
      `SELECT id, owner_id, tmdb_movie_id, session_datetime, is_private, created_at 
       FROM "Room" 
       WHERE tmdb_movie_id = $1 
       ORDER BY session_datetime DESC`,
      [parseInt(movieId)]
    );

    // Enrichir avec les infos du propriétaire et les membres
    const roomsWithDetails: Room[] = await Promise.all(
      roomsData.map(async (room) => {
        const ownerData = await query<{ id: string; username: string }>(
          'SELECT id, username FROM "User" WHERE id = $1',
          [room.owner_id]
        );

        const membersData = await query<{ user_id: string; username: string }>(
          `SELECT rm.user_id, u.username 
           FROM "RoomMember" rm
           JOIN "User" u ON rm.user_id = u.id
           WHERE rm.room_id = $1 AND rm.user_id != $2`,
          [room.id, room.owner_id]
        );

        return {
          ...room,
          owner: ownerData[0],
          members: membersData,
        };
      })
    );

    return NextResponse.json(roomsWithDetails);
  } catch (error) {
    console.error('Erreur lors du chargement des salles:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des salles' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: movieId } = await params;

  try {
    // Récupérer le token du header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token manquant ou invalide' },
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

    const body = await request.json();
    const { session_datetime, is_private = false } = body;

    if (!session_datetime) {
      return NextResponse.json(
        { error: 'session_datetime est requis' },
        { status: 400 }
      );
    }

    // Créer la room
    const roomResult = await query<{
      id: string;
      owner_id: string;
      tmdb_movie_id: number;
      session_datetime: string;
      is_private: boolean;
      created_at: string;
    }>(
      `INSERT INTO "Room" (owner_id, tmdb_movie_id, session_datetime, is_private)
       VALUES ($1, $2, $3, $4)
       RETURNING id, owner_id, tmdb_movie_id, session_datetime, is_private, created_at`,
      [decoded.userId, parseInt(movieId), session_datetime, is_private]
    );

    if (roomResult.length === 0) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la salle' },
        { status: 500 }
      );
    }

    const room = roomResult[0];

    // Ajouter le créateur comme membre
    await query(
      `INSERT INTO "RoomMember" (user_id, room_id, role)
       VALUES ($1, $2, $3)`,
      [decoded.userId, room.id, 'owner']
    );

    // Récupérer les infos du propriétaire
    const ownerData = await query<{ id: string; username: string }>(
      'SELECT id, username FROM "User" WHERE id = $1',
      [room.owner_id]
    );

    const responseRoom: Room = {
      ...room,
      owner: ownerData[0],
      members: [],
    };

    return NextResponse.json(responseRoom, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la salle' },
      { status: 500 }
    );
  }
}
