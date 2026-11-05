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
import { detectPlatform } from "@/lib/utils";

interface EpisodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Episode | null;
  onSave: (data: Partial<Episode>) => void;
  onCancel: () => void;
  defaultEpisodeNumber?: number;
}

export default function EpisodeForm({
  open,
  onOpenChange,
  initialData,
  onSave,
  onCancel,
  defaultEpisodeNumber,
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
    if (!epTitle.trim()) return;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md max-h-[90dvh] flex flex-col bg-slate-900 border-slate-800 text-slate-50 p-0 overflow-hidden shadow-2xl rounded-2xl"
        showCloseButton={true}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 border-b border-slate-800/80 shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-100">
              {initialData ? 'Edit Episode' : 'Add New Episode'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {initialData
                ? 'Update episode information and streaming details.'
                : 'Track a new episode with streaming link and watch status.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Season & Episode Number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Season</label>
                <Input
                  type="number"
                  min="1"
                  value={epSeason}
                  onChange={(e) => setEpSeason(e.target.value)}
                  placeholder="1"
                  className="bg-slate-950 border-slate-800 text-white text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Episode Number <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={epNumber}
                  onChange={(e) => setEpNumber(e.target.value)}
                  required
                  placeholder="1"
                  className="bg-slate-950 border-slate-800 text-white text-sm h-9"
                />
              </div>
            </div>

            {/* Episode Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Episode Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                required
                placeholder="e.g. Chapter One: The Vanishing"
                className="bg-slate-950 border-slate-800 text-white text-sm h-9"
              />
            </div>

            {/* Watch Link */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">
                  Watch Link (URL)
                </label>
                {detected && (
                  <span className="text-[11px] text-indigo-400 font-medium">
                    Platform: {detected}
                  </span>
                )}
              </div>
              <Input
                value={epLink}
                onChange={(e) => setEpLink(e.target.value)}
                placeholder="https://netflix.com/watch/..."
                className="bg-slate-950 border-slate-800 text-white text-sm h-9"
              />
            </div>

            {/* Watched Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Watch Status</Label>
              <RadioGroup
                value={epWatched ? 'watched' : 'not-watched'}
                onValueChange={(val) => setEpWatched(val === 'watched')}
                className="flex gap-6 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="not-watched"
                    id="ep-not-watched"
                    className="border-slate-700 text-indigo-500"
                  />
                  <Label
                    htmlFor="ep-not-watched"
                    className="text-xs text-slate-300 cursor-pointer font-normal"
                  >
                    Not Watched
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="watched"
                    id="ep-watched"
                    className="border-slate-700 text-indigo-500"
                  />
                  <Label
                    htmlFor="ep-watched"
                    className="text-xs text-slate-300 cursor-pointer font-normal"
                  >
                    Watched
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notes (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Notes (Optional)</label>
              <Textarea
                value={epNotes}
                onChange={(e) => setEpNotes(e.target.value)}
                placeholder="Key moments, timestamps, thoughts..."
                rows={2}
                className="bg-slate-950 border-slate-800 text-white text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-slate-800/80 shrink-0 flex items-center justify-end gap-2 bg-slate-900/90">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9 px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4 font-medium"
            >
              {initialData ? 'Save Changes' : 'Add Episode'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
