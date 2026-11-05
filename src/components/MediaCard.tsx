import { useState, useRef, useEffect } from 'react';
import type { Series } from '../types';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Film, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

export interface MediaCardProps {
  show: Series;
  progress?: number;
  episodeCount?: number;
  onClick: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

export default function MediaCard({
  show,
  progress,
  episodeCount,
  onClick,
  onEdit,
  onDelete,
  className = '',
}: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const hasMeaningfulProgress = typeof progress === 'number' && progress > 0 && progress < 100;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Watching':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-800/50';
      case 'Completed':
        return 'text-indigo-300 bg-indigo-950/70 border-indigo-800/50';
      case 'Plan to Watch':
        return 'text-amber-300 bg-amber-950/70 border-amber-800/50';
      default:
        return 'text-slate-300 bg-slate-900/70 border-slate-700/50';
    }
  };

  const handleCardClick = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    onClick(show.id);
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`View details for ${show.title}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`group relative flex flex-col cursor-pointer select-none rounded-xl bg-slate-900 border border-slate-800/80 overflow-hidden shadow-sm transition-all duration-200 ease-out hover:scale-[1.015] hover:border-slate-700 hover:shadow-lg hover:shadow-black/60 hover:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
    >
      {/* 2:3 Poster Container */}
      <AspectRatio ratio={2 / 3} className="relative w-full overflow-hidden bg-slate-950">
        {show.poster && !imgError ? (
          <img
            src={show.poster}
            alt={show.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-900 to-slate-950">
            <Film className="h-10 w-10 text-slate-600 mb-2 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs font-semibold text-slate-400 line-clamp-2 px-1">
              {show.title}
            </span>
            <span className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">
              {show.type}
            </span>
          </div>
        )}

        {/* Permanent Scrim + Hover Dark Gradient Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent transition-opacity duration-300 group-hover:via-slate-950/50" />

        {/* Top-Right Quick Action Button (More Options) */}
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button
            type="button"
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-slate-300 backdrop-blur-md border border-slate-700/50 transition-all hover:bg-slate-800 hover:text-white shadow-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 z-30 w-36 rounded-lg border border-slate-700 bg-slate-900/95 py-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onClick(show.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <Eye className="h-3.5 w-3.5 text-indigo-400" />
                <span>View Details</span>
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(show.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  <Edit className="h-3.5 w-3.5 text-slate-400" />
                  <span>Edit Title</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(show.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Poster Content (Title & Typographic Metadata) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-col">
          {/* Subtle Status Indicator */}
          {show.status && (
            <div className="mb-1">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wide border shadow-xs ${getStatusColor(
                  show.status
                )}`}
              >
                {show.status}
              </span>
            </div>
          )}

          {/* Media Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:text-indigo-300 transition-colors drop-shadow-xs">
            {show.title}
          </h3>

          {/* Typographic Metadata Row: Type · Year/Duration · Genre */}
          <div className="mt-0.5 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span>{show.type}</span>
              {(show.year || show.duration || (episodeCount && episodeCount > 0)) && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>
                    {show.type === 'Movie'
                      ? show.duration || show.year
                      : episodeCount && episodeCount > 0
                      ? `${episodeCount} Ep`
                      : show.year}
                  </span>
                </>
              )}
              {show.genre && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="truncate max-w-[70px] sm:max-w-[90px]">
                    {show.genre.split(/[,/]/)[0].trim()}
                  </span>
                </>
              )}
            </div>

            {hasMeaningfulProgress && (
              <span className="text-indigo-400 font-medium text-[10px] shrink-0 ml-1">
                {progress}%
              </span>
            )}
          </div>
        </div>

        {/* Bottom Progress Bar — Only shown when meaningful progress exists */}
        {hasMeaningfulProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/80 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </AspectRatio>
    </div>
  );
}

