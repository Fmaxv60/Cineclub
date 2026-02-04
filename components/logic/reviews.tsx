'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMovieDetails } from '@/lib/tmdb';
import { MessageSquare, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LatestReview {
  id: string;
  user_id: string;
  username: string;
  tmdb_movie_id: number;
  score: number;
  comment: string | null;
  created_at: string;
}

interface MovieDetails {
  id: number;
  title: string;
}

interface ReviewWithMovie extends LatestReview {
  movie?: MovieDetails;
}

/**
 * Retourne une couleur dégradée basée sur le score (0-10)
 * 0-3: rouge, 3-6: orange/jaune, 6-8: jaune/vert, 8-10: vert
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

export default function LatestReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewWithMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestReviews = async () => {
      try {
        setIsLoading(true);

        // Récupérer les 5 dernières reviews
        const response = await fetch('/api/ratings/latest?limit=5');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des reviews');
        }

        const reviewsData: LatestReview[] = await response.json();

        // Récupérer les titres des films
        const reviewsWithMovies = await Promise.all(
          reviewsData.map(async (review) => {
            try {
              const movieData = await getMovieDetails(review.tmdb_movie_id.toString());
              return { ...review, movie: movieData };
            } catch (error) {
              console.error(`Erreur pour le film ${review.tmdb_movie_id}:`, error);
              return review;
            }
          })
        );

        setReviews(reviewsWithMovies);
      } catch (error) {
        console.error('Erreur lors du chargement des reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestReviews();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Dernières critiques</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-3 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2 w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Dernières critiques</h2>
        <Card className="p-6 text-center">
          <MessageSquare className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune critique pour le moment</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">Dernières critiques</h2>
      <div className="space-y-2">
        {reviews.map((review) => {
          const reviewDate = new Date(review.created_at);
          const timeAgo = getTimeAgo(reviewDate);

          return (
            <Card
              key={review.id}
              className="p-3 hover:bg-accent/5 transition-colors cursor-pointer"
              onClick={() => router.push(`/home/movie/${review.tmdb_movie_id}`)}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
                  {review.username.charAt(0).toUpperCase()}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {review.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {review.movie?.title || 'Film inconnu'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className={`size-3 fill-current ${getScoreColor(review.score)}`} />
                      <span className={`text-sm font-bold ${getScoreColor(review.score)}`}>
                        {review.score}/10
                      </span>
                    </div>
                  </div>

                  {/* Commentaire */}
                  {review.comment && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Temps écoulé */}
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}m`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  
  return date.toLocaleDateString('fr-FR');
}
