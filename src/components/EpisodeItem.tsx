import type { Episode } from '../types';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle, Circle, PlayCircle } from "lucide-react";

interface EpisodeItemProps {
  ep: Episode; 
  seriesPoster?: string; 
  onToggleWatched: (id: number) => void; 
  onEdit: (ep: Episode) => void;         
  onDelete: (id: number) => void;        
}

export default function EpisodeItem({ ep, seriesPoster, onToggleWatched, onEdit, onDelete }: EpisodeItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900/50 hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-colors gap-3">
      
      <div className="flex items-center gap-4 flex-1">
        <span className="text-slate-500 font-mono w-6 text-sm">{ep.episodeNumber || '-'}</span>
        
        {seriesPoster ? (
          <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-slate-950 border border-slate-700">
            <img src={seriesPoster} alt="Thumbnail" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-14 shrink-0 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
          </div>
        )}

        <div className="flex items-center gap-3">
           {ep.watched ? (
             <CheckCircle className="w-5 h-5 text-green-500 cursor-pointer" onClick={() => onToggleWatched(ep.id)} />
           ) : (
             <Circle className="w-5 h-5 text-slate-600 cursor-pointer hover:text-slate-400" onClick={() => onToggleWatched(ep.id)} />
           )}
           <span className={`font-medium text-sm ${ep.watched ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
             {ep.title}
           </span>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:justify-end">
         {ep.link && (
           <a href={ep.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors">
              <PlayCircle className="w-4 h-4"/> {ep.platform || 'Link'}
           </a>
         )}
         <div className="flex gap-1 border-l border-slate-700 pl-4">
           <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-black" onClick={() => onEdit(ep)}>
             <Edit className="w-4 h-4"/>
           </Button>
           <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500/70 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDelete(ep.id)}>
             <Trash2 className="w-4 h-4"/>
           </Button>
         </div>
      </div>
    </div>
  );
}