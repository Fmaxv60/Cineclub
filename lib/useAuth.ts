'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenFromStorage, getUserIdFromToken, removeTokenFromStorage } from '@/lib/token';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getTokenFromStorage();
    const userId = getUserIdFromToken(token);

    if (userId && token) {
      setIsAuthenticated(true);
      // Vous pouvez faire un appel API ici pour récupérer les infos complètes de l'utilisateur
      // Pour maintenant, on just sauvegarde l'ID
    } else {
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    removeTokenFromStorage();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}
