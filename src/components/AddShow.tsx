import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Series } from '../types';
import { createShow, uploadImageToImageKit, deleteImageFromImageKit } from '../services';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";

interface AddShowProps {
  userId: string;
  seriesList: Series[];
  setSeriesList: (list: Series[]) => void;
  onCancel: () => void;
}

export default function AddShow({ userId, seriesList, setSeriesList, onCancel }: AddShowProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('TV Series');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [posterFileId, setPosterFileId] = useState<string | undefined>(undefined);
  const [backdrop, setBackdrop] = useState('');
  const [backdropFileId, setBackdropFileId] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingBackdrop, setIsUploadingBackdrop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show temporary local object preview
    const objectUrl = URL.createObjectURL(file);
    setPoster(objectUrl);
    setIsUploadingPoster(true);
    setError(null);

    try {
      const result = await uploadImageToImageKit(file, '/watchlist-app/posters');
      // If there was an unpersisted previously uploaded poster in this form session, clean it up
      if (posterFileId && posterFileId !== result.fileId) {
        deleteImageFromImageKit(posterFileId).catch((err) =>
          console.warn("Could not delete superseded poster upload:", err)
        );
      }
      setPoster(result.url);
      setPosterFileId(result.fileId);
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error
          ? uploadErr.message
          : 'Failed to upload poster to ImageKit',
      );
      setPoster('');
      setPosterFileId(undefined);
    } finally {
      setIsUploadingPoster(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemovePoster = () => {
    if (posterFileId) {
      deleteImageFromImageKit(posterFileId).catch((err) =>
        console.warn("Could not delete removed poster:", err)
      );
    }
    setPoster('');
    setPosterFileId(undefined);
  };

  const handleBackdropUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show temporary local object preview
    const objectUrl = URL.createObjectURL(file);
    setBackdrop(objectUrl);
    setIsUploadingBackdrop(true);
    setError(null);

    try {
      const result = await uploadImageToImageKit(file, '/watchlist-app/backdrops');
      // If there was an unpersisted previously uploaded backdrop in this form session, clean it up
      if (backdropFileId && backdropFileId !== result.fileId) {
        deleteImageFromImageKit(backdropFileId).catch((err) =>
          console.warn("Could not delete superseded backdrop upload:", err)
        );
      }
      setBackdrop(result.url);
      setBackdropFileId(result.fileId);
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error
          ? uploadErr.message
          : 'Failed to upload backdrop to ImageKit',
      );
      setBackdrop('');
      setBackdropFileId(undefined);
    } finally {
      setIsUploadingBackdrop(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemoveBackdrop = () => {
    if (backdropFileId) {
      deleteImageFromImageKit(backdropFileId).catch((err) =>
        console.warn("Could not delete removed backdrop:", err)
      );
    }
    setBackdrop('');
    setBackdropFileId(undefined);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting || isUploadingPoster || isUploadingBackdrop) return;

    setIsSubmitting(true);
    setError(null);

    // Sanitization: Base64 or blob data URLs must NEVER be sent to PostgreSQL
    const sanitizedPoster =
      poster && !poster.startsWith('data:') && !poster.startsWith('blob:')
        ? poster.trim()
        : undefined;

    const sanitizedBackdrop =
      backdrop && !backdrop.startsWith('data:') && !backdrop.startsWith('blob:')
        ? backdrop.trim()
        : undefined;

    const newShowPayload: Omit<Series, "id"> = {
      title: title.trim(),
      type,
      genre: genre.trim() || undefined,
      year:
        type === 'Movie' && year
          ? parseInt(year, 10)
          : year
          ? parseInt(year, 10)
          : undefined,
      duration: type === 'Movie' ? duration.trim() || undefined : undefined,
      description: description.trim() || undefined,
      poster: sanitizedPoster,
      poster_url: sanitizedPoster,
      poster_file_id: sanitizedPoster ? posterFileId : undefined,
      posterFileId: sanitizedPoster ? posterFileId : undefined,
      backdrop: sanitizedBackdrop,
      backdrop_url: sanitizedBackdrop,
      backdrop_file_id: sanitizedBackdrop ? backdropFileId : undefined,
      backdropFileId: sanitizedBackdrop ? backdropFileId : undefined,
      status: 'Watching',
    };

    try {
      const createdShow = await createShow(newShowPayload, userId);
      setSeriesList([createdShow, ...seriesList]);
      onCancel();
    } catch (err) {
      console.error('Failed to create show:', err);
      // Rollback newly uploaded files to avoid orphan files in ImageKit
      if (posterFileId) {
        deleteImageFromImageKit(posterFileId).catch((delErr) =>
          console.warn("Failed to rollback uploaded poster:", delErr)
        );
      }
      if (backdropFileId) {
        deleteImageFromImageKit(backdropFileId).catch((delErr) =>
          console.warn("Failed to rollback uploaded backdrop:", delErr)
        );
      }
      setError(
        err instanceof Error ? err.message : 'Failed to create show. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen && !isSubmitting) onCancel(); }}>
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101116] p-0 text-zinc-100 shadow-2xl sm:w-full sm:max-w-[740px]"
        showCloseButton={!isSubmitting}
      >
        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Dialog Header */}
          <DialogHeader className="shrink-0 border-b border-white/[0.07] bg-[#101116] px-5 pt-5 pb-4 pr-12 sm:px-7 sm:pt-6">
            <DialogTitle className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              Add New Show / Movie
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-zinc-400 sm:text-sm">
              Upload artwork and add metadata to save this title to your watchlist.
            </DialogDescription>
          </DialogHeader>

          {/* Dialog Body — 2 Columns on Desktop */}
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-5 sm:p-6 md:flex-row md:gap-7 md:p-7">
            {/* Artwork Dropzone Column */}
            <div className="flex w-full shrink-0 flex-col items-center gap-4 md:w-52 md:items-start">
              {/* Poster Section (2:3) */}
              <div className="flex w-full flex-col items-center space-y-1.5 md:items-start">
                <div className="flex w-40 items-center justify-between sm:w-44 md:w-full">
                  <label className="text-xs font-medium text-zinc-300">
                    Poster (2:3)
                  </label>
                  {poster && (
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 transition-colors hover:text-red-300 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <div className="group relative flex aspect-2/3 w-40 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/[0.14] bg-[#09090b] transition-colors hover:border-indigo-500/50 sm:w-44 md:w-full">
                  {poster ? (
                    <>
                      <img
                        src={poster}
                        alt="Poster preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/65 opacity-0 transition-opacity group-hover:opacity-100">
                        <Upload className="h-4 w-4 text-white" />
                        <span className="text-xs font-medium text-white">
                          Replace Poster
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center text-zinc-400">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#14161d] text-zinc-300">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] leading-snug text-zinc-400">
                        Upload Poster
                        <br />
                        <span className="text-zinc-500">JPG, PNG, WebP</span>
                      </span>
                    </div>
                  )}
                  {isUploadingPoster && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-[#09090b]/85 text-xs text-indigo-300 backdrop-blur-xs">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                      <span>Uploading...</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingPoster}
                    onChange={handlePosterUpload}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    aria-label="Upload poster image"
                  />
                </div>
              </div>

              {/* Backdrop Section (16:9) */}
              <div className="flex w-full flex-col items-center space-y-1.5 md:items-start">
                <div className="flex w-40 items-center justify-between sm:w-44 md:w-full">
                  <label className="text-xs font-medium text-zinc-300">
                    Backdrop (16:9)
                  </label>
                  {backdrop && (
                    <button
                      type="button"
                      onClick={handleRemoveBackdrop}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 transition-colors hover:text-red-300 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <div className="group relative flex aspect-16/9 w-40 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/[0.14] bg-[#09090b] transition-colors hover:border-indigo-500/50 sm:w-44 md:w-full">
                  {backdrop ? (
                    <>
                      <img
                        src={backdrop}
                        alt="Backdrop preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/65 opacity-0 transition-opacity group-hover:opacity-100">
                        <Upload className="h-3.5 w-3.5 text-white" />
                        <span className="text-[11px] font-medium text-white">
                          Replace Backdrop
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 p-2.5 text-center text-zinc-400">
                      <ImageIcon className="h-4 w-4 text-zinc-400" />
                      <span className="text-[10px] leading-tight text-zinc-400">
                        Upload Backdrop
                      </span>
                    </div>
                  )}
                  {isUploadingBackdrop && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-[#09090b]/85 text-xs text-indigo-300 backdrop-blur-xs">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                      <span>Uploading...</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingBackdrop}
                    onChange={handleBackdropUpload}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    aria-label="Upload backdrop image"
                  />
                </div>
              </div>
            </div>

            {/* Metadata Form Fields */}
            <div className="w-full min-w-0 flex-1 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-950/35 px-3.5 py-3 text-xs text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <p className="font-medium">Failed to save show</p>
                    <p className="mt-0.5 text-red-200/80">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Title <span className="text-red-400">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Breaking Bad"
                  className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Type <span className="text-red-400">*</span>
                  </label>
                  <Select value={type} onValueChange={(val) => setType(val || 'TV Series')}>
                    <SelectTrigger className="h-10 w-full rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#14151b] text-zinc-100">
                      <SelectItem value="TV Series">TV Series</SelectItem>
                      <SelectItem value="Movie">Movie</SelectItem>
                      <SelectItem value="Anime">Anime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === 'Movie' ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Duration
                    </label>
                    <Input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 2h 28m"
                      className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Release Year
                    </label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Genre
                </label>
                <Input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Action, Drama, Sci-Fi..."
                  className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short synopsis or notes..."
                  className="resize-none rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="m-0 flex shrink-0 flex-row items-center justify-end gap-2.5 rounded-b-2xl border-t border-white/[0.07] bg-[#101116] px-5 py-3.5 sm:px-7">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-9 rounded-lg px-4 text-xs font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploadingPoster || isUploadingBackdrop}
              className="h-9 rounded-lg bg-indigo-500 px-6 text-xs font-semibold text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.5)] transition-all hover:bg-indigo-400 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : isUploadingPoster || isUploadingBackdrop ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading Image...</span>
                </span>
              ) : (
                "Save Title"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
