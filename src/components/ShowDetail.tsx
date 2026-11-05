import { useState, useMemo } from 'react';
import type { Series, Episode } from '../types';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Trash2, Plus, Play } from "lucide-react";
import { isValidHttpUrl, detectPlatform } from "@/lib/utils";

import EpisodeItem from './EpisodeItem';
import EpisodeForm from './EpisodeForm';

interface ShowDetailProps {
  seriesId: number;
  seriesList: Series[];
  setSeriesList: (list: Series[]) => void;
  episodeList: Episode[];
  setEpisodeList: (list: Episode[]) => void;
  onBack: () => void;
  onEdit: () => void;
}

export default function ShowDetail({
  seriesId,
  seriesList,
  setSeriesList,
  episodeList,
  setEpisodeList,
  onBack,
  onEdit,
}: ShowDetailProps) {
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [editingEp, setEditingEp] = useState<Episode | null>(null);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');

  const show = seriesList.find((s) => s.id === seriesId);
  const myEpisodes = useMemo(
    () => episodeList.filter((ep) => ep.seriesId === seriesId),
    [episodeList, seriesId]
  );

  // --- EPISODE ORDERING ---
  // 1. season (if available) -> 2. episodeNumber (if available) -> 3. stable array order
  const sortedEpisodes = useMemo(() => {
    return [...myEpisodes].sort((a, b) => {
      const seasonA = typeof a.season === 'number' ? a.season : 1;
      const seasonB = typeof b.season === 'number' ? b.season : 1;
      if (seasonA !== seasonB) {
        return seasonA - seasonB;
      }
      const numA = typeof a.episodeNumber === 'number' ? a.episodeNumber : 0;
      const numB = typeof b.episodeNumber === 'number' ? b.episodeNumber : 0;
      if (numA !== numB) {
        return numA - numB;
      }
      return 0;
    });
  }, [myEpisodes]);

  // Unique seasons present in current data
  const seasons = useMemo(() => {
    const set = new Set<number>();
    myEpisodes.forEach((ep) => {
      if (typeof ep.season === 'number' && ep.season > 0) {
        set.add(ep.season);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [myEpisodes]);

  // Filtered by selected season
  const displayedEpisodes = useMemo(() => {
    if (selectedSeason === 'all') return sortedEpisodes;
    return sortedEpisodes.filter((ep) => (ep.season || 1) === selectedSeason);
  }, [sortedEpisodes, selectedSeason]);

  if (!show) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-400 text-lg">Title not found.</p>
        <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Button>
      </div>
    );
  }

  // --- IMAGE FALLBACK HIERARCHY ---
  // 1. show.backdrop -> 2. show.poster -> 3. dark gradient
  const activeBackdrop =
    !backdropFailed && show.backdrop
      ? show.backdrop
      : !posterFailed && show.poster
      ? show.poster
      : null;

  const handleImageError = () => {
    if (!backdropFailed && show.backdrop) {
      setBackdropFailed(true);
    } else {
      setPosterFailed(true);
    }
  };

  // --- PROGRESS CALCULATION ---
  const watchedEpisodes = myEpisodes.filter((ep) => ep.watched);
  const progress =
    myEpisodes.length > 0
      ? Math.min(100, Math.max(0, Math.round((watchedEpisodes.length / myEpisodes.length) * 100)))
      : 0;

  // --- WATCH NEXT / RESUME TARGET SELECTION ---
  const nextUnwatchedEpisode = sortedEpisodes.find(
    (ep) => !ep.watched && isValidHttpUrl(ep.link)
  );
  const firstEpisodeWithLink = sortedEpisodes.find((ep) => isValidHttpUrl(ep.link));
  const watchTargetEpisode = nextUnwatchedEpisode || firstEpisodeWithLink;
  const watchLink = watchTargetEpisode?.link?.trim();
  const watchPlatform = watchTargetEpisode?.platform || (watchLink ? detectPlatform(watchLink) : undefined);
  const isResume = Boolean(nextUnwatchedEpisode && watchedEpisodes.length > 0);

  // --- STATUS BADGE ---
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Watching':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-700/60 shadow-xs backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Watching
          </span>
        );
      case 'Plan to Watch':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-700/60 shadow-xs backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Plan to Watch
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-700/60 shadow-xs backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  // --- EPISODE & SERIES HANDLERS ---
  const toggleWatched = (episodeId: number) => {
    setEpisodeList(
      episodeList.map((ep) =>
        ep.id === episodeId ? { ...ep, watched: !ep.watched } : ep
      )
    );
  };

  const handleDeleteSeries = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${show.title}" and all its episodes?`
      )
    ) {
      if (setSeriesList) setSeriesList(seriesList.filter((s) => s.id !== seriesId));
      setEpisodeList(episodeList.filter((ep) => ep.seriesId !== seriesId));
      onBack();
    }
  };

  const handleDeleteEpisode = (id: number) => {
    if (window.confirm('Delete this episode?')) {
      setEpisodeList(episodeList.filter((ep) => ep.id !== id));
    }
  };

  const openAddEpisode = () => {
    setEditingEp(null);
    setShowEpisodeForm(true);
  };

  const openEditEpisode = (ep: Episode) => {
    setEditingEp(ep);
    setShowEpisodeForm(true);
  };

  const closeEpisodeForm = () => {
    setEditingEp(null);
    setShowEpisodeForm(false);
  };

  const handleSaveEpisode = (formData: Partial<Episode>) => {
    if (editingEp) {
      setEpisodeList(
        episodeList.map((ep) =>
          ep.id === editingEp.id
            ? {
                ...ep,
                title: formData.title!,
                season: formData.season !== undefined ? formData.season : ep.season,
                episodeNumber: formData.episodeNumber,
                link: formData.link,
                platform: detectPlatform(formData.link),
                notes: formData.notes,
                watched: formData.watched!,
              }
            : ep
        )
      );
    } else {
      const newEp: Episode = {
        id: new Date().getTime(),
        seriesId: show.id,
        season: formData.season || (typeof selectedSeason === 'number' ? selectedSeason : 1),
        episodeNumber: formData.episodeNumber || myEpisodes.length + 1,
        title: formData.title!,
        link: formData.link,
        platform: detectPlatform(formData.link),
        notes: formData.notes,
        watched: formData.watched!,
      };
      setEpisodeList([...episodeList, newEp]);
    }
    closeEpisodeForm();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-300 hover:text-white hover:bg-slate-800/80 -ml-2 gap-1.5 text-xs sm:text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white text-xs h-8 gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSeries}
            className="bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-800/50 text-xs h-8 px-2.5"
            title="Delete Title"
            aria-label="Delete Title"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Cinematic Detail Hero */}
      <section
        aria-label={`Details for ${show.title}`}
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-950 shadow-2xl min-h-[380px] sm:min-h-[440px] md:min-h-[480px] flex items-end"
      >
        {/* Backdrop Image & Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {activeBackdrop ? (
            <img
              src={activeBackdrop}
              alt={show.title}
              onError={handleImageError}
              className="h-full w-full object-cover object-center scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950" />
          )}

          {/* Directional Vignettes / Scrims for Contrast & Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30 w-full md:w-4/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 max-w-3xl flex flex-col items-start gap-3.5 sm:gap-4">
          
          {/* Metadata & Status Indicator */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {getStatusBadge(show.status)}

            <div className="flex items-center gap-1.5 text-slate-300 font-medium drop-shadow-xs">
              <span>{show.type}</span>
              {(show.year || show.duration) && (
                <>
                  <span className="text-slate-500">·</span>
                  <span>{show.year || show.duration}</span>
                </>
              )}
              {show.year && show.duration && (
                <>
                  <span className="text-slate-500">·</span>
                  <span>{show.duration}</span>
                </>
              )}
              {show.genre && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 line-clamp-1">{show.genre}</span>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg line-clamp-2">
            {show.title}
          </h1>

          {/* Synopsis / Description */}
          {show.description ? (
            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-2xl drop-shadow-xs">
              {show.description}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 italic">No description provided.</p>
          )}

          {/* Watch Next / Resume Action */}
          {watchLink && (
            <div className="pt-1">
              <a
                href={watchLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 sm:px-6 py-2.5 rounded-lg shadow-lg shadow-indigo-600/25 transition-all active:scale-95 text-xs sm:text-sm gap-2 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white text-white" />
                  <span>
                    {isResume
                      ? `Resume${watchTargetEpisode?.episodeNumber ? ` Ep. ${watchTargetEpisode.episodeNumber}` : ''}${watchPlatform ? ` on ${watchPlatform}` : ''}`
                      : `Watch Now${watchTargetEpisode?.episodeNumber ? ` Ep. ${watchTargetEpisode.episodeNumber}` : ''}${watchPlatform ? ` on ${watchPlatform}` : ''}`}
                  </span>
                </Button>
              </a>
            </div>
          )}

          {/* Episode Progress Presentation (Only when episodes exist) */}
          {myEpisodes.length > 0 && (
            <div className="w-full max-w-md pt-2 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-300">
                <span>{watchedEpisodes.length} of {myEpisodes.length} episodes watched</span>
                <span className="text-indigo-400 font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-800/80" />
            </div>
          )}
        </div>
      </section>

      {/* Episodes Section */}
      <section aria-label="Episodes List" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Episodes</h3>
            <span className="text-sm font-medium text-slate-400">
              ({myEpisodes.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Season Selector Tabs (Only rendered when multiple seasons exist) */}
            {seasons.length > 1 && (
              <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSeason('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    selectedSeason === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  All
                </button>
                {seasons.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSeason(s)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      selectedSeason === s
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    S{s}
                  </button>
                ))}
              </div>
            )}

            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs gap-1.5 shadow-xs cursor-pointer"
              onClick={openAddEpisode}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Episode</span>
            </Button>
          </div>
        </div>

        {/* Episode Dialog Modal */}
        <EpisodeForm 
          key={editingEp ? `edit-${editingEp.id}` : `add-${showEpisodeForm}`}
          open={showEpisodeForm} 
          onOpenChange={(isOpen) => {
            if (!isOpen) closeEpisodeForm();
            else setShowEpisodeForm(true);
          }}
          initialData={editingEp} 
          onSave={handleSaveEpisode} 
          onCancel={closeEpisodeForm}
          defaultEpisodeNumber={myEpisodes.length + 1}
        />

        {/* Episode List */}
        <div className="space-y-2.5">
          {displayedEpisodes.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-800/80 px-4">
              <p className="text-slate-400 text-sm font-medium">
                {myEpisodes.length === 0
                  ? 'No episodes added yet. Add your first episode to begin tracking!'
                  : 'No episodes in this season.'}
              </p>
              {myEpisodes.length === 0 && (
                <Button
                  onClick={openAddEpisode}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Episode 1
                </Button>
              )}
            </div>
          ) : (
            displayedEpisodes.map((ep) => (
              <EpisodeItem 
                key={ep.id} 
                ep={ep} 
                seriesPoster={show.poster} 
                onToggleWatched={toggleWatched} 
                onEdit={openEditEpisode} 
                onDelete={handleDeleteEpisode} 
              />
            ))
          )}
        </div>
      </section>

    </div>
  );
}
