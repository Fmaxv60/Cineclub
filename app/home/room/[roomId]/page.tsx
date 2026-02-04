'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { getTokenFromStorage } from '@/lib/token';
import { ArrowLeft, Calendar, Clock, Users, UserCheck, Film, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ReviewSection from '@/components/logic/review-section';

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

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = getTokenFromStorage();
      if (!token) return;

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.id);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomAndMovie = async () => {
      try {
        setIsLoading(true);

        // Récupérer les détails de la room
        const roomResponse = await fetch(`/api/rooms/${roomId}`);
        if (!roomResponse.ok) {
          throw new Error('Salle introuvable');
        }

        const roomData = await roomResponse.json();
        setRoom(roomData);

        // Récupérer les détails du film
        const movieData = await getMovieDetails(roomData.tmdb_movie_id.toString());
        setMovie(movieData);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Impossible de charger les détails de la salle');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomAndMovie();
  }, [roomId]);

  const handleJoinRoom = async () => {
    const token = getTokenFromStorage();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setIsJoining(true);
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Toujours recharger les données pour mettre à jour l'état
      const roomResponse = await fetch(`/api/rooms/${roomId}`);
      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoom(roomData);
      }

      if (!response.ok) {
        const error = await response.json();
        console.error('Impossible de rejoindre la salle:', error.error);
      }
    } catch (err) {
      console.error('Erreur lors de la jonction à la salle:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    const token = getTokenFromStorage();
    if (!token) return;

    try {
      setIsActionLoading(true);
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Recharger les données de la room
        const roomResponse = await fetch(`/api/rooms/${roomId}`);
        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoom(roomData);
        }
      } else {
        console.error('Impossible de quitter la salle');
      }
    } catch (err) {
      console.error('Erreur lors du départ de la salle:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    const token = getTokenFromStorage();
    if (!token) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
      return;
    }

    try {
      setIsActionLoading(true);
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.back();
      } else {
        console.error('Impossible de supprimer la salle');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la salle:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const isOwner = !!(currentUserId && room && room.owner_id === currentUserId);
  const isMember = !!(currentUserId && room && (
    room.owner_id === currentUserId ||
    room.members?.some(m => m.user_id === currentUserId)
  ));

  if (isLoading) {
    return (
      <div className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !room || !movie) {
    return (
      <div className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
        <Card className="p-6 text-center max-w-md">
          <p className="text-destructive mb-4">{error || 'Salle introuvable'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Button>
        </Card>
      </div>
    );
  }

  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w500');
  const backdropUrl = getTMDBImageUrl(movie.backdrop_path, 'original');
  const sessionDate = new Date(room.session_datetime);
  const isPast = sessionDate < new Date();

  console.log('Debug room page:', {
    currentUserId,
    ownerId: room.owner_id,
    isOwner,
    isMember,
    isPast,
    sessionDate,
    now: new Date(),
    members: room.members,
    shouldShowButtons: !isPast,
    buttonLogic: {
      notMember: !isMember,
      isOwner: isOwner,
      isMemberNotOwner: isMember && !isOwner
    }
  });

  return (
    <div className="theme-cineclub min-h-screen bg-background">
      {/* Backdrop avec overlay */}
      {backdropUrl && (
        <div className="relative h-[30vh] w-full">
          <img
            src={backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 text-accent"
        >
          <ArrowLeft className="mr-2 size-4" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Informations de la salle */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-card border border-border space-y-6">
              {/* Affiche du film */}
              {posterUrl && (
                <div className="flex justify-center">
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-48 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => router.push(`/home/movie/${movie.id}`)}
                  />
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
                  {movie.title}
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Séance de visionnage
                </p>
              </div>

              {/* Informations de la séance */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-foreground">
                  <Calendar className="size-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {sessionDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-foreground">
                  <Clock className="size-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Heure</p>
                    <p className="text-sm text-muted-foreground">
                      {sessionDate.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-foreground">
                  <Users className="size-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Participants</p>
                    <p className="text-sm text-muted-foreground">
                      {room.members?.length || 0} participant(s)
                    </p>
                  </div>
                </div>

                {room.is_private && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                      Salle privée
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton rejoindre/quitter/supprimer */}
              {!isPast && (
                <>
                  {!isMember ? (
                    <Button
                      onClick={handleJoinRoom}
                      disabled={isJoining}
                      className="w-full"
                    >
                      <Users className="mr-2 size-4" />
                      Rejoindre la séance
                    </Button>
                  ) : isOwner ? (
                    <Button
                      onClick={handleDeleteRoom}
                      disabled={isActionLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Supprimer la salle
                    </Button>
                  ) : (
                    <Button
                      onClick={handleLeaveRoom}
                      disabled={isActionLoading}
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <LogOut className="mr-2 size-4" />
                      Quitter la salle
                    </Button>
                  )}
                </>
              )}

              {isPast && (
                <div className="text-center text-sm text-muted-foreground">
                  Cette séance est terminée
                </div>
              )}

              {/* Liste des participants */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Liste des participants
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {room.members?.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-2 p-2 bg-background rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {member.username}
                        </p>
                        {member.role === 'owner' && (
                          <p className="text-xs text-accent">Créateur</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => router.push(`/home/movie/${movie.id}`)}
                className="w-full"
              >
                <Film className="mr-2 size-4" />
                Voir la page du film
              </Button>
            </Card>
          </div>

          {/* Colonne droite - Avis */}
          <div className="lg:col-span-2">
            <ReviewSection movieId={movie.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
