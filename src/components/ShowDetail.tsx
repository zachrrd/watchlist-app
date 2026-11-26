import { useState, useMemo } from 'react';
import type { Series, Episode } from '../types';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Plus, Play, Film } from "lucide-react";
import { isValidHttpUrl, detectPlatform } from "@/lib/utils";

import EpisodeItem from './EpisodeItem';
import EpisodeForm from './EpisodeForm';
import ConfirmDialog from './ConfirmDialog';
import {
  createEpisode,
  updateEpisode,
  deleteEpisode,
  deleteShow,
  deleteImageFromImageKit,
} from '../services';

interface ShowDetailProps {
  seriesId: string;
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
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');
  const [isSavingEpisode, setIsSavingEpisode] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [confirmDeleteSeriesOpen, setConfirmDeleteSeriesOpen] = useState(false);
  const [isDeletingSeries, setIsDeletingSeries] = useState(false);
  const [deleteSeriesError, setDeleteSeriesError] = useState<string | null>(null);
  const [episodeToDelete, setEpisodeToDelete] = useState<Episode | null>(null);
  const [isDeletingEpisode, setIsDeletingEpisode] = useState(false);
  const [deleteEpisodeError, setDeleteEpisodeError] = useState<string | null>(null);

  const show = seriesList.find((s) => s.id === seriesId);
  const myEpisodes = useMemo(
    () => episodeList.filter((ep) => ep.seriesId === seriesId),
    [episodeList, seriesId]
  );

  // --- EPISODE ORDERING ---
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
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e0f13] px-6 py-16 text-center space-y-4">
        <p className="text-zinc-300 text-base font-medium">Title not found.</p>
        <Button
          variant="outline"
          onClick={onBack}
          className="border-white/[0.1] bg-[#14161d] text-zinc-200 hover:bg-white/[0.08] hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Button>
      </div>
    );
  }

  const backdropCandidate = (show.backdrop?.trim() || show.backdrop_url?.trim()) || null;
  const posterCandidate = (show.poster?.trim() || show.poster_url?.trim()) || null;

  // --- IMAGE FALLBACK HIERARCHY ---
  const activeBackdrop =
    backdropCandidate && !failedUrls[backdropCandidate]
      ? backdropCandidate
      : posterCandidate && !failedUrls[posterCandidate]
      ? posterCandidate
      : null;

  const isPosterValid = Boolean(posterCandidate && !failedUrls[posterCandidate]);

  const handleImageError = (url?: string | null) => {
    if (url) {
      setFailedUrls((prev) => ({ ...prev, [url]: true }));
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

  // --- EPISODE & SERIES HANDLERS ---
  const toggleWatched = async (episodeId: string) => {
    const target = episodeList.find((ep) => ep.id === episodeId);
    if (!target) return;
    const nextWatched = !target.watched;

    setEpisodeList(
      episodeList.map((ep) =>
        ep.id === episodeId ? { ...ep, watched: nextWatched } : ep
      )
    );

    try {
      await updateEpisode(episodeId, { watched: nextWatched });
    } catch (err) {
      console.error('Failed to update episode watch status:', err);
      setEpisodeList(
        episodeList.map((ep) =>
          ep.id === episodeId ? { ...ep, watched: target.watched } : ep
        )
      );
    }
  };

  const handleDeleteSeries = () => {
    setDeleteSeriesError(null);
    setConfirmDeleteSeriesOpen(true);
  };

  const confirmDeleteSeries = async () => {
    setIsDeletingSeries(true);
    setDeleteSeriesError(null);
    try {
      const posterFileId = show.poster_file_id || show.posterFileId;
      const backdropFileId = show.backdrop_file_id || show.backdropFileId;

      // Clean up ImageKit files while show ownership can be verified in database
      if (posterFileId) {
        try {
          await deleteImageFromImageKit(posterFileId, seriesId);
        } catch (err) {
          console.error("Failed to delete show poster from ImageKit:", err);
        }
      }

      if (backdropFileId) {
        try {
          await deleteImageFromImageKit(backdropFileId, seriesId);
        } catch (err) {
          console.error("Failed to delete show backdrop from ImageKit:", err);
        }
      }

      await deleteShow(seriesId);

      if (setSeriesList) setSeriesList(seriesList.filter((s) => s.id !== seriesId));
      setEpisodeList(episodeList.filter((ep) => ep.seriesId !== seriesId));
      setConfirmDeleteSeriesOpen(false);
      onBack();
    } catch (err) {
      console.error("Failed to delete show from Neon:", err);
      setDeleteSeriesError(
        err instanceof Error ? err.message : 'Failed to delete this title. Please try again.'
      );
    } finally {
      setIsDeletingSeries(false);
    }
  };

  const handleDeleteEpisode = (id: string) => {
    const target = episodeList.find((ep) => ep.id === id) || null;
    if (!target) return;
    setDeleteEpisodeError(null);
    setEpisodeToDelete(target);
  };

  const confirmDeleteEpisode = async () => {
    if (!episodeToDelete) return;
    setIsDeletingEpisode(true);
    setDeleteEpisodeError(null);
    const previousList = episodeList;
    setEpisodeList(episodeList.filter((ep) => ep.id !== episodeToDelete.id));
    try {
      await deleteEpisode(episodeToDelete.id);
      setEpisodeToDelete(null);
    } catch (err) {
      console.error('Failed to delete episode:', err);
      setEpisodeList(previousList);
      setDeleteEpisodeError(
        err instanceof Error ? err.message : 'Failed to delete episode. Please try again.'
      );
    } finally {
      setIsDeletingEpisode(false);
    }
  };

  const openAddEpisode = () => {
    setEditingEp(null);
    setEpisodeError(null);
    setShowEpisodeForm(true);
  };

  const openEditEpisode = (ep: Episode) => {
    setEditingEp(ep);
    setEpisodeError(null);
    setShowEpisodeForm(true);
  };

  const closeEpisodeForm = () => {
    if (isSavingEpisode) return;
    setEditingEp(null);
    setEpisodeError(null);
    setShowEpisodeForm(false);
  };

  const handleSaveEpisode = async (formData: Partial<Episode>) => {
    if (editingEp) {
      setIsSavingEpisode(true);
      setEpisodeError(null);
      try {
        const updatePayload: Partial<Omit<Episode, 'id' | 'seriesId'>> = {
          title: formData.title!.trim(),
          season: formData.season !== undefined ? formData.season : editingEp.season,
          episodeNumber: formData.episodeNumber,
          link: formData.link?.trim() || undefined,
          platform: detectPlatform(formData.link),
          notes: formData.notes?.trim() || undefined,
          watched: formData.watched !== undefined ? formData.watched : editingEp.watched,
        };

        const updated = await updateEpisode(editingEp.id, updatePayload);
        setEpisodeList(
          episodeList.map((ep) => (ep.id === editingEp.id ? updated : ep))
        );
        closeEpisodeForm();
      } catch (err) {
        console.error('Failed to update episode:', err);
        setEpisodeError(
          err instanceof Error ? err.message : 'Failed to update episode.'
        );
      } finally {
        setIsSavingEpisode(false);
      }
    } else {
      // Phase 3B: CREATE Episode in Neon PostgreSQL
      setIsSavingEpisode(true);
      setEpisodeError(null);
      try {
        const episodePayload: Omit<Episode, "id"> = {
          seriesId: show.id,
          season:
            formData.season ||
            (typeof selectedSeason === 'number' ? selectedSeason : 1),
          episodeNumber: formData.episodeNumber || myEpisodes.length + 1,
          title: formData.title!.trim(),
          link: formData.link?.trim() || undefined,
          platform: detectPlatform(formData.link),
          notes: formData.notes?.trim() || undefined,
          watched: formData.watched ?? false,
        };

        const created = await createEpisode(episodePayload);
        setEpisodeList([...episodeList, created]);
        closeEpisodeForm();
      } catch (err) {
        console.error('Failed to create episode:', err);
        setEpisodeError(
          err instanceof Error ? err.message : 'Failed to create episode.'
        );
      } finally {
        setIsSavingEpisode(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 gap-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 gap-1.5 rounded-lg border-white/[0.1] bg-[#111216] text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSeries}
            className="h-8 rounded-lg border border-red-500/25 bg-red-950/40 px-2.5 text-xs text-red-300 hover:bg-red-900/60 hover:text-white cursor-pointer"
            title="Delete Title"
            aria-label="Delete Title"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Cinematic Detail Hero */}
      <section
        aria-label={`Details for ${show.title}`}
        className="relative flex min-h-[380px] w-full items-end overflow-hidden rounded-2xl bg-[#09090b] sm:min-h-[440px] md:min-h-[480px]"
      >
        {/* Backdrop Image & Seamless Gradient Masks */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {activeBackdrop ? (
            <img
              key={activeBackdrop}
              src={activeBackdrop}
              alt={show.title}
              onError={() => handleImageError(activeBackdrop)}
              className="h-full w-full object-cover object-center scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.18),transparent_60%),linear-gradient(135deg,#12131a_0%,#09090b_100%)]" />
          )}

          {/* Multi-directional Gradient Masks melting into #09090b */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-transparent md:w-4/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#09090b]/75 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#09090b]/70 to-transparent" />
        </div>

        {/* Hero Foreground: Poster + Metadata */}
        <div className="relative z-10 flex w-full flex-col gap-6 p-5 sm:p-8 md:flex-row md:items-end md:gap-8 md:p-10">
          {/* Desktop / Tablet Poster Thumbnail */}
          <div className="hidden md:block w-36 lg:w-44 aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-[#111216] ring-1 ring-white/15 shadow-[0_20px_44px_-12px_rgba(0,0,0,0.85)]">
            {posterCandidate && isPosterValid ? (
              <img
                src={posterCandidate}
                alt={`${show.title} poster`}
                onError={() => handleImageError(posterCandidate)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[#14161d] p-4 text-center">
                <Film className="mb-2 h-8 w-8 text-zinc-600" />
                <span className="text-xs font-medium text-zinc-400 line-clamp-2">
                  {show.title}
                </span>
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex max-w-3xl flex-1 flex-col items-start gap-3.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {getStatusBadge(show.status)}

              <div className="flex flex-wrap items-center gap-1.5 font-medium text-zinc-300 tabular-nums">
                <span>{show.type}</span>
                {(show.year || show.duration) && (
                  <>
                    <span className="text-zinc-500">·</span>
                    <span>{show.year || show.duration}</span>
                  </>
                )}
                {show.year && show.duration && (
                  <>
                    <span className="text-zinc-500">·</span>
                    <span>{show.duration}</span>
                  </>
                )}
                {show.genre && (
                  <>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-300 line-clamp-1">{show.genre}</span>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-[-0.03em] text-white leading-[1.08] sm:text-4xl md:text-5xl line-clamp-2">
              {show.title}
            </h1>

            {show.description ? (
              <p className="max-w-2xl text-xs leading-relaxed text-zinc-300/90 sm:text-sm md:text-base line-clamp-3 sm:line-clamp-4">
                {show.description}
              </p>
            ) : (
              <p className="text-xs italic text-zinc-500 sm:text-sm">
                No description provided.
              </p>
            )}

            {/* Episode Progress Presentation */}
            {myEpisodes.length > 0 && (
              <div className="w-full max-w-md space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300 tabular-nums">
                  <span>
                    {watchedEpisodes.length} of {myEpisodes.length} episodes watched
                  </span>
                  <span className="font-semibold text-indigo-400">{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Watch Next / Resume Action */}
            {watchLink && (
              <div className="pt-1.5">
                <a href={watchLink} target="_blank" rel="noopener noreferrer">
                  <Button
                    type="button"
                    className="h-10 gap-2 rounded-lg bg-white px-5 text-xs font-semibold text-zinc-950 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.65)] transition-all hover:bg-zinc-200 active:scale-[0.98] sm:text-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-zinc-950 text-zinc-950" />
                    <span>
                      {isResume
                        ? `Resume${
                            watchTargetEpisode?.episodeNumber
                              ? ` Ep. ${watchTargetEpisode.episodeNumber}`
                              : ''
                          }${watchPlatform ? ` on ${watchPlatform}` : ''}`
                        : `Watch Now${
                            watchTargetEpisode?.episodeNumber
                              ? ` Ep. ${watchTargetEpisode.episodeNumber}`
                              : ''
                          }${watchPlatform ? ` on ${watchPlatform}` : ''}`}
                    </span>
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Episodes Section */}
      <section aria-label="Episodes List" className="space-y-4 pt-2">
        <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
              Episodes
            </h2>
            <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-400">
              {myEpisodes.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Compact Season Filter */}
            {seasons.length > 1 && (
              <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-[#101116] p-1">
                <button
                  type="button"
                  onClick={() => setSelectedSeason('all')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedSeason === 'all'
                      ? 'bg-white/[0.1] text-white'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                {seasons.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSeason(s)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                      selectedSeason === s
                        ? 'bg-white/[0.1] text-white'
                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}
                  >
                    S{s}
                  </button>
                ))}
              </div>
            )}

            <Button
              className="h-8 gap-1.5 rounded-lg bg-indigo-500 px-3.5 text-xs font-medium text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.5)] hover:bg-indigo-400 cursor-pointer"
              onClick={openAddEpisode}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Episode</span>
            </Button>
          </div>
        </div>

        {/* Episode Dialog Modal */}
        <EpisodeForm
          key={editingEp ? `edit-${editingEp.id}` : `add-${showEpisodeForm}`}
          open={showEpisodeForm}
          onOpenChange={(isOpen) => {
            if (isSavingEpisode) return;
            if (!isOpen) closeEpisodeForm();
            else setShowEpisodeForm(true);
          }}
          initialData={editingEp}
          onSave={handleSaveEpisode}
          onCancel={closeEpisodeForm}
          defaultEpisodeNumber={myEpisodes.length + 1}
          isLoading={isSavingEpisode}
          error={episodeError}
        />

        {/* Scannable Episode List (No nested cards) */}
        {displayedEpisodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0d0e12] px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-300">
              {myEpisodes.length === 0
                ? 'No episodes added yet.'
                : 'No episodes in this season.'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {myEpisodes.length === 0
                ? 'Add your first episode to start tracking progress and watch links.'
                : 'Select another season or add a new episode.'}
            </p>
            {myEpisodes.length === 0 && (
              <Button
                onClick={openAddEpisode}
                variant="outline"
                size="sm"
                className="mt-4 h-8 gap-1.5 rounded-lg border-white/[0.1] bg-[#14161d] text-xs text-zinc-200 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Episode 1
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0e12]">
            {displayedEpisodes.map((ep) => (
              <EpisodeItem
                key={ep.id}
                ep={ep}
                seriesPoster={show.poster || show.poster_url}
                onToggleWatched={toggleWatched}
                onEdit={openEditEpisode}
                onDelete={handleDeleteEpisode}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmDeleteSeriesOpen}
        onOpenChange={(open) => {
          setConfirmDeleteSeriesOpen(open);
          if (!open) setDeleteSeriesError(null);
        }}
        title={`Delete "${show.title}"?`}
        description="This will permanently remove this title, its uploaded artwork, and all tracked episodes. This action cannot be undone."
        confirmLabel="Delete Title"
        isLoading={isDeletingSeries}
        error={deleteSeriesError}
        onConfirm={confirmDeleteSeries}
      />

      <ConfirmDialog
        open={Boolean(episodeToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setEpisodeToDelete(null);
            setDeleteEpisodeError(null);
          }
        }}
        title={`Delete ${
          episodeToDelete?.episodeNumber
            ? `Episode ${episodeToDelete.episodeNumber}`
            : "this episode"
        }?`}
        description={
          episodeToDelete?.title
            ? `"${episodeToDelete.title}" will be permanently removed from this show.`
            : "This episode will be permanently removed from this show."
        }
        confirmLabel="Delete Episode"
        isLoading={isDeletingEpisode}
        error={deleteEpisodeError}
        onConfirm={confirmDeleteEpisode}
      />
    </div>
  );
}
