import { useState, useEffect } from 'react';
import type { Series, Episode } from './types';
import Watchlist from './components/WatchList';
import AddShow from './components/AddShow';
import ShowDetail from './components/ShowDetail';
import EditShow from './components/EditShow';
import { initialDummySeries, initialDummyEpisodes } from './data/initialData';

export default function App() {
  // --- STATE DATA ---
  const [seriesList, setSeriesList] = useState<Series[]>(() => {
    const saved = localStorage.getItem('series');
    return saved ? JSON.parse(saved) : initialDummySeries;
  });

  const [episodeList, setEpisodeList] = useState<Episode[]>(() => {
    const saved = localStorage.getItem('episodes');
    return saved ? JSON.parse(saved) : initialDummyEpisodes;
  });

  // --- STATE VIEW ---
  const [currentView, setCurrentView] = useState<'watchlist' | 'add' | 'detail' | 'edit'>('watchlist');
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);

  // --- LOCAL STORAGE SYNC ---
  useEffect(() => {
    localStorage.setItem('series', JSON.stringify(seriesList));
  }, [seriesList]);

  useEffect(() => {
    localStorage.setItem('episodes', JSON.stringify(episodeList));
  }, [episodeList]);

  useEffect(() => {
    const handleHashChange = () => {

      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'add') {
        setCurrentView('add');
      } else if (hash.startsWith('detail-')) {
        setCurrentView('detail');

        setSelectedSeriesId(Number(hash.split('-')[1]));
      } else if (hash.startsWith('edit-')) {
        setCurrentView('edit');
        setSelectedSeriesId(Number(hash.split('-')[1]));
      } else {

        setCurrentView('watchlist');
        setSelectedSeriesId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- FUNGSI NAVIGASI ---
  const goToAddShow = () => { window.location.hash = 'add'; };
  
  const goToWatchlist = () => { 
    window.location.hash = ''; 
    window.history.replaceState(null, '', ' '); 
  };
  
  const goToShowDetail = (id: number) => { window.location.hash = `detail-${id}`; };
  const goToEditShow = () => { window.location.hash = `edit-${selectedSeriesId}`; };

  // --- RENDER COMPONENT ---
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans">
      <main className="flex-auto p-6 max-w-full">
        
        {(currentView === 'watchlist' || currentView === 'add') && (
          <Watchlist
            seriesList={seriesList}
            episodeList={episodeList}
            onAddClick={goToAddShow}
            onSeriesClick={goToShowDetail}
          />
        )}
        
        {currentView === 'add' && (
          <AddShow seriesList={seriesList} setSeriesList={setSeriesList} onCancel={goToWatchlist} />
        )}
        
        {(currentView === 'detail' || currentView === 'edit') && selectedSeriesId && (
          <ShowDetail
            seriesId={selectedSeriesId} 
            seriesList={seriesList}
            setSeriesList={setSeriesList}
            episodeList={episodeList} 
            setEpisodeList={setEpisodeList} 
            onBack={goToWatchlist}
            onEdit={goToEditShow}
          />
        )}
        
        {currentView === 'edit' && selectedSeriesId && (
          <EditShow
            seriesId={selectedSeriesId} 
            seriesList={seriesList}
            setSeriesList={setSeriesList} 
            onCancel={() => goToShowDetail(selectedSeriesId)}
          />
        )}

      </main>
    </div>
  );
}