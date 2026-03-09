'use client';

import { useRouter } from 'next/navigation';
import Avatar from './avatar';
import SearchBar from './search-bar';

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="theme-cineclub sticky top-0 z-50 w-full bg-background text-foreground">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 w-full items-center gap-6">
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="shrink-0 text-2xl font-bold hover:opacity-85 transition-opacity"
          >
            Cineclub
          </button>

          <div className="flex-1 flex justify-center">
            <SearchBar />
          </div>

          <button
            type="button"
            onClick={() => router.push('/home/leaderboard')}
            className="shrink-0 text-sm font-semibold text-muted-foreground hover:text-accent hover:scale-110 transition-all duration-200 uppercase tracking-wide"
          >
            Leaderboard
          </button>
          <div className="shrink-0 flex justify-end">
            <Avatar />
          </div>
        </div>
      </div>
    </nav>
  );
}
