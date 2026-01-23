'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { getTokenFromStorage } from '@/lib/token';
import { ArrowLeft, Calendar, Star, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ReviewSection from '@/components/logic/review-section';

interface MovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  budget: number;
  revenue: number;
  tagline: string;
}

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params?.id as string;
  
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!movieId) return;

    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getMovieDetails(movieId);
        setMovie(data);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Impossible de charger les détails du film');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  useEffect(() => {
    if (!movieId) return;

    const checkFavorite = async () => {
      const token = getTokenFromStorage();
      if (!token) {
        setIsFavorite(false);
        return;
      }

      try {
        setIsFavoriteLoading(true);
        const response = await fetch(`/api/favorites/${movieId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsFavorite(!!data.isFavorite);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des favoris:', err);
      } finally {
        setIsFavoriteLoading(false);
      }
    };

    checkFavorite();
  }, [movieId]);

  const handleToggleFavorite = async () => {
    const token = getTokenFromStorage();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(`/api/favorites/${movieId}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      } else {
        console.error('Impossible de mettre à jour les favoris');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des favoris:', err);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

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

  if (error || !movie) {
    return (
      <div className="theme-cineclub flex items-center justify-center min-h-screen bg-background">
        <Card className="p-6 text-center max-w-md">
          <p className="text-destructive mb-4">{error || 'Film introuvable'}</p>
          <Button onClick={() => router.push('/home')}>
            <ArrowLeft className="mr-2 size-4" />
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const backdropUrl = getTMDBImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w500');

  return (
    <div className="theme-cineclub min-h-screen bg-background">
      {/* Backdrop avec overlay */}
      {backdropUrl && (
        <div className="relative h-[40vh] w-full">
          <img
            src={backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}

      {/* Contenu principal */}
      <div className="container mx-auto px-4 -mt-48 relative z-10">
        <Button
          variant="outline"
          onClick={() => router.push('/home')}
          className="mb-6 text-accent"
        >
          <ArrowLeft className="mr-2 size-4" />
          Retour
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          {posterUrl && (
            <div className="flex-shrink-0">
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full md:w-80 rounded-lg shadow-2xl"
              />
            </div>
          )}

          {/* Informations */}
          <div className="flex-1 flex flex-col">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-lg text-muted-foreground italic mb-4">
                "{movie.tagline}"
              </p>
            )}


            {/* Métadonnées */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {movie.release_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4" />
                  {new Date(movie.release_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
              {movie.runtime > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                </div>
              )}
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-2 text-accent font-semibold">
                  <Star className="size-4 fill-current" />
                  {movie.vote_average.toFixed(1)}/10
                  <span className="text-muted-foreground font-normal">
                    ({movie.vote_count} votes TMDB)
                  </span>
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-card text-foreground rounded-full text-sm border border-border"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {movie.overview && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Synopsis
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Production */}
            {movie.production_companies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Production
                </h3>
                <div className="flex flex-wrap gap-4">
                  {movie.production_companies.slice(0, 4).map((company) => (
                    <div key={company.id} className="text-sm text-muted-foreground">
                      {company.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to favorites or, to watch */}
            <div className="flex flex-wrap items-center gap-3 mt-auto pt-4">
              <Button
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading}
                variant={isFavorite ? 'secondary' : 'default'}
                className={isFavorite ? 'border border-accent text-accent' : ''}
              >
                <Heart
                  className={`mr-2 size-4 ${isFavorite ? 'fill-current text-accent' : ''}`}
                />
                {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Button>
            </div>
          </div>
        </div>

        {/* Section des avis */}
        <div className="mt-12">
          <ReviewSection 
            movieId={movie.id} 
            onAverageChange={setAverageRating}
          />
        </div>
      </div>
    </div>
  );
}
