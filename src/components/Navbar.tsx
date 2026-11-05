import { useState } from 'react';
import { Film, Search, Plus, Menu, X, Clapperboard, Tv, Popcorn, Bookmark } from 'lucide-react';
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
}

export default function Navbar({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddClick,
  watchlistCount = 0,
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="group flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <Film className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-indigo-400">
              Watchlist
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = activeCategory === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    isActive
                      ? 'text-white bg-slate-800/90 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <link.icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                  {link.id === 'watchlist' && watchlistCount > 0 && (
                    <span className="ml-1 rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-300">
                      {watchlistCount}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-[13px] left-3 right-3 h-0.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Search (Home only), Add Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Desktop Search (Home discovery) */}
          {activeCategory === 'home' && (
            <div className="relative hidden sm:block w-48 md:w-60 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search titles, genres..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 w-full rounded-lg border-slate-800 bg-slate-900/90 pl-9 pr-8 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
              className="h-9 w-9 text-slate-300 hover:bg-slate-800 hover:text-white sm:hidden"
              aria-label="Toggle search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Add Title CTA */}
          <Button
            type="button"
            onClick={handleAddClick}
            className="h-9 gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Add Title</span>
          </Button>

          {/* Mobile Hamburger Menu Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar Expansion (Home only) */}
      {mobileSearchOpen && activeCategory === 'home' && (
        <div className="border-t border-slate-800/60 bg-slate-950 px-4 py-2.5 sm:hidden">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              autoFocus
              placeholder="Search titles, genres..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-lg border-slate-800 bg-slate-900 pl-9 pr-8 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800/80 bg-slate-950/95 px-4 pt-2 pb-4 shadow-xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-1 pt-1">
            {navLinks.map((link) => {
              const isActive = activeCategory === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.id === 'watchlist' && watchlistCount > 0 && (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                      {watchlistCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

