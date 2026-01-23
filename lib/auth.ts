import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';
import type { User } from '@/types/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const JWT_EXPIRY = '7d';
const SALT_ROUNDS = 10;

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Compare un mot de passe avec son hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Crée un JWT
 */
export function createToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Valide et décode un JWT
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Récupère un utilisateur par ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const users = await query<User>(
    'SELECT id, username, email, password_hash, role, status, created_at FROM "User" WHERE id = $1',
    [id]
  );
  return users[0] || null;
}

/**
 * Récupère un utilisateur par email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await query<User>(
    'SELECT id, username, email, password_hash, role, status, created_at FROM "User" WHERE email = $1',
    [email]
  );
  return users[0] || null;
}

/**
 * Récupère un utilisateur par username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await query<User>(
    'SELECT id, username, email, password_hash, role, status, created_at FROM "User" WHERE username = $1',
    [username]
  );
  return users[0] || null;
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const password_hash = await hashPassword(password);

  // Vérifier si c'est le premier utilisateur
  const userCount = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM "User"'
  );
  const isFirstUser = parseInt(userCount[0]?.count || '0', 10) === 0;
  const role = isFirstUser ? 'admin' : 'user';
  const status = isFirstUser ? 'active' : 'pending';

  const users = await query<User>(
    `INSERT INTO "User" (username, email, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, password_hash, role, status, created_at`,
    [username, email, password_hash, role, status]
  );

  if (!users[0]) {
    throw new Error('Erreur lors de la création de l\'utilisateur');
  }

  return users[0];
}

/**
 * Authentifie un utilisateur (login)
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: User; token: string } | { error: string } | null> {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    return null;
  }

  if (user.status !== 'active') {
    const message =
      user.status === 'pending'
        ? 'Votre compte est en attente d\'approbation par un administrateur'
        : 'Votre compte est désactivé';
    return { error: message };
  }

  const token = createToken(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      created_at: user.created_at,
      status: user.status,
    },
    token,
  };
}

/**
 * Valide les données d'inscription
 */
export function validateRegisterData(
  username: string,
  email: string,
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!username || username.trim().length < 3) {
    errors.push('Le nom d\'utilisateur doit avoir au moins 3 caractères');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Veuillez fournir une adresse email valide');
  }

  if (!password || password.length < 8) {
    errors.push('Le mot de passe doit avoir au moins 8 caractères');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valide les données de connexion
 */
export function validateLoginData(
  email: string,
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Veuillez fournir une adresse email valide');
  }

  if (!password || password.length === 0) {
    errors.push('Le mot de passe est requis');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
