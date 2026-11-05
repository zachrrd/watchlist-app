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
  onToggleWatched: (id: number) => void;
  onEdit: (ep: Episode) => void;
  onDelete: (id: number) => void;
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
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:py-3.5 sm:px-4 rounded-xl transition-all duration-150 gap-3 border-b border-slate-800/50 ${
        ep.watched
          ? 'bg-slate-950/20 text-slate-400 hover:bg-slate-900/40'
          : 'bg-slate-900/40 hover:bg-slate-900/80 text-slate-200'
      }`}
    >
      {/* Left: Number, Thumbnail, Watched Checkbox, Title & Metadata */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        
        {/* Episode Number */}
        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-500 w-5 sm:w-6 text-center shrink-0">
          {ep.episodeNumber !== undefined ? String(ep.episodeNumber).padStart(2, '0') : '--'}
        </span>

        {/* Thumbnail (Series Poster fallback) */}
        <div className="w-12 h-16 sm:w-14 sm:h-20 shrink-0 rounded-md overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center">
          {seriesPoster && !thumbError ? (
            <img
              src={seriesPoster}
              alt={ep.title}
              onError={() => setThumbError(true)}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                ep.watched ? 'opacity-60 grayscale-[30%]' : ''
              }`}
              loading="lazy"
            />
          ) : (
            <Film className="w-5 h-5 text-slate-700" />
          )}
        </div>

        {/* Watched Toggle Checkbox */}
        <button
          type="button"
          onClick={() => onToggleWatched(ep.id)}
          className="p-1 -ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          title={ep.watched ? "Mark as unwatched" : "Mark as watched"}
          aria-label={ep.watched ? "Mark as unwatched" : "Mark as watched"}
        >
          {ep.watched ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-xs" />
          ) : (
            <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
          )}
        </button>

        {/* Title, Season badge & optional Notes */}
        <div className="flex flex-col min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-2 flex-wrap">
            {ep.season && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50 shrink-0">
                S{ep.season}
              </span>
            )}
            <span
              className={`text-xs sm:text-sm font-medium leading-snug break-words ${
                ep.watched ? 'text-slate-400 line-through' : 'text-slate-100'
              }`}
            >
              {ep.title}
            </span>
          </div>

          {ep.notes && (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
              {ep.notes}
            </p>
          )}
        </div>
      </div>

      {/* Right: Watch Link & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
        
        {/* External Watch Link */}
        {hasValidLink ? (
          <a
            href={ep.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-900/50 px-2.5 py-1.5 rounded-lg transition-colors group/link"
            title={`Watch on ${platformName}`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-medium truncate max-w-[100px] sm:max-w-none">
              {platformName}
            </span>
            <ExternalLink className="w-3 h-3 text-indigo-400/70 shrink-0 group-hover/link:translate-x-0.5 transition-transform" />
          </a>
        ) : (
          <div className="hidden sm:block sm:w-2" />
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => onEdit(ep)}
            title="Edit Episode"
            aria-label="Edit Episode"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-400/80 hover:text-red-300 hover:bg-red-950/40"
            onClick={() => onDelete(ep.id)}
            title="Delete Episode"
            aria-label="Delete Episode"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
