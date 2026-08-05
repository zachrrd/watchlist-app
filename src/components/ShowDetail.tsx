import { useState } from 'react';
import type { Series, Episode } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";

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

export default function ShowDetail({ seriesId, seriesList, setSeriesList, episodeList, setEpisodeList, onBack, onEdit }: ShowDetailProps) {
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [editingEp, setEditingEp] = useState<Episode | null>(null);

  const show = seriesList.find(s => s.id === seriesId);
  const myEpisodes = episodeList.filter(ep => ep.seriesId === seriesId);

  if (!show) return <p className="text-white">Show not found!</p>;

  const watchedEpisodes = myEpisodes.filter(ep => ep.watched);
  const progress = myEpisodes.length > 0 ? Math.round((watchedEpisodes.length / myEpisodes.length) * 100) : 0;

  // --- HANDLER ---
  const toggleWatched = (episodeId: number) => {
    setEpisodeList(episodeList.map(ep => ep.id === episodeId ? { ...ep, watched: !ep.watched } : ep));
  };

  const handleDeleteSeries = () => {
    if (window.confirm(`Are you sure you want to delete "${show.title}" and all its episodes?`)) {
      if (setSeriesList) setSeriesList(seriesList.filter(s => s.id !== seriesId));
      setEpisodeList(episodeList.filter(ep => ep.seriesId !== seriesId));
      onBack();
    }
  };

  const handleDeleteEpisode = (id: number) => {
    if (window.confirm('Delete this episode?')) {
      setEpisodeList(episodeList.filter(ep => ep.id !== id));
    }
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
      // Mode Edit
      setEpisodeList(episodeList.map(ep => 
        ep.id === editingEp.id 
          ? { 
              ...ep, 
              title: formData.title!, 
              episodeNumber: formData.episodeNumber, 
              link: formData.link, 
              platform: formData.link?.includes('youtu') ? 'YouTube' : 'Others', 
              watched: formData.watched! 
            } 
          : ep
      ));
    } else {
      const newEp: Episode = {
        id: new Date().getTime(),
        seriesId: show.id,
        episodeNumber: formData.episodeNumber || myEpisodes.length + 1,
        title: formData.title!,
        link: formData.link,
        platform: formData.link?.includes('youtu') ? 'YouTube' : 'Others',
        watched: formData.watched!
      };
      setEpisodeList([...episodeList, newEp]);
    }
    closeEpisodeForm();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} className="text-slate-300 hover:text-white hover:bg-slate-800 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2"/> {show.title}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-200 hover:text-slate-900">
             <Edit className="w-4 h-4 mr-2"/> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteSeries} className="bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white border border-red-900/50">
             <Trash2 className="w-4 h-4"/>
          </Button>
        </div>
      </div>
      
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start bg-slate-900/30 p-6 rounded-xl border border-slate-800/50">
        <div className="w-56 rounded-lg overflow-hidden shrink-0 shadow-xl shadow-black/50 border border-slate-700/50">
          {show.poster ? (
            <img src={show.poster} alt={show.title} className="w-full h-auto object-cover" />
          ) : (
            <div className="w-full h-80 flex items-center justify-center bg-slate-800 text-slate-500">No Poster</div>
          )}
        </div>
        <div className="space-y-4 flex-1 w-full">
          <h1 className="text-3xl font-bold text-slate-50">{show.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">{show.type}</Badge>
            
            {show.type === 'Movie' ? (
              <span>{show.duration || 'Duration N/A'}</span>
            ) : (
              show.year && <span>{show.year}</span>
            )}
            
            {show.genre && <span>• {show.genre}</span>}
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">{show.description || "No description provided."}</p>
          
          <div className="pt-6 space-y-2">
             <div className="flex justify-between text-sm font-medium text-slate-300">
                <span>{watchedEpisodes.length} / {myEpisodes.length} episodes watched</span>
                <span className="text-indigo-400">{progress}%</span>
             </div>
             <Progress value={progress} className="h-2 [&>div]:bg-indigo-500" />
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-100">Episodes</h3>
          {!showEpisodeForm && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs" onClick={() => setShowEpisodeForm(true)}>
              <Plus className="w-4 h-4 mr-1"/> Add Episode
            </Button>
          )}
        </div>

        {showEpisodeForm && (
          <EpisodeForm 
            initialData={editingEp} 
            onSave={handleSaveEpisode} 
            onCancel={closeEpisodeForm} 
          />
        )}

        {/* Episode List */}
        <div className="space-y-2">
          {myEpisodes.length === 0 ? (
            <p className="text-slate-500 text-center py-8 bg-slate-900/20 rounded-lg border border-dashed border-slate-800">
              No episodes added yet.
            </p>
          ) : (
            myEpisodes
              .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
              .map((ep) => (
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
      </div>

    </div>
  );
}