'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { removeTokenFromStorage } from '@/lib/token';

interface User {
  username: string;
  email: string;
  role: string;
}

export default function Avatar() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {
          removeTokenFromStorage();
          router.push('/login');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    removeTokenFromStorage();
    setUser(null);
    setIsDropdownOpen(false);
    router.push('/login');
  };

  const getInitials = (username?: string) => {
    return username?.slice(0, 2).toUpperCase() || 'UN';
  };

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="h-10 w-10 rounded-full bg-card text-accent hover:bg-card transition-colors flex items-center justify-center font-semibold text-sm"
      >
        {getInitials(user.username)}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">{user.username}</p>
            <p className="text-xs text-accent">{user.email}</p>
          </div>
          {user.role === "admin" && (
            <button
              onClick={() => {
                router.push('/home/settings');
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent/10 flex items-center gap-2 transition-colors"
            >
              <Settings className="size-4" />
              Paramètres
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent/10 flex items-center gap-2 transition-colors"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground text-right">v 0.2.0</p>
          </div>
        </div>
      )}
    </div>
  );
}
