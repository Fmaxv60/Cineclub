'use client';

import { useState, useEffect } from 'react';
import { Star, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTokenFromStorage } from '@/lib/token';

interface Rating {
  id: string;
  user_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  username: string;
}

interface ReviewSectionProps {
  movieId: number;
  onAverageChange?: (average: number) => void;
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

/**
 * Retourne une couleur de fond dégradée basée sur le score
 */
function getScoreBgColor(score: number): string {
  if (score < 3) {
    return 'bg-red-500/10';
  } else if (score < 5) {
    return 'bg-orange-500/10';
  } else if (score < 7) {
    return 'bg-yellow-500/10';
  } else if (score < 9) {
    return 'bg-lime-500/10';
  } else {
    return 'bg-green-500/10';
  }
}

export default function ReviewSection({ movieId, onAverageChange }: ReviewSectionProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  // Form state
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRatings();
    const token = getTokenFromStorage();
    setIsAuthenticated(!!token);
  }, [movieId]);

  const fetchRatings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/movies/${movieId}/ratings`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
        
        // Calculer la moyenne
        if (data.length > 0) {
          const average = data.reduce((sum: number, r: Rating) => sum + r.score, 0) / data.length;
          setAverageScore(Math.round(average * 10) / 10);
          onAverageChange?.(average);
        } else {
          setAverageScore(null);
          onAverageChange?.(0);
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getTokenFromStorage();

    if (!token) {
      alert('Vous devez être connecté pour laisser un avis');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/movies/${movieId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, comment }),
      });

      if (response.ok) {
        setComment('');
        setScore(5);
        setIsEditing(false);
        fetchRatings();
      } else {
        alert('Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Chargement des avis...</div>;
  }

  return (
    <div className="py-8 border-t border-border">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Avis et évaluations</h2>
        {averageScore !== null && (
          <div className="flex items-center gap-2">
            <Star className={`size-5 fill-current ${getScoreColor(averageScore)}`} />
            <span className={`text-lg font-bold ${getScoreColor(averageScore)}`}>
              {averageScore}/10
            </span>
            <span className="text-sm text-muted-foreground">
              ({ratings.length} {ratings.length > 1 ? 'avis' : 'avis'})
            </span>
          </div>
        )}
      </div>

      {/* Form d'ajout/modification d'avis */}
      {isAuthenticated && (
        <div className="mb-8 p-4 bg-card rounded-lg border border-border">
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Votre évaluation
            </label>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => setScore(value)}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                    score === value
                      ? `${getScoreBgColor(value)} ${getScoreColor(value)} border border-current`
                      : 'bg-muted text-muted-foreground hover:bg-accent/20'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className={`mt-2 flex items-center gap-1 ${getScoreColor(score)}`}>
              <Star className="size-4 fill-current" />
              <span className="text-sm font-semibold">{score}/10</span>
            </div>
          </div>

          {isEditing && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                placeholder="Partagez votre avis sur ce film..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background text-foreground border border-border placeholder:text-muted-foreground resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Check className="size-4" />
                  Publier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setComment('');
                    setScore(5);
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="size-4" />
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="w-full">
              <Edit2 className="mr-2 size-4" />
              {userRating ? 'Modifier mon avis' : 'Laisser un avis'}
            </Button>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="mb-8 p-4 bg-card rounded-lg border border-border text-center text-muted-foreground">
          Connectez-vous pour laisser un avis
        </div>
      )}

      {/* Liste des avis - Grid 2 colonnes */}
      <div>
        {ratings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucun avis pour le moment</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className={`p-4 rounded-lg border border-border ${getScoreBgColor(rating.score)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{rating.username}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className={`size-4 fill-current ${getScoreColor(rating.score)}`} />
                      <span className={`text-sm font-semibold ${getScoreColor(rating.score)}`}>
                        {rating.score}/10
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {rating.comment && (
                  <p className="text-sm text-muted-foreground mt-2">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
