import { NextRequest, NextResponse } from 'next/server';
import { createUser, validateRegisterData, getUserByEmail, getUserByUsername } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validation
    const { valid, errors } = validateRegisterData(username, email, password);
    if (!valid) {
      return NextResponse.json(
        { message: errors[0] || 'Données invalides' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { message: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // Vérifier si le username existe déjà
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { message: 'Ce nom d\'utilisateur est déjà utilisé' },
        { status: 409 }
      );
    }

    // Créer l'utilisateur
    const user = await createUser(username, email, password);

    return NextResponse.json(
      {
        message: 'Utilisateur créé avec succès',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
