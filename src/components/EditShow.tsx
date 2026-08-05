import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Series } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Image as ImageIcon, X } from "lucide-react";

interface EditShowProps {
  seriesId: number;
  seriesList: Series[];
  setSeriesList: (list: Series[]) => void;
  onCancel: () => void;
}

export default function EditShow({ seriesId, seriesList, setSeriesList, onCancel }: EditShowProps) {
  const currentShow = seriesList.find(s => s.id === seriesId);
  
  const [title, setTitle] = useState(currentShow?.title || '');
  const [type, setType] = useState(currentShow?.type || 'TV Series');
  const [genre, setGenre] = useState(currentShow?.genre || '');
  const [year, setYear] = useState(currentShow?.year?.toString() || '');
  const [description, setDescription] = useState(currentShow?.description || '');
  const [poster, setPoster] = useState(currentShow?.poster || '');
  const [status, setStatus] = useState(currentShow?.status || 'Watching');
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

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedList = seriesList.map(show => 
       show.id === seriesId 
         ? { ...show, title, type, genre, year: year ? parseInt(year, 10) : undefined, description, poster, status } 
         : show
    );
    setSeriesList(updatedList);
    onCancel();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="w-full sm:max-w-180 bg-slate-900 border-slate-800 text-slate-50 p-0 overflow-hidden shadow-2xl">
        <form onSubmit={handleUpdate}>
          
          <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-800/50 bg-slate-900/50">
            <DialogTitle className="text-2xl font-bold">Edit Show / Movie</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the details of your watchlist item.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 flex flex-col md:flex-row gap-8">
            {/* Poster Section */}
            <div className="space-y-4 w-full md:w-48 shrink-0 flex flex-col">
              <label className="text-sm font-medium text-slate-300">Poster</label>
              
              <div className="w-full aspect-2/3 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden flex flex-col items-center justify-center relative group">
                {poster ? (
                  <>
                    <img src={poster} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-0">
                      <span className="text-white text-xs font-medium">Change Poster</span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-600 flex flex-col items-center gap-2 p-4 text-center">
                     <ImageIcon className="w-8 h-8 opacity-50" />
                     <span className="text-xs">Upload Poster<br/>JPG, PNG</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>

              {poster && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setPoster('')}
                  className="w-full bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white border border-red-900/50 mt-2"
                >
                  <X className="w-4 h-4 mr-2" /> Remove
                </Button>
              )}
            </div>
            {/* Form Fields */}
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Title <span className="text-red-500">*</span></label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Breaking Bad" className="bg-slate-950 border-slate-700 text-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Type <span className="text-red-500">*</span></label>
                  <Select value={type} onValueChange={(val) => setType(val || 'TV Series')}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="TV Series">TV Series</SelectItem>
                      <SelectItem value="Movie">Movie</SelectItem>
                      <SelectItem value="Anime">Anime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Status</label>
                  <Select value={status} onValueChange={(val) => setStatus(val || 'Watching')}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="Watching">Watching</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Plan to Watch">Plan to Watch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Genre</label>
                  <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Action, Drama, Sci-Fi..." className="bg-slate-950 border-slate-700 text-white" />
                </div>
                {type === 'Movie' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Duration</label>
                    <Input 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)} 
                      placeholder="e.g. 2h 28m" 
                      className="bg-slate-950 border-slate-700 text-white" 
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Short description..." className="bg-slate-950 border-slate-700 text-white resize-none" />
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-4 border-t border-slate-800 bg-slate-900/50 m-2">
            <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-black">Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">Save Changes</Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}