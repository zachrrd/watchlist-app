import { useState } from 'react';
import type { Series, Episode } from '../types';
import { Button } from '@/components/ui/button';
import { Info, Play } from 'lucide-react';

export interface HeroSectionProps {
  series: Series | null;
  episodeList: Episode[];
  onViewDetail: (id: number) => void;
  className?: string;
}

export default function HeroSection({
  series,
  episodeList,
  onViewDetail,
  className = '',
}: HeroSectionProps) {
  const [backdropError, setBackdropError] = useState(false);

  if (!series) return null;

  // Calculate episode progress if available
  const seriesEpisodes = episodeList.filter((ep) => ep.seriesId === series.id);
  const watchedCount = seriesEpisodes.filter((ep) => ep.watched).length;
  const progress =
    seriesEpisodes.length > 0
      ? Math.min(100, Math.max(0, Math.round((watchedCount / seriesEpisodes.length) * 100)))
      : undefined;

  // Secondary "Watch Now" action only when a valid watch link exists in episodes
  const nextUnwatchedEpisode = seriesEpisodes.find(
    (ep) => !ep.watched && ep.link && ep.link.trim().length > 0
  );
  const anyEpisodeWithLink = seriesEpisodes.find(
    (ep) => ep.link && ep.link.trim().length > 0
  );
  const watchTargetEpisode = nextUnwatchedEpisode || anyEpisodeWithLink;
  const watchLink = watchTargetEpisode?.link;
  const watchPlatform = watchTargetEpisode?.platform;

  // Backdrop image strategy: prefer explicit backdrop, fallback to poster
  const imageSource = series.backdrop || series.poster;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Watching':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-700/60 shadow-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Watching
          </span>
        );
      case 'Plan to Watch':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-700/60 shadow-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Plan to Watch
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-700/60 shadow-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section
      aria-label={`Featured: ${series.title}`}
      className={`relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-950 shadow-2xl min-h-[400px] sm:min-h-[460px] md:min-h-[500px] lg:min-h-[540px] flex items-end ${className}`}
    >
      {/* Background Media Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {imageSource && !backdropError ? (
          <img
            src={imageSource}
            alt={series.title}
            onError={() => setBackdropError(true)}
            className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950" />
        )}

        {/* Directional Vignettes / Scrims for High Contrast & Legibility */}
        {/* 1. Left-to-right gradient for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent w-full md:w-4/5" />

        {/* 2. Bottom-to-top gradient to blend with content rails */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        {/* 3. Subtle top vignette to blend under sticky navbar */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/70 to-transparent" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 w-full p-6 sm:p-8 md:p-12 lg:p-14 max-w-2xl lg:max-w-3xl flex flex-col items-start gap-3.5 sm:gap-4">
        
        {/* Typographic Metadata & Status Indicator */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {getStatusBadge(series.status)}

          <div className="flex items-center gap-1.5 text-slate-300 font-medium drop-shadow-xs">
            <span>{series.type}</span>
            {(series.year || (series.duration && series.type === 'Movie')) && (
              <>
                <span className="text-slate-500">·</span>
                <span>{series.type === 'Movie' ? series.duration || series.year : series.year}</span>
              </>
            )}
            {series.genre && (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300 line-clamp-1">{series.genre}</span>
              </>
            )}
          </div>

          {typeof progress === 'number' && progress > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-500/30">
              {progress}% Watched
            </span>
          )}
        </div>

        {/* Featured Media Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg line-clamp-2">
          {series.title}
        </h1>

        {/* Short Synopsis / Description */}
        {series.description && (
          <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-xl drop-shadow-xs">
            {series.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Primary View Details Button */}
          <Button
            type="button"
            onClick={() => onViewDetail(series.id)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 sm:px-6 py-2.5 rounded-lg shadow-lg shadow-indigo-600/25 transition-all active:scale-95 text-sm gap-2"
          >
            <Info className="h-4 w-4" />
            <span>View Details</span>
          </Button>

          {/* Secondary Watch Now Button (only if valid watch link exists) */}
          {watchLink && (
            <a
              href={watchLink}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
            >
              <Button
                type="button"
                variant="outline"
                className="border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-white hover:text-white backdrop-blur-md font-medium px-5 sm:px-6 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 text-sm gap-2"
              >
                <Play className="h-4 w-4 text-indigo-400 fill-indigo-400" />
                <span>
                  Watch Now{watchPlatform ? ` on ${watchPlatform}` : ''}
                </span>
              </Button>
            </a>
          )}
        </div>

      </div>
    </section>
  );
}

