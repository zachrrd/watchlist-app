import { useState, useRef, useEffect } from 'react';
import type { Series } from '../types';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Film, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

export interface MediaCardProps {
  show: Series;
  progress?: number;
  episodeCount?: number;
  onClick: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const posterSrc =
    show.poster?.trim() ||
    show.poster_url?.trim() ||
    show.backdrop?.trim() ||
    show.backdrop_url?.trim() ||
    null;

  const isImageValid = Boolean(posterSrc && failedUrl !== posterSrc);

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

  const hasMeaningfulProgress =
    typeof progress === 'number' && progress > 0 && progress < 100;

  const getStatusDotColor = (status?: string) => {
    switch (status) {
      case 'Watching':
        return 'bg-emerald-400';
      case 'Completed':
        return 'bg-indigo-400';
      case 'Plan to Watch':
        return 'bg-amber-400';
      default:
        return 'bg-zinc-500';
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
      className={`group relative flex flex-col cursor-pointer select-none rounded-xl bg-[#111216] ring-1 ring-white/[0.08] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.65)] transition-all duration-300 ease-out hover:-translate-y-1 hover:ring-white/25 hover:shadow-[0_18px_36px_-10px_rgba(0,0,0,0.85)] hover:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
    >
      {/* 2:3 Poster Container */}
      <AspectRatio ratio={2 / 3} className="relative w-full overflow-hidden bg-[#0c0d11]">
        {posterSrc && isImageValid ? (
          <img
            key={posterSrc}
            src={posterSrc}
            alt={show.title}
            onError={() => setFailedUrl(posterSrc)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#14161d] to-[#0b0c10]">
            <Film className="h-9 w-9 text-zinc-600 mb-2.5 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs font-medium text-zinc-300 line-clamp-2 px-1">
              {show.title}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
              {show.type}
            </span>
          </div>
        )}

        {/* Clean Bottom Gradient Scrim (preserves upper poster art) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

        {/* Top-Right Quick Action Button (More Options) */}
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button
            type="button"
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#09090b]/75 text-zinc-200 backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-[#181920] hover:text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 z-30 w-36 rounded-lg border border-white/10 bg-[#14151b]/95 py-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onClick(show.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[0.07] hover:text-white cursor-pointer"
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
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[0.07] hover:text-white cursor-pointer"
                >
                  <Edit className="h-3.5 w-3.5 text-zinc-400" />
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
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Poster Content (Title & Typographic Metadata) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-col gap-0.5">
          {/* Media Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-50 tracking-tight line-clamp-1 group-hover:text-white transition-colors">
            {show.title}
          </h3>

          {/* Typographic Metadata Row: Status dot · Type · Year/Ep · Progress */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400 tabular-nums">
            <div className="flex items-center gap-1.5 truncate">
              {show.status && (
                <span
                  title={show.status}
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStatusDotColor(
                    show.status
                  )}`}
                />
              )}
              <span className="truncate">{show.type}</span>
              {(show.year || show.duration || (episodeCount && episodeCount > 0)) && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="shrink-0">
                    {show.type === 'Movie'
                      ? show.duration || show.year
                      : episodeCount && episodeCount > 0
                      ? `${episodeCount} Ep`
                      : show.year}
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

        {/* Thin Progress Line at Bottom Edge of Poster */}
        {hasMeaningfulProgress && (
          <div className="absolute bottom-0 left-0 right-0 z-10 h-[3px] bg-white/15 overflow-hidden">
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
