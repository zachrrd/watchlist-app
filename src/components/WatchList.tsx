import { useState, useMemo } from "react";
import type { Series, Episode, SortOption, StatusFilterOption } from "../types";
import type { NavCategory } from "./Navbar";
import HeroSection from "./HeroSection";
import MediaCard from "./MediaCard";
import ContentRail from "./ContentRail";
import LibraryControls from "./LibraryControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Film,
  Popcorn,
  Tv,
  Clapperboard,
  Bookmark,
  X,
} from "lucide-react";

interface WatchlistProps {
  seriesList: Series[];
  episodeList: Episode[];
  onAddClick: () => void;
  onSeriesClick: (id: number) => void;
  onEditShow?: (id: number) => void;
  onDeleteShow?: (id: number) => void;
  activeCategory?: NavCategory;
  onSelectCategory?: (category: NavCategory) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

function selectFeaturedMedia(
  candidates: Series[],
  episodeList: Episode[]
): Series | null {
  if (!candidates || candidates.length === 0) return null;

  const calculateProgress = (seriesId: number): number | undefined => {
    const episodes = episodeList.filter((ep) => ep.seriesId === seriesId);
    if (episodes.length === 0) return undefined;
    const watched = episodes.filter((ep) => ep.watched).length;
    return Math.min(100, Math.max(0, Math.round((watched / episodes.length) * 100)));
  };

  // Rule 1: status === 'Watching' with actual partial episode progress (1% - 99%)
  const watchingWithPartialProgress = candidates.find((show) => {
    if (show.status !== 'Watching') return false;
    const prog = calculateProgress(show.id);
    return prog !== undefined && prog > 0 && prog < 100;
  });
  if (watchingWithPartialProgress) return watchingWithPartialProgress;

  // Rule 2: Any title with status === 'Watching' that is not 100% completed
  const watchingTitle = candidates.find((show) => {
    if (show.status !== 'Watching') return false;
    const prog = calculateProgress(show.id);
    return prog === undefined || prog < 100;
  });
  if (watchingTitle) return watchingTitle;

  // Rule 3: Any title with status === 'Plan to Watch'
  const planToWatchTitle = candidates.find((show) => show.status === 'Plan to Watch');
  if (planToWatchTitle) return planToWatchTitle;

  // Rule 4: Non-completed title
  const nonCompletedTitle = candidates.find((show) => show.status !== 'Completed');
  if (nonCompletedTitle) return nonCompletedTitle;

  // Rule 5: Fallback to first available title
  return candidates[0] || null;
}

export default function Watchlist({
  seriesList,
  episodeList,
  onAddClick,
  onSeriesClick,
  onEditShow,
  onDeleteShow,
  activeCategory = 'home',
  onSelectCategory,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}: WatchlistProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [userSelectedViewMode, setUserSelectedViewMode] = useState<'rails' | 'grid' | null>(null);

  const viewMode = userSelectedViewMode ?? (activeCategory === 'home' ? 'rails' : 'grid');

  const search = externalSearchQuery !== undefined ? externalSearchQuery : internalSearch;
  const handleSearchChange = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const calculateProgress = (seriesId: number): number | undefined => {
    const episodes = episodeList.filter((ep) => ep.seriesId === seriesId);
    if (episodes.length === 0) return undefined;
    const watched = episodes.filter((ep) => ep.watched).length;
    return Math.min(100, Math.max(0, Math.round((watched / episodes.length) * 100)));
  };

  const getEpisodeCount = (seriesId: number) =>
    episodeList.filter((ep) => ep.seriesId === seriesId).length;

  // Dynamically extract unique genres from the series collection
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    seriesList.forEach((s) => {
      if (!s.genre) return;
      s.genre.split(/[,/]/).forEach((g) => {
        const trimmed = g.trim();
        if (trimmed) {
          genreSet.add(trimmed);
        }
      });
    });
    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [seriesList]);

  // --- FILTERING & SORTING PIPELINE ---
  // Step 1: Category Filter
  const categoryFiltered = useMemo(() => {
    return seriesList.filter((item) => {
      if (activeCategory === 'movies') return item.type === 'Movie';
      if (activeCategory === 'series') return item.type === 'TV Series';
      if (activeCategory === 'anime') return item.type === 'Anime';
      if (activeCategory === 'watchlist') {
        return item.status === 'Watching' || item.status === 'Plan to Watch';
      }
      return true; // 'home'
    });
  }, [seriesList, activeCategory]);

  // Step 2: Search Filter (Scoped to active category)
  const searchFiltered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return categoryFiltered;
    return categoryFiltered.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(query);
      const matchGenre = s.genre ? s.genre.toLowerCase().includes(query) : false;
      return matchTitle || matchGenre;
    });
  }, [categoryFiltered, search]);

  // Step 3: Status Filter
  const statusFiltered = useMemo(() => {
    if (statusFilter === 'all') return searchFiltered;
    return searchFiltered.filter((s) => s.status === statusFilter);
  }, [searchFiltered, statusFilter]);

  // Step 4: Genre Filter
  const genreFiltered = useMemo(() => {
    if (genreFilter === 'all') return statusFiltered;
    const target = genreFilter.toLowerCase();
    return statusFiltered.filter((s) => {
      if (!s.genre) return false;
      return s.genre
        .split(/[,/]/)
        .map((g) => g.trim().toLowerCase())
        .includes(target);
    });
  }, [statusFiltered, genreFilter]);

  // Step 5: Sort
  const sortedList = useMemo(() => {
    const result = [...genreFiltered];
    if (sortBy === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'year-desc') {
      result.sort((a, b) => {
        const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year || '0'), 10) || 0;
        const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year || '0'), 10) || 0;
        return yearB - yearA;
      });
    } else if (sortBy === 'year-asc') {
      result.sort((a, b) => {
        const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year || '0'), 10) || 0;
        const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year || '0'), 10) || 0;
        return yearA - yearB;
      });
    }
    // 'default': retains original array insertion order
    return result;
  }, [genreFiltered, sortBy]);

  const isSearchActive = search.trim().length > 0;
  const isFiltered =
    isSearchActive ||
    statusFilter !== 'all' ||
    genreFilter !== 'all' ||
    sortBy !== 'default';

  const handleClearAll = () => {
    handleSearchChange('');
    setStatusFilter('all');
    setGenreFilter('all');
    setSortBy('default');
  };

  // Featured Media Selection (Home page only)
  const featuredShow =
    activeCategory === 'home' && !isSearchActive
      ? selectFeaturedMedia(seriesList, episodeList)
      : null;

  // Category Header Info
  const categoryMeta: Record<NavCategory, { title: string }> = {
    home: { title: 'Discover' },
    movies: { title: 'Movies' },
    series: { title: 'TV Series' },
    anime: { title: 'Anime' },
    watchlist: { title: 'Watchlist' },
  };

  const filterTabs: { id: NavCategory; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'All', icon: Film },
    { id: 'movies', label: 'Movies', icon: Popcorn },
    { id: 'series', label: 'TV Series', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Clapperboard },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ];

  // Helper to render a card inside a rail
  const renderRailCard = (show: Series) => {
    const progress = calculateProgress(show.id);
    const episodeCount = getEpisodeCount(show.id);

    return (
      <div
        key={show.id}
        className="w-[140px] xs:w-[155px] sm:w-[175px] md:w-[195px] lg:w-[215px] shrink-0 snap-start"
      >
        <MediaCard
          show={show}
          progress={progress}
          episodeCount={episodeCount}
          onClick={onSeriesClick}
          onEdit={onEditShow}
          onDelete={onDeleteShow}
        />
      </div>
    );
  };

  // Helper to render a card inside a grid
  const renderGridCard = (show: Series) => {
    const progress = calculateProgress(show.id);
    const episodeCount = getEpisodeCount(show.id);

    return (
      <MediaCard
        key={show.id}
        show={show}
        progress={progress}
        episodeCount={episodeCount}
        onClick={onSeriesClick}
        onEdit={onEditShow}
        onDelete={onDeleteShow}
      />
    );
  };

  // Rails Partitioning for Home
  const continueWatching = categoryFiltered.filter((s) => {
    const prog = calculateProgress(s.id);
    if (prog !== undefined && prog > 0 && prog < 100) return true;
    if (s.status === 'Watching' && (prog === undefined || prog < 100)) return true;
    return false;
  });

  const moviesList = categoryFiltered.filter((s) => s.type === 'Movie');
  const tvSeriesList = categoryFiltered.filter((s) => s.type === 'TV Series');
  const animeList = categoryFiltered.filter((s) => s.type === 'Anime');
  const completedList = categoryFiltered.filter((s) => {
    if (s.status === 'Completed') return true;
    const prog = calculateProgress(s.id);
    return prog !== undefined && prog === 100;
  });

  // Rails Partitioning for Category Pages (when not filtered)
  const planToWatchList = categoryFiltered.filter((s) => s.status === 'Plan to Watch');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* 1. Cinematic Hero Section — Home only, when not searching and featured show exists */}
      {activeCategory === 'home' && !isSearchActive && featuredShow && (
        <HeroSection
          series={featuredShow}
          episodeList={episodeList}
          onViewDetail={onSeriesClick}
        />
      )}

      {/* 2. Category Header & Navigation Bar (Category Views Only) */}
      {activeCategory !== 'home' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {categoryMeta[activeCategory]?.title || 'Library'}
            </h1>
            <span className="text-sm font-medium text-slate-400">
              {isFiltered
                ? `(${sortedList.length} of ${categoryFiltered.length})`
                : `(${categoryFiltered.length})`}
            </span>
          </div>

          {/* Mobile-only Category Switcher & Add New Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onSelectCategory && (
              <div className="flex md:hidden items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
                {filterTabs.map((tab) => {
                  const isSelected = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelectCategory(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <tab.icon className="h-3 w-3" />
                      <span className="hidden xs:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              variant="outline"
              onClick={onAddClick}
              className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white shrink-0 gap-1.5 text-xs sm:text-sm font-medium transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Title</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Library Controls (Search, Status, Genre, Sort, View Mode) — Category Views */}
      {activeCategory !== 'home' && (
        <div className="space-y-3">
          <LibraryControls
            searchQuery={search}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            genreFilter={genreFilter}
            onGenreChange={setGenreFilter}
            availableGenres={availableGenres}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setUserSelectedViewMode}
            onClearFilters={handleClearAll}
            isFiltered={isFiltered}
          />

          {/* Active Filter Chips */}
          {isFiltered && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-400">
              <span className="text-slate-500 font-medium mr-1">Active filters:</span>

              {isSearchActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700/60">
                  <span>Search: &ldquo;{search.trim()}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Remove search filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-200 border border-indigo-800/60">
                  <span>Status: {statusFilter}</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="text-indigo-400 hover:text-white cursor-pointer"
                    aria-label="Remove status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {genreFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700/60">
                  <span>Genre: {genreFilter}</span>
                  <button
                    type="button"
                    onClick={() => setGenreFilter('all')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Remove genre filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700/60">
                  <span>
                    Sort: {
                      sortBy === 'title-asc'
                        ? 'A → Z'
                        : sortBy === 'title-desc'
                        ? 'Z → A'
                        : sortBy === 'year-desc'
                        ? 'Newest'
                        : 'Oldest'
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortBy('default')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Remove sort filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800/60 ml-auto sm:ml-1"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 4. CONTENT RENDERING */}

      {/* CASE A: HOME WITH ACTIVE SEARCH */}
      {activeCategory === 'home' && isSearchActive ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Search Results</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                {sortedList.length}
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear search
            </Button>
          </div>

          {sortedList.length === 0 ? (
            <Card className="bg-slate-900/40 border-slate-800/80">
              <CardContent className="py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 mb-3">
                  <Search className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">
                  No titles match your filters.
                </h3>
                <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
                  Try another search or clear the filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearchChange('')}
                  className="mt-4 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {sortedList.map((show) => renderGridCard(show))}
            </div>
          )}
        </div>
      ) : activeCategory === 'home' ? (
        /* CASE B: HOME WITH STREAMING RAILS (DEFAULT DISCOVERY) */
        <div className="space-y-8">
          {continueWatching.length > 0 && (
            <ContentRail
              title="Continue Watching"
              description="Pick up right where you left off"
              count={continueWatching.length}
            >
              {continueWatching.map((show) => renderRailCard(show))}
            </ContentRail>
          )}

          {moviesList.length > 0 && (
            <ContentRail
              title="Featured Movies"
              description="Feature films in your collection"
              count={moviesList.length}
            >
              {moviesList.map((show) => renderRailCard(show))}
            </ContentRail>
          )}

          {tvSeriesList.length > 0 && (
            <ContentRail
              title="TV Series"
              description="Binge-worthy shows & serials"
              count={tvSeriesList.length}
            >
              {tvSeriesList.map((show) => renderRailCard(show))}
            </ContentRail>
          )}

          {animeList.length > 0 && (
            <ContentRail
              title="Anime Collection"
              description="Top animated hits"
              count={animeList.length}
            >
              {animeList.map((show) => renderRailCard(show))}
            </ContentRail>
          )}

          {completedList.length > 0 && (
            <ContentRail
              title="Completed"
              description="Titles you have finished"
              count={completedList.length}
            >
              {completedList.map((show) => renderRailCard(show))}
            </ContentRail>
          )}
        </div>
      ) : sortedList.length === 0 ? (
        /* CASE C: CATEGORY EMPTY STATE */
        <Card className="bg-slate-900/40 border-slate-800/80">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 mb-3">
              {isFiltered ? (
                <Search className="h-6 w-6 text-slate-500" />
              ) : (
                <Film className="h-6 w-6 text-slate-500" />
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              {isFiltered ? 'No titles match your filters.' : 'Your watchlist is empty.'}
            </h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              {isFiltered
                ? 'Try another search or clear the filters.'
                : 'Add a movie or series to start building your library.'}
            </p>
            {isFiltered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="mt-4 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={onAddClick}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Title
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* CASE D: CATEGORY POSTER GRID VIEW (PRIMARY LIBRARY BROWSING) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              {isFiltered ? 'Filtered Results' : 'All Titles'}
            </h2>
            <span className="text-xs text-slate-500">
              Showing {sortedList.length} of {categoryFiltered.length} items
            </span>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {sortedList.map((show) => renderGridCard(show))}
          </div>
        </div>
      ) : (
        /* CASE E: CATEGORY STREAMING RAILS VIEW */
        <div className="space-y-8">
          {isFiltered ? (
            <ContentRail
              title={`${categoryMeta[activeCategory]?.title} (Filtered)`}
              description="Titles matching your active filters"
              count={sortedList.length}
            >
              {sortedList.map((show) => renderRailCard(show))}
            </ContentRail>
          ) : (
            <>
              {activeCategory === 'movies' && (
                <>
                  {planToWatchList.filter((s) => s.type === 'Movie').length > 0 && (
                    <ContentRail
                      title="Movies on Your Watchlist"
                      description="Queued to watch next"
                      count={planToWatchList.filter((s) => s.type === 'Movie').length}
                    >
                      {planToWatchList
                        .filter((s) => s.type === 'Movie')
                        .map((show) => renderRailCard(show))}
                    </ContentRail>
                  )}

                  {completedList.filter((s) => s.type === 'Movie').length > 0 && (
                    <ContentRail
                      title="Watched Movies"
                      description="Finished films"
                      count={completedList.filter((s) => s.type === 'Movie').length}
                    >
                      {completedList
                        .filter((s) => s.type === 'Movie')
                        .map((show) => renderRailCard(show))}
                    </ContentRail>
                  )}

                  <ContentRail
                    title="All Movies"
                    count={moviesList.length}
                  >
                    {moviesList.map((show) => renderRailCard(show))}
                  </ContentRail>
                </>
              )}

              {activeCategory === 'series' && (
                <>
                  {continueWatching.filter((s) => s.type === 'TV Series').length > 0 && (
                    <ContentRail
                      title="Currently Watching"
                      description="In-progress television serials"
                      count={continueWatching.filter((s) => s.type === 'TV Series').length}
                    >
                      {continueWatching
                        .filter((s) => s.type === 'TV Series')
                        .map((show) => renderRailCard(show))}
                    </ContentRail>
                  )}
                  <ContentRail
                    title="All TV Series"
                    count={tvSeriesList.length}
                  >
                    {tvSeriesList.map((show) => renderRailCard(show))}
                  </ContentRail>
                </>
              )}

              {activeCategory === 'anime' && (
                <>
                  {continueWatching.filter((s) => s.type === 'Anime').length > 0 && (
                    <ContentRail
                      title="Currently Watching"
                      description="In-progress anime series"
                      count={continueWatching.filter((s) => s.type === 'Anime').length}
                    >
                      {continueWatching
                        .filter((s) => s.type === 'Anime')
                        .map((show) => renderRailCard(show))}
                    </ContentRail>
                  )}
                  <ContentRail
                    title="All Anime"
                    count={animeList.length}
                  >
                    {animeList.map((show) => renderRailCard(show))}
                  </ContentRail>
                </>
              )}

              {activeCategory === 'watchlist' && (
                <>
                  {continueWatching.length > 0 && (
                    <ContentRail
                      title="Currently Watching"
                      description="Titles currently in progress"
                      count={continueWatching.length}
                    >
                      {continueWatching.map((show) => renderRailCard(show))}
                    </ContentRail>
                  )}

                  {planToWatchList.length > 0 && (
                    <ContentRail
                      title="Plan to Watch"
                      description="Saved to watch next"
                      count={planToWatchList.length}
                    >
                      {planToWatchList.map((show) => renderRailCard(show))}
                    </ContentRail>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
