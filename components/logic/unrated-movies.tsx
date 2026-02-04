'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { getTokenFromStorage } from '@/lib/token';
import { Star, Film, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UnratedMovie {
  tmdb_movie_id: number;
  session_datetime: string;
  room_id: string;
}

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
}

interface UnratedMovieWithDetails extends UnratedMovie {
  movie?: MovieDetails;
}

export default function UnratedMoviesReminder() {
  const router = useRouter();
  const [movies, setMovies] = useState<UnratedMovieWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnratedMovies = async () => {
      const token = getTokenFromStorage();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch('/api/users/unrated-movies', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération');
        }

        const moviesData: UnratedMovie[] = await response.json();

        // Récupérer les détails des films
        const moviesWithDetails = await Promise.all(
          moviesData.map(async (movie) => {
            try {
              const movieDetails = await getMovieDetails(movie.tmdb_movie_id.toString());
              return { ...movie, movie: movieDetails };
            } catch (error) {
              console.error(`Erreur pour le film ${movie.tmdb_movie_id}:`, error);
              return movie;
            }
          })
        );

        setMovies(moviesWithDetails);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnratedMovies();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="size-5 text-accent" />
          Films à noter
        </h2>
        <Card className="p-3 animate-pulse">
          <div className="h-16 bg-muted rounded" />
        </Card>
      </div>
    );
  }

  if (movies.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de films à noter
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <AlertCircle className="size-5 text-accent" />
        Films à noter
      </h2>
      <Card className="p-3 bg-accent/5 border-accent/20">
        <p className="text-xs text-muted-foreground">
          Vous avez participé à des séances. N'oubliez pas de noter ces films !
        </p>
        <div className="space-y-2">
          {movies.map((movie) => {
            const posterUrl = movie.movie?.poster_path
              ? getTMDBImageUrl(movie.movie.poster_path, 'w200')
              : null;

            return (
              <div
                key={`${movie.tmdb_movie_id}-${movie.room_id}`}
                className="flex items-center gap-3 p-2 bg-background rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                onClick={() => router.push(`/home/movie/${movie.tmdb_movie_id}`)}
              >
                {/* Mini poster */}
                <div className="w-12 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.movie?.title || 'Film'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="size-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {movie.movie?.title || 'Film inconnu'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vu le {new Date(movie.session_datetime).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>

                {/* Bouton */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/home/movie/${movie.tmdb_movie_id}`);
                  }}
                >
                  <Star className="size-3 mr-1" />
                  Noter
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
