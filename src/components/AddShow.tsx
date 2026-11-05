import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Series } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Image as ImageIcon } from "lucide-react";

interface AddShowProps {
  seriesList: Series[];
  setSeriesList: (list: Series[]) => void;
  onCancel: () => void;
}

export default function AddShow({ seriesList, setSeriesList, onCancel }: AddShowProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('TV Series');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [duration, setDuration] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPoster(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newShow: Series = {
      id: new Date().getTime(),
      title,
      type,
      genre,
      year: type === 'Movie' && year ? parseInt(year, 10) : undefined,
      duration: type === 'Movie' ? duration : undefined,
      description,
      poster,
      status: 'Watching'
    };
    
    setSeriesList([...seriesList, newShow]);
    onCancel();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
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
            {/* Poster Section */}
            <div className="space-y-3 w-full md:w-48 shrink-0 flex flex-col items-center md:items-start">
              <label className="text-sm font-medium text-slate-300 self-start">Poster</label>
              <div className="w-36 sm:w-44 md:w-full aspect-2/3 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden flex flex-col items-center justify-center relative group shadow-inner">
                {poster ? (
                  <img src={poster} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-500 flex flex-col items-center gap-2 p-4 text-center">
                     <ImageIcon className="w-8 h-8 opacity-60" />
                     <span className="text-xs">Upload Poster<br/>JPG, PNG</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload poster image"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 flex-1 w-full min-w-0">
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
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 sm:px-8 text-sm font-medium shadow-sm transition-all"
            >
              Save
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
