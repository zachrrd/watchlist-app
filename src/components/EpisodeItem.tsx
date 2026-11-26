import { useState } from 'react';
import type { Episode } from '../types';
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  PlayCircle,
  Film,
  ExternalLink,
} from "lucide-react";
import { isValidHttpUrl, detectPlatform } from "@/lib/utils";

interface EpisodeItemProps {
  ep: Episode;
  seriesPoster?: string;
  onToggleWatched: (id: string) => void;
  onEdit: (ep: Episode) => void;
  onDelete: (id: string) => void;
}

export default function EpisodeItem({
  ep,
  seriesPoster,
  onToggleWatched,
  onEdit,
  onDelete,
}: EpisodeItemProps) {
  const [thumbError, setThumbError] = useState(false);

  const hasValidLink = isValidHttpUrl(ep.link);
  const platformName = ep.platform || detectPlatform(ep.link);

  return (
    <div
      className={`group flex flex-col justify-between gap-3 px-3.5 py-3 transition-colors sm:flex-row sm:items-center sm:px-4 sm:py-3.5 ${
        ep.watched
          ? 'bg-white/[0.01] text-zinc-400 hover:bg-white/[0.03]'
          : 'text-zinc-100 hover:bg-white/[0.03]'
      }`}
    >
      {/* Left: Watched Toggle, Number, Thumbnail, Title & Notes */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
        {/* Watched Toggle */}
        <button
          type="button"
          onClick={() => onToggleWatched(ep.id)}
          className="-ml-1 shrink-0 rounded-full p-1 text-zinc-400 transition-colors hover:text-white cursor-pointer"
          title={ep.watched ? "Mark as unwatched" : "Mark as watched"}
          aria-label={ep.watched ? "Mark as unwatched" : "Mark as watched"}
        >
          {ep.watched ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <Circle className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-zinc-400" />
          )}
        </button>

        {/* Episode Number */}
        <span className="w-6 shrink-0 text-center font-mono text-xs font-semibold tabular-nums text-zinc-500 sm:text-sm">
          {ep.episodeNumber !== undefined
            ? String(ep.episodeNumber).padStart(2, '0')
            : '--'}
        </span>

        {/* Compact Thumbnail */}
        <div className="relative flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#14161d] ring-1 ring-white/[0.08]">
          {seriesPoster && !thumbError ? (
            <img
              src={seriesPoster}
              alt={ep.title}
              onError={() => setThumbError(true)}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                ep.watched ? 'opacity-50 grayscale-[30%]' : ''
              }`}
              loading="lazy"
            />
          ) : (
            <Film className="h-4 w-4 text-zinc-600" />
          )}
        </div>

        {/* Title, Season Badge & Optional Notes */}
        <div className="flex min-w-0 flex-1 flex-col pr-1">
          <div className="flex flex-wrap items-center gap-2">
            {ep.season && (
              <span className="shrink-0 rounded border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400 leading-none">
                S{ep.season}
              </span>
            )}
            <span
              className={`text-xs font-medium leading-snug break-words sm:text-sm ${
                ep.watched ? 'text-zinc-400 line-through' : 'text-zinc-100'
              }`}
            >
              {ep.title}
            </span>
          </div>

          {ep.notes && (
            <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">
              {ep.notes}
            </p>
          )}
        </div>
      </div>

      {/* Right: Watch Link & Row Actions */}
      <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-white/[0.06] pt-2 sm:justify-end sm:border-t-0 sm:pt-0">
        {hasValidLink ? (
          <a
            href={ep.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 hover:text-indigo-200"
            title={`Watch on ${platformName}`}
          >
            <PlayCircle className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <span className="max-w-[110px] truncate sm:max-w-none">
              {platformName}
            </span>
            <ExternalLink className="h-3 w-3 shrink-0 text-indigo-400/70 transition-transform group-hover/link:translate-x-0.5" />
          </a>
        ) : (
          <div className="hidden sm:block sm:w-2" />
        )}

        <div className="flex items-center gap-1 border-l border-white/[0.07] pl-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
            onClick={() => onEdit(ep)}
            title="Edit Episode"
            aria-label="Edit Episode"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
            onClick={() => onDelete(ep.id)}
            title="Delete Episode"
            aria-label="Delete Episode"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
