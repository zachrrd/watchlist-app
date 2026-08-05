import { useState } from "react";
import type { Series, Episode } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Plus, MoreVertical, Search, PlayCircle } from "lucide-react";

interface WatchlistProps {
  seriesList: Series[];
  episodeList: Episode[];
  onAddClick: () => void;
  onSeriesClick: (id: number) => void;
}

export default function Watchlist({ seriesList, episodeList, onAddClick, onSeriesClick }: WatchlistProps) {
  const [search, setSearch] = useState("");

  const calculateProgress = (seriesId: number) => {
    const episodes = episodeList.filter((ep) => ep.seriesId === seriesId);
    if (episodes.length === 0) return 0;
    const watched = episodes.filter((ep) => ep.watched).length;
    return Math.round((watched / episodes.length) * 100);
  };

  const getEpisodeCount = (seriesId: number) =>
    episodeList.filter((ep) => ep.seriesId === seriesId).length;

  const filteredSeries = seriesList.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-2xl font-bold text-white">
          <PlayCircle className="text-indigo-500 w-8 h-8" />
          MyWatch
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search my watchlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-slate-200 w-full"
            />
          </div>
          <Button onClick={onAddClick} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-4">My Watchlist</h2>
        
        {filteredSeries.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12 text-center text-slate-500">
              No shows found.
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="space-y-4">
          {filteredSeries.map((show) => {
            const progress = calculateProgress(show.id);
            const episodeCount = getEpisodeCount(show.id);

            return (
              <Card
                key={show.id}
                onClick={() => onSeriesClick(show.id)}
                className="cursor-pointer bg-slate-900 border-slate-800 transition-all hover:border-indigo-500/50 hover:bg-slate-800/50"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Poster */}
                  <div className="w-20 shrink-0">
                    <AspectRatio ratio={2 / 3} className="overflow-hidden rounded-md bg-slate-800 border border-slate-700">
                      {show.poster ? (
                        <img src={show.poster} alt={show.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">No Image</div>
                      )}
                    </AspectRatio>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">{show.title}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                        <Badge variant="secondary" className="bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border-0">
                          {show.type}
                        </Badge>
                        <span>•</span>
                        {show.type === 'Movie' ? (
                          <span>{show.duration || 'Duration N/A'}</span>
                        ) : (
                          <span>{episodeCount} Episodes</span>
                        )}
                      </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-black" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-end text-xs font-medium text-slate-300">
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 [&>div]:bg-indigo-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}