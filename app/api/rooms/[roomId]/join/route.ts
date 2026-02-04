import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
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

    // Vérifier si la salle existe
    const roomExists = await query(
      'SELECT id, owner_id FROM "Room" WHERE id = $1',
      [roomId]
    );

    if (roomExists.length === 0) {
      return NextResponse.json(
        { error: 'Salle introuvable' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await query(
      'SELECT user_id FROM "RoomMember" WHERE user_id = $1 AND room_id = $2',
      [decoded.userId, roomId]
    );

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: 'Vous êtes déjà membre de cette salle' },
        { status: 400 }
      );
    }

    // Ajouter l'utilisateur comme membre
    await query(
      `INSERT INTO "RoomMember" (user_id, room_id, role)
       VALUES ($1, $2, $3)`,
      [decoded.userId, roomId, 'member']
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de l\'adhésion à la salle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'adhésion à la salle' },
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

    // Supprimer l'utilisateur de la salle
    await query(
      'DELETE FROM "RoomMember" WHERE user_id = $1 AND room_id = $2',
      [decoded.userId, roomId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la sortie de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sortie de la salle' },
      { status: 500 }
    );
  }
}
