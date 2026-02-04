'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { Calendar, Clock, Users, Film, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTokenFromStorage } from '@/lib/token';

interface UpcomingRoom {
  id: string;
  owner_id: string;
  tmdb_movie_id: number;
  session_datetime: string;
  is_private: boolean;
  owner_username: string;
  members_count: number;
  is_user_member?: boolean;
}

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

interface RoomWithMovie extends UpcomingRoom {
  movie?: MovieDetails;
}

export default function UpcomingRooms() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingRooms = async () => {
      try {
        setIsLoading(true);

        // Récupérer les 3 prochaines séances
        const token = getTokenFromStorage();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/rooms/upcoming?limit=3', { headers });
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des séances');
        }

        const roomsData: UpcomingRoom[] = await response.json();

        // Récupérer les détails des films pour chaque séance
        const roomsWithMovies = await Promise.all(
          roomsData.map(async (room) => {
            try {
              const movieData = await getMovieDetails(room.tmdb_movie_id.toString());
              return { ...room, movie: movieData };
            } catch (error) {
              console.error(`Erreur pour le film ${room.tmdb_movie_id}:`, error);
              return room;
            }
          })
        );

        setRooms(roomsWithMovies);
      } catch (error) {
        console.error('Erreur lors du chargement des séances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingRooms();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Prochaines séances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 animate-pulse">
              <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
              <div className="h-3 bg-muted rounded mb-2" />
              <div className="h-2 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Prochaines séances</h2>
        <Card className="p-6 text-center">
          <Film className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune séance prévue pour le moment</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">Prochaines séances</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map((room) => {
          const posterUrl = room.movie?.poster_path
            ? getTMDBImageUrl(room.movie.poster_path, 'w500')
            : null;
          const sessionDate = new Date(room.session_datetime);

          return (
            <Card
              key={room.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col p-0"
              onClick={() => router.push(`/home/room/${room.id}`)}
            >
              {/* Affiche du film */}
              <div className="relative aspect-[2/3] overflow-hidden bg-muted flex-shrink-0">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={room.movie?.title || 'Film'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="size-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Badge "Inscrit" si l'utilisateur est membre */}
                {room.is_user_member && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 text-white rounded-full text-xs font-medium flex items-center gap-1">
                    <UserCheck className="size-3" />
                    Inscrit
                  </div>
                )}
              </div>

              {/* Informations de la séance */}
              <div className="p-2 space-y-1 flex-1 flex flex-col">
                <h3 className="font-semibold text-base text-foreground line-clamp-2">
                  {room.movie?.title || 'Titre inconnu'}
                </h3>

                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="size-3 text-accent flex-shrink-0" />
                    <span>
                      {sessionDate.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-3 text-accent flex-shrink-0" />
                    <span>
                      {sessionDate.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3 text-accent flex-shrink-0" />
                    <span>{room.members_count} participant(s)</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-xs h-8 mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/home/room/${room.id}`);
                  }}
                >
                  Voir la séance
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
