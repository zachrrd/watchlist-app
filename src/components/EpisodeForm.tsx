import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Episode } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface EpisodeFormProps {
  initialData: Episode | null;  
  onSave: (data: Partial<Episode>) => void;  
  onCancel: () => void; 
}

export default function EpisodeForm({ initialData, onSave, onCancel }: EpisodeFormProps) {
   const [epTitle, setEpTitle] = useState(initialData?.title || '');
  const [epNumber, setEpNumber] = useState(initialData?.episodeNumber?.toString() || '');
  const [epLink, setEpLink] = useState(initialData?.link || '');
  const [epWatched, setEpWatched] = useState(initialData?.watched || false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!epTitle.trim()) return;

     onSave({
      title: epTitle,
      episodeNumber: Number(epNumber),
      link: epLink,
      watched: epWatched,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-5 rounded-lg border border-slate-700 shadow-lg">
      <div className="md:col-span-2 flex justify-between items-center mb-2">
        <h4 className="font-semibold text-slate-200">
          {initialData ? 'Edit Episode' : 'Add New Episode'}
        </h4>
      </div>
      
      <div className="space-y-2">
         <label className="text-xs text-slate-400">Episode Number *</label>
         <Input value={epNumber} onChange={(e) => setEpNumber(e.target.value)} required className="bg-slate-950 border-slate-700 text-white" />
      </div>
      
      <div className="space-y-2">
         <label className="text-xs text-slate-400">Episode Title *</label>
         <Input value={epTitle} onChange={(e) => setEpTitle(e.target.value)} required className="bg-slate-950 border-slate-700 text-white" />
      </div>
      
      <div className="space-y-2 md:col-span-2">
         <label className="text-xs text-slate-400">Link (YouTube / Netflix / Others)</label>
         <Input value={epLink} onChange={(e) => setEpLink(e.target.value)} placeholder="https://..." className="bg-slate-950 border-slate-700 text-white" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-xs text-slate-400">Status</Label>
        <RadioGroup 
          value={epWatched ? "watched" : "not-watched"} 
          onValueChange={(val) => setEpWatched(val === "watched")}
          className="flex gap-6 pt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not-watched" id="r-not-watched" className="border-slate-700 text-indigo-500" />
            <Label htmlFor="r-not-watched" className="text-sm text-slate-300 cursor-pointer font-normal">Not Watched</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="watched" id="r-watched" className="border-slate-700 text-indigo-500" />
            <Label htmlFor="r-watched" className="text-sm text-slate-300 cursor-pointer font-normal">Watched</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
         <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-black">Cancel</Button>
         <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
           {initialData ? 'Save Changes' : 'Save Episode'}
         </Button>
      </div>
    </form>
  );
}