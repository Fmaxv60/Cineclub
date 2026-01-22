'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Film } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { searchMovies, getTMDBImageUrl, type TMDBMovie } from '@/lib/tmdb';

export default function SearchBar() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ne rechercher que si au moins 2 caractères
    if (searchValue.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchMovies(searchValue);
        setResults(data.results.slice(0, 5)); // Limiter à 5 résultats
        setIsOpen(data.results.length > 0);
      } catch (error) {
        console.error('Erreur de recherche:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setIsOpen(false);
      router.push(`/home?search=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleMovieClick = (movieId: number) => {
    setIsOpen(false);
    setSearchValue('');
    router.push(`/home/movie/${movieId}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
        <PopoverAnchor asChild>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un film"
            className="pl-10 pr-4 py-2 bg-card text-foreground border-border placeholder:text-muted-foreground rounded-full"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => {
              if (searchValue.trim().length >= 2 && results.length > 0) {
                setIsOpen(true);
              }
            }}
          />
        </PopoverAnchor>
        <Search className="absolute left-3 top-2 size-5 text-muted-foreground pointer-events-none" />
      </form>

      <PopoverContent
        className="theme-cineclub w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {results.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {results.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleMovieClick(movie.id)}
                className="w-full flex items-center gap-3 p-3 bg-card hover:bg-accent/10 transition-colors text-left border-b border-border last:border-b-0"
              >
                {movie.poster_path ? (
                  <img
                    src={getTMDBImageUrl(movie.poster_path, 'w92') || ''}
                    alt={movie.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                    <Film className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {movie.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Recherche en cours...
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
