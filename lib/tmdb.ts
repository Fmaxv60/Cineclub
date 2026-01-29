const TMDB_API_KEY = process.env.TMDB_APIKEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

/**
 * Recherche des films via l'API Next.js
 */
export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const url = `/api/movies/search?query=${encodeURIComponent(query)}&page=${page}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erreur lors de la recherche de films');
  }

  return response.json();
}

/**
 * Génère l'URL d'une image TMDB
 */
export function getTMDBImageUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Récupère les détails d'un film via l'API Next.js
 */
export async function getMovieDetails(movieId: number | string) {
  const url = `/api/movies/${movieId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des détails du film');
  }

  return response.json();
}
