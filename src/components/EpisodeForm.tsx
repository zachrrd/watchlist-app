import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Episode } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { detectPlatform } from "@/lib/utils";

interface EpisodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Episode | null;
  onSave: (data: Partial<Episode>) => void;
  onCancel: () => void;
  defaultEpisodeNumber?: number;
  isLoading?: boolean;
  error?: string | null;
}

export default function EpisodeForm({
  open,
  onOpenChange,
  initialData,
  onSave,
  onCancel,
  defaultEpisodeNumber,
  isLoading = false,
  error,
}: EpisodeFormProps) {
  const [epTitle, setEpTitle] = useState(initialData?.title || '');
  const [epSeason, setEpSeason] = useState(initialData?.season?.toString() || '1');
  const [epNumber, setEpNumber] = useState(
    initialData?.episodeNumber !== undefined
      ? initialData.episodeNumber.toString()
      : defaultEpisodeNumber !== undefined
      ? defaultEpisodeNumber.toString()
      : '1'
  );
  const [epLink, setEpLink] = useState(initialData?.link || '');
  const [epWatched, setEpWatched] = useState(initialData?.watched || false);
  const [epNotes, setEpNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!epTitle.trim() || isLoading) return;

    onSave({
      title: epTitle.trim(),
      season: epSeason ? parseInt(epSeason, 10) : undefined,
      episodeNumber: epNumber ? parseInt(epNumber, 10) : undefined,
      link: epLink.trim() || undefined,
      notes: epNotes.trim() || undefined,
      watched: epWatched,
    });
  };

  const detected = epLink.trim() ? detectPlatform(epLink) : null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isLoading) onOpenChange(val); }}>
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101116] p-0 text-zinc-100 shadow-2xl sm:w-full sm:max-w-md"
        showCloseButton={!isLoading}
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-white/[0.07] bg-[#101116] px-5 py-4 pr-12 sm:px-6">
            <DialogTitle className="text-base font-semibold tracking-tight text-white sm:text-lg">
              {initialData ? 'Edit Episode' : 'Add New Episode'}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {initialData
                ? 'Update episode information and streaming details.'
                : 'Track a new episode with streaming link and watch status.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-950/35 px-3.5 py-3 text-xs text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium">Failed to save episode</p>
                  <p className="mt-0.5 text-red-200/80">{error}</p>
                </div>
              </div>
            )}

            {/* Season & Episode Number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Season
                </label>
                <Input
                  type="number"
                  min="1"
                  value={epSeason}
                  onChange={(e) => setEpSeason(e.target.value)}
                  placeholder="1"
                  className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Episode Number <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={epNumber}
                  onChange={(e) => setEpNumber(e.target.value)}
                  required
                  placeholder="1"
                  className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Episode Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Episode Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                required
                placeholder="e.g. Chapter One: The Vanishing"
                className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              />
            </div>

            {/* Watch Link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">
                  Watch Link (URL)
                </label>
                {detected && (
                  <span className="text-[11px] font-medium text-indigo-400">
                    Platform: {detected}
                  </span>
                )}
              </div>
              <Input
                value={epLink}
                onChange={(e) => setEpLink(e.target.value)}
                placeholder="https://netflix.com/watch/..."
                className="h-10 rounded-lg border-white/[0.09] bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              />
            </div>

            {/* Watched Status */}
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-zinc-300">
                Watch Status
              </Label>
              <RadioGroup
                value={epWatched ? 'watched' : 'not-watched'}
                onValueChange={(val) => setEpWatched(val === 'watched')}
                className="flex gap-6 pt-0.5"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="not-watched"
                    id="ep-not-watched"
                    className="border-white/25 text-indigo-500"
                  />
                  <Label
                    htmlFor="ep-not-watched"
                    className="cursor-pointer text-xs font-normal text-zinc-300"
                  >
                    Not Watched
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="watched"
                    id="ep-watched"
                    className="border-white/25 text-indigo-500"
                  />
                  <Label
                    htmlFor="ep-watched"
                    className="cursor-pointer text-xs font-normal text-zinc-300"
                  >
                    Watched
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notes (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Notes (Optional)
              </label>
              <Textarea
                value={epNotes}
                onChange={(e) => setEpNotes(e.target.value)}
                placeholder="Key moments, timestamps, thoughts..."
                rows={2}
                className="resize-none rounded-lg border-white/[0.09] bg-[#09090b] text-xs text-zinc-100 placeholder:text-zinc-400/65 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              />
            </div>
          </div>

          <DialogFooter className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.07] bg-[#101116] px-5 py-3.5 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
              className="h-9 rounded-lg px-3 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="h-9 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.5)] hover:bg-indigo-400 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : initialData ? (
                'Save Changes'
              ) : (
                'Add Episode'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
