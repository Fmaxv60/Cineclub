'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenFromStorage } from '@/lib/token';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = getTokenFromStorage();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = getTokenFromStorage();
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: User[] = await response.json();
        setPendingUsers(data.filter((u) => u.status === 'pending'));
        setUsers(data.filter((u) => u.status === 'active'));
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Impossible de charger les utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId);
      const token = getTokenFromStorage();
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (response.ok) {
        toast.success('Utilisateur approuvé');
        fetchUsers();
      } else {
        toast.error('Impossible d\'approuver l\'utilisateur');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setActionLoading(userId);
      const token = getTokenFromStorage();
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Utilisateur supprimé');
        fetchUsers();
      } else {
        toast.error('Impossible de supprimer l\'utilisateur');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="theme-cineclub min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-cineclub min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Paramètres Admin</h1>

        {/* Utilisateurs en attente */}
        {pendingUsers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Utilisateurs en attente ({pendingUsers.length})
            </h2>
            <div className="grid gap-4">
              {pendingUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleApprove(user.id)}
                        disabled={actionLoading === user.id}
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle className="size-4" />
                        )}
                        Approuver
                      </Button>
                      <Button
                        onClick={() => handleReject(user.id)}
                        disabled={actionLoading === user.id}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Utilisateurs actifs */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Utilisateurs actifs ({users.length})
          </h2>
          {users.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Aucun utilisateur actif
            </Card>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                          {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    {user.role !== 'admin' && (
                      <Button
                        onClick={() => handleReject(user.id)}
                        disabled={actionLoading === user.id}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Supprimer
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
