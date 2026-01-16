import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

/**
 * Vérifie si un token est valide (version client-side légère)
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extrait l'ID utilisateur d'un token (version client-side)
 */
export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Récupère le token depuis localStorage (côté client)
 */
export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Stocke le token dans localStorage (côté client)
 */
export function setTokenToStorage(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

/**
 * Supprime le token de localStorage (côté client)
 */
export function removeTokenFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}
