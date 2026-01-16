import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, validateLoginData } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    const { valid, errors } = validateLoginData(email, password);
    if (!valid) {
      return NextResponse.json(
        { message: errors[0] || 'Données invalides' },
        { status: 400 }
      );
    }

    // Authentifier l'utilisateur
    const result = await authenticateUser(email, password);

    if (!result) {
      return NextResponse.json(
        { message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const { user, token } = result;

    return NextResponse.json(
      {
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
