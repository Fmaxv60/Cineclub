'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { Star, Film } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TopMovie {
  tmdb_movie_id: number;
  average_rating: number;
  rating_count: number;
}

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

interface MovieWithDetails extends TopMovie {
  movie?: MovieDetails;
}

export default function TopMovies() {
  const router = useRouter();
  const [movies, setMovies] = useState<MovieWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        setIsLoading(true);

        // Récupérer les 3 meilleurs films
        const response = await fetch('/api/movies/top?limit=3');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des films');
        }

        const moviesData: TopMovie[] = await response.json();

        // Récupérer les détails de chaque film
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
        console.error('Erreur lors du chargement des films top:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopMovies();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Top 3 des meilleurs films</h2>
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

  if (movies.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Top 3 des meilleurs films</h2>
        <Card className="p-6 text-center">
          <Film className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun film noté pour le moment</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">Top 3 des meilleurs films</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {movies.map((movie, index) => {
          const posterUrl = movie.movie?.poster_path
            ? getTMDBImageUrl(movie.movie.poster_path, 'w500')
            : null;

          return (
            <Card
              key={movie.tmdb_movie_id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col p-0"
              onClick={() => router.push(`/home/movie/${movie.tmdb_movie_id}`)}
            >
              {/* Ranking badge */}
              <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
                #{index + 1}
              </div>

              {/* Affiche du film */}
              <div className="relative aspect-[2/3] overflow-hidden bg-muted flex-shrink-0">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.movie?.title || 'Film'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="size-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Informations du film */}
              <div className="p-2 pt-1.5 space-y-1 flex-1 flex flex-col">
                <h3 className="font-semibold text-base text-foreground line-clamp-2">
                  {movie.movie?.title || 'Titre inconnu'}
                </h3>

                {/* Note et avis */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    <Star className="size-3 fill-accent text-accent" />
                    <span className="text-xs font-bold text-foreground">
                      {Number(movie.average_rating).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({movie.rating_count} {movie.rating_count > 1 ? 'avis' : 'avis'})
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-xs h-8 mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/home/movie/${movie.tmdb_movie_id}`);
                  }}
                >
                  Voir le film
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
