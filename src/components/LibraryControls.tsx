import { Search, X, Rows3, LayoutGrid, RotateCcw } from 'lucide-react';
import type { SortOption, StatusFilterOption } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface LibraryControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilterOption;
  onStatusChange: (status: StatusFilterOption) => void;
  genreFilter: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'rails' | 'grid';
  onViewModeChange: (mode: 'rails' | 'grid') => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export default function LibraryControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  genreFilter,
  onGenreChange,
  availableGenres,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
  isFiltered,
}: LibraryControlsProps) {
  return (
    <div className="flex flex-col gap-3 w-full bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-800/80">
      {/* Primary Row: Search Bar & View Mode Toggle */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search titles, genres..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:border-indigo-500 rounded-lg text-sm w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-0.5 p-1 bg-slate-950/90 rounded-lg border border-slate-800 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className={`h-7 w-7 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-slate-800 text-indigo-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Poster Grid View"
            aria-label="Poster Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('rails')}
            className={`h-7 w-7 rounded-md transition-colors ${
              viewMode === 'rails'
                ? 'bg-slate-800 text-indigo-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Streaming Rails View"
            aria-label="Streaming Rails View"
          >
            <Rows3 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Secondary Controls: Status, Genre, Sort & Clear Action */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/40">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
          
          {/* Status Filter */}
          <div className="w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(val) => onStatusChange((val as StatusFilterOption) || 'all')}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-full sm:w-auto min-w-[120px] bg-slate-950/70 border-slate-800 text-slate-200 text-xs hover:border-slate-700"
              >
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Watching">Watching</SelectItem>
                <SelectItem value="Plan to Watch">Plan to Watch</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Genre Filter */}
          <div className="w-full sm:w-auto">
            <Select
              value={genreFilter}
              onValueChange={(val) => onGenreChange(val || 'all')}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-full sm:w-auto min-w-[125px] bg-slate-950/70 border-slate-800 text-slate-200 text-xs hover:border-slate-700"
              >
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs max-h-64">
                <SelectItem value="all">All Genres</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Selector */}
          <div className="col-span-2 sm:col-span-1 w-full sm:w-auto">
            <Select
              value={sortBy}
              onValueChange={(val) => onSortChange((val as SortOption) || 'default')}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-full sm:w-auto min-w-[145px] bg-slate-950/70 border-slate-800 text-slate-200 text-xs hover:border-slate-700"
              >
                <SelectValue placeholder="Default Order" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="default">Default Order</SelectItem>
                <SelectItem value="title-asc">Title: A → Z</SelectItem>
                <SelectItem value="title-desc">Title: Z → A</SelectItem>
                <SelectItem value="year-desc">Release Year: Newest</SelectItem>
                <SelectItem value="year-asc">Release Year: Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset / Clear Button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/80 gap-1.5 px-2.5 shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear Filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}
