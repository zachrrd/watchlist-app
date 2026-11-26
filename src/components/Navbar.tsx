import { useState } from 'react';
import {
  Film,
  Search,
  Plus,
  Menu,
  X,
  Clapperboard,
  Tv,
  Popcorn,
  Bookmark,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type NavCategory = 'home' | 'movies' | 'series' | 'anime' | 'watchlist';

interface NavbarProps {
  activeCategory: NavCategory;
  onSelectCategory: (category: NavCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  watchlistCount?: number;
  onSignOut?: () => void;
}

export default function Navbar({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddClick,
  watchlistCount = 0,
  onSignOut,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navLinks: { id: NavCategory; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Film },
    { id: 'movies', label: 'Movies', icon: Popcorn },
    { id: 'series', label: 'TV Series', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Clapperboard },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ];

  const handleNavClick = (category: NavCategory) => {
    onSelectCategory(category);
    setMobileMenuOpen(false);
  };

  const handleAddClick = () => {
    onAddClick();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#09090b]/85 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-7 lg:gap-9">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="group flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#14161c] transition-colors group-hover:border-indigo-500/40">
              <Film className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white transition-colors group-hover:text-zinc-200">
              Watchlist
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => {
              const isActive = activeCategory === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                  }`}
                >
                  <link.icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-indigo-400' : 'text-zinc-500'
                    }`}
                  />
                  <span>{link.label}</span>
                  {link.id === 'watchlist' && watchlistCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-indigo-300 leading-none">
                      {watchlistCount}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-[15px] left-3 right-3 h-[2px] rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Search (Home only), Add Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Desktop Search (Home discovery) */}
          {activeCategory === 'home' && (
            <div className="relative hidden sm:block w-48 md:w-56 lg:w-68">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search titles, genres..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 w-full rounded-lg border-white/[0.08] bg-[#111216] pl-8.5 pr-8 text-sm text-zinc-100 placeholder:text-zinc-400/70 focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Mobile Search Button (Toggle - Home only) */}
          {activeCategory === 'home' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="h-9 w-9 text-zinc-300 hover:bg-white/[0.06] hover:text-white sm:hidden cursor-pointer"
              aria-label="Toggle search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Add Title CTA */}
          <Button
            type="button"
            onClick={handleAddClick}
            className="h-9 gap-1.5 rounded-lg bg-indigo-500 px-3.5 text-sm font-medium text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.5)] hover:bg-indigo-400 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Title</span>
          </Button>

          {/* Desktop Sign Out Button */}
          {onSignOut && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="hidden sm:inline-flex h-9 gap-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] text-xs font-medium cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Sign Out</span>
            </Button>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 text-zinc-300 hover:bg-white/[0.06] hover:text-white md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar Expansion (Home only) */}
      {mobileSearchOpen && activeCategory === 'home' && (
        <div className="border-t border-white/[0.06] bg-[#09090b] px-4 py-2.5 sm:hidden">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              autoFocus
              placeholder="Search titles, genres..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-lg border-white/[0.08] bg-[#111216] pl-9 pr-8 text-sm text-zinc-100 placeholder:text-zinc-400/70 focus-visible:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/[0.07] bg-[#09090b]/95 px-4 pt-2 pb-4 shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-1 pt-1" aria-label="Mobile">
            {navLinks.map((link) => {
              const isActive = activeCategory === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-indigo-400' : 'text-zinc-500'
                      }`}
                    />
                    <span>{link.label}</span>
                  </div>
                  {link.id === 'watchlist' && watchlistCount > 0 && (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold tabular-nums text-indigo-300">
                      {watchlistCount}
                    </span>
                  )}
                </button>
              );
            })}

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="mt-2 flex items-center gap-2.5 rounded-lg border-t border-white/[0.07] px-3 pt-3 pb-2 text-sm font-medium text-red-400 transition-colors hover:bg-white/[0.04] hover:text-red-300 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
