import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RoomDetail {
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
    role: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  try {
    // Récupérer les infos de la salle
    const roomData = await query<{
      id: string;
      owner_id: string;
      tmdb_movie_id: number;
      session_datetime: string;
      is_private: boolean;
      created_at: string;
    }>(
      'SELECT id, owner_id, tmdb_movie_id, session_datetime, is_private, created_at FROM "Room" WHERE id = $1',
      [roomId]
    );

    if (roomData.length === 0) {
      return NextResponse.json(
        { error: 'Salle introuvable' },
        { status: 404 }
      );
    }

    const room = roomData[0];

    // Récupérer les infos du propriétaire
    const ownerData = await query<{ id: string; username: string }>(
      'SELECT id, username FROM "User" WHERE id = $1',
      [room.owner_id]
    );

    // Récupérer tous les membres (y compris le propriétaire)
    const membersData = await query<{ user_id: string; username: string; role: string }>(
      `SELECT rm.user_id, u.username, rm.role 
       FROM "RoomMember" rm
       JOIN "User" u ON rm.user_id = u.id
       WHERE rm.room_id = $1
       ORDER BY rm.role DESC, u.username ASC`,
      [room.id]
    );

    const roomDetail: RoomDetail = {
      ...room,
      owner: ownerData[0],
      members: membersData,
    };

    return NextResponse.json(roomDetail);
  } catch (error) {
    console.error('Erreur lors du chargement de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la salle' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

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

    // Vérifier que l'utilisateur est le propriétaire de la salle
    const roomData = await query<{ owner_id: string }>(
      'SELECT owner_id FROM "Room" WHERE id = $1',
      [roomId]
    );

    if (roomData.length === 0) {
      return NextResponse.json(
        { error: 'Salle introuvable' },
        { status: 404 }
      );
    }

    if (roomData[0].owner_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que vos propres salles' },
        { status: 403 }
      );
    }

    // Supprimer les membres de la salle
    await query(
      'DELETE FROM "RoomMember" WHERE room_id = $1',
      [roomId]
    );

    // Supprimer la salle
    await query(
      'DELETE FROM "Room" WHERE id = $1',
      [roomId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la salle' },
      { status: 500 }
    );
  }
}
