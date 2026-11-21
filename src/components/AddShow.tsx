import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Series } from '../types';
import { createShow, uploadImageToImageKit, deleteImageFromImageKit } from '../services';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Image as ImageIcon, Loader2 } from "lucide-react";

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
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-180 md:max-w-[720px] max-h-[90dvh] flex flex-col bg-slate-900 border-slate-800 text-slate-50 p-0 overflow-hidden shadow-2xl rounded-2xl">
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* Dialog Header — Fixed at Top */}
          <DialogHeader className="shrink-0 px-5 pt-6 pb-4 sm:px-8 sm:pt-7 sm:pb-4 border-b border-slate-800/60 bg-slate-900/90 pr-12">
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Add New Show / Movie
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-400 mt-1">
              Fill in the details below to add a new item to your collection.
            </DialogDescription>
          </DialogHeader>
          
          {/* Dialog Body — Vertically Scrollable with Touch Inertia */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Images Column: Poster & Backdrop */}
            <div className="space-y-4 w-full md:w-52 shrink-0 flex flex-col items-center md:items-start">
              {/* Poster Section (2:3) */}
              <div className="space-y-1.5 w-full flex flex-col items-center md:items-start">
                <div className="flex items-center justify-between w-36 sm:w-44 md:w-full">
                  <label className="text-xs font-medium text-slate-300">Poster (2:3)</label>
                  {poster && (
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="w-36 sm:w-44 md:w-full aspect-2/3 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden flex flex-col items-center justify-center relative group shadow-inner">
                  {poster ? (
                    <img src={poster} alt="Poster preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-1.5 p-3 text-center">
                      <ImageIcon className="w-6 h-6 opacity-60" />
                      <span className="text-[11px] leading-tight">Upload Poster<br />JPG, PNG</span>
                    </div>
                  )}
                  {isUploadingPoster && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-1.5 text-xs text-sky-400 z-20">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingPoster}
                    onChange={handlePosterUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    aria-label="Upload poster image"
                  />
                </div>
              </div>

              {/* Backdrop Section (16:9) */}
              <div className="space-y-1.5 w-full flex flex-col items-center md:items-start">
                <div className="flex items-center justify-between w-36 sm:w-44 md:w-full">
                  <label className="text-xs font-medium text-slate-300">Backdrop (16:9)</label>
                  {backdrop && (
                    <button
                      type="button"
                      onClick={handleRemoveBackdrop}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="w-36 sm:w-44 md:w-full aspect-16/9 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden flex flex-col items-center justify-center relative group shadow-inner">
                  {backdrop ? (
                    <img src={backdrop} alt="Backdrop preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-1 p-2 text-center">
                      <ImageIcon className="w-5 h-5 opacity-60" />
                      <span className="text-[10px] leading-tight">Upload Backdrop<br />JPG, PNG</span>
                    </div>
                  )}
                  {isUploadingBackdrop && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-1.5 text-xs text-sky-400 z-20">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingBackdrop}
                    onChange={handleBackdropUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    aria-label="Upload backdrop image"
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 flex-1 w-full min-w-0">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-950/30 p-3 text-xs text-red-400">
                  <p className="font-medium">Failed to save show</p>
                  <p className="mt-0.5 text-red-300/80">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Breaking Bad"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={type} onValueChange={(val) => setType(val || 'TV Series')}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="TV Series">TV Series</SelectItem>
                      <SelectItem value="Movie">Movie</SelectItem>
                      <SelectItem value="Anime">Anime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === 'Movie' ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Duration</label>
                    <Input 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)} 
                      placeholder="e.g. 2h 28m" 
                      className="bg-slate-950 border-slate-700 text-white" 
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Release Year</label>
                    <Input 
                      type="number" 
                      value={year} 
                      onChange={(e) => setYear(e.target.value)} 
                      placeholder="e.g. 2024" 
                      className="bg-slate-950 border-slate-700 text-white" 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Genre</label>
                <Input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Action, Drama, Sci-Fi..."
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short description..."
                  className="bg-slate-950 border-slate-700 text-white resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Dialog Footer — Fixed at Bottom */}
          <DialogFooter className="m-0 shrink-0 px-5 py-3.5 sm:px-8 sm:py-4 border-t border-slate-800 bg-slate-900/95 flex flex-row justify-end items-center gap-3 rounded-b-2xl">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploadingPoster || isUploadingBackdrop}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 sm:px-8 text-sm font-medium shadow-sm transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </span>
              ) : (isUploadingPoster || isUploadingBackdrop) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading Image...</span>
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
