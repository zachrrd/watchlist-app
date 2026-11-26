import { useState } from 'react';
import type { Series, Episode } from '../types';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export interface HeroSectionProps {
  series: Series | null;
  episodeList: Episode[];
  onViewDetail: (id: string) => void;
  className?: string;
}

export default function HeroSection({
  series,
  episodeList,
  onViewDetail,
  className = '',
}: HeroSectionProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!series) return null;

  // Calculate episode progress if available
  const seriesEpisodes = episodeList.filter((ep) => ep.seriesId === series.id);
  const watchedCount = seriesEpisodes.filter((ep) => ep.watched).length;
  const progress =
    seriesEpisodes.length > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((watchedCount / seriesEpisodes.length) * 100))
        )
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
  const imageSource =
    series.backdrop?.trim() ||
    series.backdrop_url?.trim() ||
    series.poster?.trim() ||
    series.poster_url?.trim() ||
    null;

  const isBackdropValid = Boolean(imageSource && failedUrl !== imageSource);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Watching':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Watching
          </span>
        );
      case 'Plan to Watch':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/70 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Plan to Watch
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/70 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const isResumable =
    series.status === 'Watching' || (typeof progress === 'number' && progress > 0 && progress < 100);

  return (
    <section
      aria-label={`Featured: ${series.title}`}
      className={`relative flex min-h-[380px] w-full items-end overflow-hidden rounded-2xl bg-[#09090b] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[540px] ${className}`}
    >
      {/* Background Media Container */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {imageSource && isBackdropValid ? (
          <img
            key={imageSource}
            src={imageSource}
            alt={series.title}
            onError={() => setFailedUrl(imageSource)}
            className="h-full w-full object-cover object-center scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.18),transparent_60%),linear-gradient(135deg,#12131a_0%,#09090b_100%)]" />
        )}

        {/* Seamless Gradient Masks melting into #09090b background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent md:w-4/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/55 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#09090b]/75 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#09090b]/70 to-transparent" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-start gap-3.5 p-5 sm:p-8 md:p-11 lg:max-w-3xl lg:p-14">
        {/* Typographic Metadata & Status Indicator */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {getStatusBadge(series.status)}

          <div className="flex flex-wrap items-center gap-1.5 font-medium text-zinc-300 tabular-nums">
            <span>{series.type}</span>
            {(series.year || (series.duration && series.type === 'Movie')) && (
              <>
                <span className="text-zinc-500">·</span>
                <span>
                  {series.type === 'Movie'
                    ? series.duration || series.year
                    : series.year}
                </span>
              </>
            )}
            {series.genre && (
              <>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-300 line-clamp-1">{series.genre}</span>
              </>
            )}
          </div>
        </div>

        {/* Featured Media Title */}
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white leading-[1.06] sm:text-4xl md:text-5xl line-clamp-2">
          {series.title}
        </h1>

        {/* Short Synopsis / Description */}
        {series.description && (
          <p className="max-w-xl text-xs leading-relaxed text-zinc-300/90 sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3">
            {series.description}
          </p>
        )}

        {/* Episode Progress Bar (when tracking episodes) */}
        {typeof progress === 'number' && seriesEpisodes.length > 0 && (
          <div className="flex w-full max-w-xs items-center gap-3 pt-0.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-zinc-300 shrink-0">
              {watchedCount}/{seriesEpisodes.length} ep · {progress}%
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1.5">
          <Button
            type="button"
            onClick={() => onViewDetail(series.id)}
            className="h-10 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.65)] transition-all hover:bg-zinc-200 active:scale-[0.98] gap-2 cursor-pointer"
          >
            <span>{isResumable ? 'Continue Watching' : 'View Details'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

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
                className="h-10 rounded-lg border-white/15 bg-white/[0.08] px-5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/[0.14] hover:text-white active:scale-[0.98] gap-2 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-white text-white" />
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
