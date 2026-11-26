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
    <div className="flex flex-col lg:flex-row lg:items-center gap-2 w-full rounded-xl border border-white/[0.08] bg-[#101116] p-2">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search titles, genres..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded-lg border-white/[0.07] bg-[#09090b] pl-8.5 pr-8 text-sm text-zinc-100 placeholder:text-zinc-400/70 focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/40"
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

      {/* Filters, Sort, Reset & View Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 flex-1 lg:flex-initial">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => onStatusChange((val as StatusFilterOption) || 'all')}
          >
            <SelectTrigger
              size="sm"
              className="h-9 w-full sm:w-auto min-w-[120px] rounded-lg border-white/[0.07] bg-[#09090b] text-xs text-zinc-200 hover:border-white/15"
            >
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#14151b] text-xs text-zinc-200">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Watching">Watching</SelectItem>
              <SelectItem value="Plan to Watch">Plan to Watch</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Genre Filter */}
          <Select
            value={genreFilter}
            onValueChange={(val) => onGenreChange(val || 'all')}
          >
            <SelectTrigger
              size="sm"
              className="h-9 w-full sm:w-auto min-w-[125px] rounded-lg border-white/[0.07] bg-[#09090b] text-xs text-zinc-200 hover:border-white/15"
            >
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent className="max-h-64 border-white/10 bg-[#14151b] text-xs text-zinc-200">
              <SelectItem value="all">All Genres</SelectItem>
              {availableGenres.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Selector */}
          <div className="col-span-2 sm:col-span-1">
            <Select
              value={sortBy}
              onValueChange={(val) => onSortChange((val as SortOption) || 'default')}
            >
              <SelectTrigger
                size="sm"
                className="h-9 w-full sm:w-auto min-w-[140px] rounded-lg border-white/[0.07] bg-[#09090b] text-xs text-zinc-200 hover:border-white/15"
              >
                <SelectValue placeholder="Default Order" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#14151b] text-xs text-zinc-200">
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
            className="h-9 gap-1.5 rounded-lg px-2.5 text-xs text-indigo-400 hover:bg-white/[0.06] hover:text-indigo-300 shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}

        {/* View Mode Switcher */}
        <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-[#09090b] p-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className={`h-7 w-7 rounded-md transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white/[0.1] text-white'
                : 'text-zinc-400 hover:text-zinc-200'
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
            className={`h-7 w-7 rounded-md transition-colors cursor-pointer ${
              viewMode === 'rails'
                ? 'bg-white/[0.1] text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Streaming Rails View"
            aria-label="Streaming Rails View"
          >
            <Rows3 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
