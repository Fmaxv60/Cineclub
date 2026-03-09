'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { ArrowLeft, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TopMovie {
  tmdb_movie_id: number;
  average_rating: number;
  rating_count: number;
}

interface MovieWithDetails extends TopMovie {
  title: string;
  poster_path: string | null;
}

/**
 * Retourne une couleur dégradée basée sur le score (0-10)
 * 0-3: rouge, 3-5: orange, 5-7: jaune, 7-9: vert lime, 9-10: vert
 */
function getScoreColor(score: number): string {
  if (score < 3) {
    return 'text-red-500';
  } else if (score < 5) {
    return 'text-orange-500';
  } else if (score < 7) {
    return 'text-yellow-500';
  } else if (score < 9) {
    return 'text-lime-500';
  } else {
    return 'text-green-500';
  }
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<MovieWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/movies/top?limit=100');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des films');
        }

        const topMovies = await response.json();

        // Récupérer les détails de chaque film
        const moviesWithDetails = await Promise.all(
          topMovies.map(async (movie: any) => {
            try {
              const details = await getMovieDetails(movie.tmdb_movie_id.toString());
              return {
                ...movie,
                average_rating: parseFloat(movie.average_rating),
                rating_count: parseInt(movie.rating_count),
                title: details.title,
                poster_path: details.poster_path,
              };
            } catch {
              // Retourner le film sans les détails si la requête échoue
              return {
                ...movie,
                average_rating: parseFloat(movie.average_rating),
                rating_count: parseInt(movie.rating_count),
                title: `Film ${movie.tmdb_movie_id}`,
                poster_path: null,
              };
            }
          })
        );

        setMovies(moviesWithDetails);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Impossible de charger le classement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopMovies();
  }, []);

  if (isLoading) {
    return (
      <div className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du classement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
        <Card className="p-6 text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Button>
        </Card>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
        <Card className="p-6 text-center max-w-md">
          <p className="text-muted-foreground mb-4">
            Aucun film avec au moins 2 avis pour le moment
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="theme-cineclub min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Classement des films</h1>
          <p className="text-muted-foreground">
            Les films les mieux notés (avec au moins 2 avis)
          </p>
        </div>

        {/* Podium des 3 premiers */}
        {movies.length >= 1 && (
          <div className="mb-16">
            <div className="grid grid-cols-3 gap-4 items-end h-96">
              {/* 2e place - Gauche */}
              {movies.length >= 2 && (
                <PodiumCard
                  movie={movies[1]}
                  position={2}
                  height="h-72"
                  onClick={() => router.push(`/home/movie/${movies[1].tmdb_movie_id}`)}
                />
              )}

              {/* 1er place - Centre */}
              <PodiumCard
                movie={movies[0]}
                position={1}
                height="h-96"
                onClick={() => router.push(`/home/movie/${movies[0].tmdb_movie_id}`)}
              />

              {/* 3e place - Droite */}
              {movies.length >= 3 && (
                <PodiumCard
                  movie={movies[2]}
                  position={3}
                  height="h-64"
                  onClick={() => router.push(`/home/movie/${movies[2].tmdb_movie_id}`)}
                />
              )}
            </div>
          </div>
        )}

        {/* Reste du classement */}
        {movies.length > 3 && (
          <>
            <h2 className="text-2xl font-bold text-foreground pt-10 mb-6">Suite du classement</h2>
            <div className="grid grid-cols-2 gap-6">
              {movies.slice(3).map((movie, index) => {
                const posterUrl = getTMDBImageUrl(movie.poster_path, 'w185');
                const actualIndex = index + 3;

                return (
                  <Card
                    key={movie.tmdb_movie_id}
                    className="p-6 bg-card border border-border hover:border-accent transition-colors cursor-pointer"
                    onClick={() => router.push(`/home/movie/${movie.tmdb_movie_id}`)}
                  >
                    <div className="flex gap-6 items-start">
                      {/* Position */}
                      <div className="flex-shrink-0 text-3xl font-bold text-accent min-w-fit">
                        {actualIndex + 1}.
                      </div>

                      {/* Affiche du film */}
                      {posterUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={posterUrl}
                            alt={movie.title}
                            className="h-32 rounded-lg shadow-md object-cover"
                          />
                        </div>
                      )}

                      {/* Informations du film */}
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-foreground mb-4">
                          {movie.title}
                        </h2>

                        <div className="flex gap-6 pt-4">
                          {/* Note moyenne */}
                          <div className="flex items-center gap-2">
                            <Star className={`size-5 fill-current ${getScoreColor(movie.average_rating)}`} />
                            <div>
                              <p className="text-sm text-muted-foreground">Note</p>
                              <p className={`text-lg font-bold ${getScoreColor(movie.average_rating)}`}>
                                {movie.average_rating.toFixed(1)}/10
                              </p>
                            </div>
                          </div>

                          {/* Nombre d'avis */}
                          <div className="flex items-center gap-2">
                            <Users className="size-5 text-accent" />
                            <div>
                              <p className="text-sm text-muted-foreground">Avis</p>
                              <p className="text-lg font-bold text-accent">
                                {movie.rating_count}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface PodiumCardProps {
  movie: MovieWithDetails;
  position: number;
  height: string;
  onClick: () => void;
}

function PodiumCard({
  movie,
  position,
  height,
  onClick,
}: PodiumCardProps) {
  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w185');
  const imageHeight = position === 1 ? 'h-52' : position === 2 ? 'h-40' : 'h-32';

  return (
    <div>
      <div
        className={`${height} bg-gradient-to-t from-accent/20 to-accent/5 border-2 border-accent rounded-t-2xl p-6 flex flex-col justify-between cursor-pointer hover:from-accent/30 hover:to-accent/10 transition-colors`}
        onClick={onClick}
      >
        {/* Position number */}
        <div className="text-center mb-4">
          <p className="text-5xl font-bold text-accent">#{position}</p>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {/* Image - grows with container */}
          {posterUrl && (
            <div>
              <img
                src={posterUrl}
                alt={movie.title}
                className={`${imageHeight} rounded-lg shadow-lg object-cover`}
              />
            </div>
          )}

          {/* Title - fixed size */}
          <h3 className="text-center text-sm font-bold text-foreground line-clamp-2">
            {movie.title}
          </h3>
        </div>
      </div>

      {/* Note et avis en dessous de la case */}
      <div className="flex justify-around items-center bg-card/50 border-x-2 border-b-2 border-accent rounded-b-xl p-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className={`size-4 fill-current ${getScoreColor(movie.average_rating)}`} />
          </div>
          <p className={`text-sm font-bold ${getScoreColor(movie.average_rating)}`}>
            {movie.average_rating.toFixed(1)}/10
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="size-4 text-accent" />
          </div>
          <p className="text-sm font-bold text-accent">
            {movie.rating_count}
          </p>
        </div>
      </div>
    </div>
  );
}